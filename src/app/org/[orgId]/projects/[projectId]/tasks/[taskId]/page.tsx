import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { addComment, transitionTaskAction } from '@/lib/actions'
import { getValidTransitions } from '@/lib/machine/task-machine'

export const dynamic = 'force-dynamic'

export default async function TaskPage({ params }: { params: Promise<{ orgId: string; projectId: string; taskId: string }> }) {
  const { orgId, projectId, taskId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const membership = await (prisma as any).orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  })
  if (!membership) redirect('/orgs')

  const task = await (prisma as any).task.findUnique({
    where: { id: taskId },
    include: { assignee: true, createdBy: true, project: true, comments: { include: { author: true }, orderBy: { createdAt: 'asc' } } },
  })
  if (!task) notFound()

  const dbToLocal: Record<string, string> = { BACKLOG: 'backlog', TODO: 'todo', IN_PROGRESS: 'in_progress', IN_REVIEW: 'in_review', DONE: 'done' }
  const localState = dbToLocal[task.status] ?? 'backlog'
  const events = getValidTransitions(localState as any)

  const statusLabels: Record<string, string> = { BACKLOG: 'Backlog', TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' }
  const statusColors: Record<string, string> = { BACKLOG: 'bg-gray-100 text-gray-700', TODO: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-yellow-100 text-yellow-700', IN_REVIEW: 'bg-purple-100 text-purple-700', DONE: 'bg-green-100 text-green-700' }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-4 text-sm text-gray-500">
          <Link href={`/org/${orgId}`} className="hover:underline">Org</Link>
          {' / '}
          <Link href={`/org/${orgId}/projects/${projectId}`} className="hover:underline">{task.project.title}</Link>
          {' / '}
          <span>{task.title}</span>
        </div>

        <div className="mb-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
          </div>
          <div className="mt-2 flex gap-4 text-sm text-gray-500">
            <span>Created by {task.createdBy.name}</span>
            {task.assignee && <span>Assigned to {task.assignee.name}</span>}
            {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
          </div>
        </div>

        {task.description && (
          <div className="mb-6 rounded-lg border p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {events.map((ev) => (
            <form key={ev} action={transitionTaskAction.bind(null, orgId, projectId, taskId, ev)}>
              <button type="submit" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">
                {ev.replace('_', ' ')}
              </button>
            </form>
          ))}
        </div>

        <div className="mb-6 border-t pt-6">
          <h2 className="mb-4 font-semibold">Comments ({task.comments.length})</h2>
          <div className="space-y-3">
            {task.comments.map((c: any) => (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{c.author.name}</span>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm">{c.content}</p>
              </div>
            ))}
          </div>

          <form action={addComment.bind(null, orgId, projectId, taskId)} className="mt-4 flex gap-3">
            <input name="content" placeholder="Add a comment..." required
              className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">Comment</button>
          </form>
        </div>
      </main>
    </>
  )
}
