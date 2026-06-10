import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { createProject } from '@/lib/actions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const membership = await (prisma as any).orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    include: { organization: true },
  })
  if (!membership) redirect('/orgs')

  const projects = await (prisma as any).project.findMany({
    where: { organizationId: orgId },
    include: { tasks: true, createdBy: true },
    orderBy: { updatedAt: 'desc' },
  })

  const org = membership.organization

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-sm text-gray-500">{membership.role} · {projects.length} projects</p>
          </div>
          <div className="flex gap-2 text-sm">
            <Link href={`/org/${orgId}/members`} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Members</Link>
            {membership.role !== 'VIEWER' && (
              <Link href={`/org/${orgId}/settings`} className="rounded-lg border px-3 py-1.5 hover:bg-gray-50">Settings</Link>
            )}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-xs text-gray-500">Projects</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{projects.reduce((s: number, p: any) => s + p.tasks.length, 0)}</p>
            <p className="text-xs text-gray-500">Total Tasks</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{projects.reduce((s: number, p: any) => s + p.tasks.filter((t: any) => t.status === 'DONE').length, 0)}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{projects.filter((p: any) => p.status === 'ACTIVE').length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
        </div>

        <div className="space-y-3">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/org/${orgId}/projects/${project.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-sm">
              <div>
                <p className="font-medium">{project.title}</p>
                <p className="text-xs text-gray-500">{project.tasks.length} tasks · by {project.createdBy.name}</p>
              </div>
              <span className="text-xs text-gray-400">&rarr;</span>
            </Link>
          ))}
        </div>

        {membership.role !== 'VIEWER' && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 font-semibold">New Project</h2>
            <form action={createProject.bind(null, orgId)} className="space-y-3">
              <input name="title" placeholder="Project title" required
                className="w-full rounded-lg border px-3 py-2 text-sm" />
              <input name="description" placeholder="Description (optional)"
                className="w-full rounded-lg border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">Create</button>
            </form>
          </div>
        )}
      </main>
    </>
  )
}
