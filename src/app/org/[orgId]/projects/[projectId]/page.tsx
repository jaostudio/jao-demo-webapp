import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { createTask, transitionTaskAction, archiveProject } from '@/lib/actions'
import { getValidTransitions } from '@/lib/machine/task-machine'

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: { params: Promise<{ orgId: string; projectId: string }> }) {
  const { orgId, projectId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const membership = await (prisma as any).orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  })
  if (!membership) redirect('/orgs')

  const project = await (prisma as any).project.findUnique({
    where: { id: projectId },
    include: { tasks: { include: { assignee: true }, orderBy: { position: 'asc' } }, createdBy: true },
  })
  if (!project || project.organizationId !== orgId) notFound()

  const dbToLocal: Record<string, string> = { BACKLOG: 'backlog', TODO: 'todo', IN_PROGRESS: 'in_progress', IN_REVIEW: 'in_review', DONE: 'done' }

  const columns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
  const columnLabels: Record<string, string> = { BACKLOG: 'Backlog', TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' }
  const columnColors: Record<string, string> = { BACKLOG: 'bg-gray-100', TODO: 'bg-blue-50', IN_PROGRESS: 'bg-yellow-50', IN_REVIEW: 'bg-purple-50', DONE: 'bg-green-50' }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">
              <Link href={`/org/${orgId}`} className="hover:underline">{project.organizationId}</Link>
              {' / '}
              <span>{project.title}</span>
            </div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-sm text-gray-500">{project.description} · {project.tasks.length} tasks</p>
          </div>
          {membership.role === 'OWNER' || membership.role === 'ADMIN' ? (
            <form action={archiveProject.bind(null, orgId, projectId)}>
              <button type="submit" className="rounded-lg border px-3 py-1.5 text-sm hover:bg-red-50">Archive</button>
            </form>
          ) : null}
        </div>

        <div className="mb-6 rounded-lg border p-4">
          <h2 className="mb-3 font-semibold">New Task</h2>
          <form action={createTask.bind(null, orgId, projectId)} className="flex gap-3">
            <input name="title" placeholder="Task title" required className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">Add</button>
          </form>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colTasks = project.tasks.filter((t: any) => t.status === col)
            return (
              <div key={col} className={`min-w-[260px] shrink-0 rounded-lg ${columnColors[col]} p-3`}>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">{columnLabels[col]} ({colTasks.length})</h3>
                <div className="space-y-2">
                  {colTasks.map((task: any) => {
                    const localState = dbToLocal[task.status] ?? 'backlog'
                    const events = getValidTransitions(localState as any)
                    return (
                      <div key={task.id} className="rounded-lg border bg-white p-3 shadow-sm">
                        <Link href={`/org/${orgId}/projects/${projectId}/tasks/${task.id}`}
                          className="block font-medium hover:text-gray-600">
                          {task.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          {task.assignee && <span>{task.assignee.name}</span>}
                          {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {events.map((ev) => (
                            <form key={ev} action={transitionTaskAction.bind(null, orgId, projectId, task.id, ev)}>
                              <button type="submit" className="rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200">
                                {ev}
                              </button>
                            </form>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </>
  )
}
