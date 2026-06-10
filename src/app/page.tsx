import Link from 'next/link'
import { Header } from '@/components/header'

export default function WebAppHome() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Project Management SaaS</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
            A multi-tenant project management platform with Kanban boards, task workflows,
            team collaboration, and org-level access control.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/orgs" className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700">
              View Organizations
            </Link>
            <Link href="/signin" className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-gray-50">
              Sign In
            </Link>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Multi-Tenant Orgs', desc: 'Organization-level isolation with OWNER, ADMIN, MEMBER, and VIEWER roles.' },
            { title: 'Kanban Board', desc: 'Task management with Backlog → Todo → In Progress → In Review → Done.' },
            { title: 'Task Machine', desc: 'Local state machine for task lifecycle — coexists with shared platform machines.' },
            { title: 'Activity Log', desc: 'Full audit trail of all actions with causationId chains.' },
            { title: 'Team Collaboration', desc: 'Comments, assignments, and notifications for team workflows.' },
            { title: 'Org Isolation', desc: 'All data scoped by organization — no cross-org data leaks.' },
          ].map((m) => (
            <div key={m.title} className="rounded-xl border p-6">
              <h3 className="font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{m.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </>
  )
}
