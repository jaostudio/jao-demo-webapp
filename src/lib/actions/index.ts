'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { transitionTask } from '@/lib/machine/task-machine'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function getAuthUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  return (session.user as any).id
}

async function checkOrgMembership(userId: string, orgId: string, minRole?: string) {
  const membership = await (prisma as any).orgMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  })
  if (!membership) throw new Error('Not a member of this organization')

  const hierarchy: Record<string, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 }
  if (minRole && (hierarchy[membership.role] ?? -1) < (hierarchy[minRole] ?? 0)) {
    throw new Error('Insufficient role')
  }

  return membership
}

function logActivity(orgId: string, userId: string | null, action: string, entityType: string, entityId: string, causationId?: string) {
  return (prisma as any).activityLog.create({
    data: { action, entityType, entityId, organizationId: orgId, userId, causationId },
  })
}

// ── Organization ──

export async function createOrg(formData: FormData) {
  const userId = await getAuthUser()
  const name = formData.get('name') as string
  const slug = slugify(name)
  const existing = await (prisma as any).organization.findUnique({ where: { slug } })
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug

  const org = await (prisma as any).organization.create({
    data: {
      name,
      slug: finalSlug,
      memberships: { create: { userId, role: 'OWNER' } },
    },
  })

  revalidatePath('/orgs')
  redirect(`/org/${org.id}`)
}

export async function deleteOrg(orgId: string) {
  const userId = await getAuthUser()
  const membership = await checkOrgMembership(userId, orgId, 'OWNER')
  await (prisma as any).organization.delete({ where: { id: orgId } })
  revalidatePath('/orgs')
  redirect('/orgs')
}

// ── Project ──

export async function createProject(orgId: string, formData: FormData) {
  const userId = await getAuthUser()
  await checkOrgMembership(userId, orgId, 'MEMBER')

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null

  const project = await (prisma as any).project.create({
    data: { title, description, organizationId: orgId, createdById: userId },
  })

  await logActivity(orgId, userId, 'project.created', 'project', project.id)
  revalidatePath(`/org/${orgId}`)
  redirect(`/org/${orgId}/projects/${project.id}`)
}

export async function archiveProject(orgId: string, projectId: string) {
  const userId = await getAuthUser()
  await checkOrgMembership(userId, orgId, 'ADMIN')

  await (prisma as any).project.update({
    where: { id: projectId },
    data: { status: 'ARCHIVED' },
  })

  await logActivity(orgId, userId, 'project.archived', 'project', projectId)
  revalidatePath(`/org/${orgId}`)
}

// ── Task ──

export async function createTask(orgId: string, projectId: string, formData: FormData) {
  const userId = await getAuthUser()
  await checkOrgMembership(userId, orgId, 'MEMBER')

  const title = formData.get('title') as string
  const description = formData.get('description') as string | null
  const assigneeId = formData.get('assigneeId') as string | null

  const maxPos = await (prisma as any).task.aggregate({
    where: { projectId },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  const task = await (prisma as any).task.create({
    data: { title, description, position, projectId, assigneeId: assigneeId || null, createdById: userId },
  })

  await logActivity(orgId, userId, 'task.created', 'task', task.id)
  revalidatePath(`/org/${orgId}/projects/${projectId}`)
}

export async function transitionTaskAction(orgId: string, projectId: string, taskId: string, event: string) {
  const userId = await getAuthUser()
  const membership = await checkOrgMembership(userId, orgId, 'MEMBER')

  const task = await (prisma as any).task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('Task not found')

  const dbToLocal: Record<string, string> = {
    BACKLOG: 'backlog',
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    IN_REVIEW: 'in_review',
    DONE: 'done',
  }
  const localToDb: Record<string, string> = {
    backlog: 'BACKLOG',
    todo: 'TODO',
    in_progress: 'IN_PROGRESS',
    in_review: 'IN_REVIEW',
    done: 'DONE',
  }

  const localState = dbToLocal[task.status] ?? 'backlog'
  const result = transitionTask(
    localState as any,
    event as any,
    { actor: membership.role.toLowerCase(), isAssignee: task.assigneeId === userId },
  )

  const newDbStatus = localToDb[result as string]
  if (!newDbStatus || newDbStatus === task.status) return

  await (prisma as any).task.update({
    where: { id: taskId },
    data: { status: newDbStatus },
  })

  await logActivity(orgId, userId, `task.${event}`, 'task', taskId)

  revalidatePath(`/org/${orgId}/projects/${projectId}`)
}

export async function addComment(orgId: string, projectId: string, taskId: string, formData: FormData) {
  const userId = await getAuthUser()
  await checkOrgMembership(userId, orgId, 'MEMBER')

  const content = formData.get('content') as string
  if (!content) return

  await (prisma as any).comment.create({
    data: { content, taskId, authorId: userId },
  })

  await logActivity(orgId, userId, 'comment.created', 'comment', taskId)
  revalidatePath(`/org/${orgId}/projects/${projectId}/tasks/${taskId}`)
}

// ── Members ──

export async function addMember(orgId: string, formData: FormData) {
  const userId = await getAuthUser()
  await checkOrgMembership(userId, orgId, 'ADMIN')

  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const user = await (prisma as any).user.findUnique({ where: { email } })
  if (!user) throw new Error('User not found')

  await (prisma as any).orgMembership.create({
    data: { userId: user.id, organizationId: orgId, role },
  })

  revalidatePath(`/org/${orgId}/members`)
}

export async function removeMember(orgId: string, membershipId: string) {
  const userId = await getAuthUser()
  await checkOrgMembership(userId, orgId, 'ADMIN')

  await (prisma as any).orgMembership.delete({ where: { id: membershipId } })
  revalidatePath(`/org/${orgId}/members`)
}

// ── Notification ──

export async function markNotificationRead(notificationId: string) {
  const userId = await getAuthUser()
  await (prisma as any).notification.update({
    where: { id: notificationId, userId },
    data: { read: true },
  })
}
