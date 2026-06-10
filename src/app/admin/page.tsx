import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const [orgs, users] = await Promise.all([
    (prisma as any).organization.findMany({
      include: { _count: { select: { memberships: true, projects: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    (prisma as any).user.findMany({
      include: { _count: { select: { memberships: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Admin</h1>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">{orgs.length}</p>
            <p className="text-sm text-gray-500">Organizations</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">{users.length}</p>
            <p className="text-sm text-gray-500">Users</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-2xl font-bold">{orgs.reduce((s: number, o: any) => s + o._count.projects, 0)}</p>
            <p className="text-sm text-gray-500">Total Projects</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Organizations</h2>
          <div className="space-y-2">
            {orgs.map((org: any) => (
              <div key={org.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-gray-500">{org._count.memberships} members · {org._count.projects} projects</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(org.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Users</h2>
          <div className="space-y-2">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email} · {u._count.memberships} orgs</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
