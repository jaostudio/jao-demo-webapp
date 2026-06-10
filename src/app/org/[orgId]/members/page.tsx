import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { addMember, removeMember } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function MembersPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const membership = await (prisma as any).orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    include: { organization: true },
  })
  if (!membership) redirect('/orgs')

  const members = await (prisma as any).orgMembership.findMany({
    where: { organizationId: orgId },
    include: { user: true },
    orderBy: { role: 'asc' },
  })

  const canManage = membership.role === 'OWNER' || membership.role === 'ADMIN'

  const roleColors: Record<string, string> = {
    OWNER: 'bg-red-100 text-red-700',
    ADMIN: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-green-100 text-green-700',
    VIEWER: 'bg-gray-100 text-gray-700',
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">Members</h1>
        <p className="mb-6 text-sm text-gray-500">{membership.organization.name} · {members.length} members</p>

        <div className="space-y-2">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                  {m.user.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.user.name}</p>
                  <p className="text-xs text-gray-500">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[m.role]}`}>{m.role}</span>
                {canManage && m.role !== 'OWNER' && (
                  <form action={removeMember.bind(null, orgId, m.id)}>
                    <button type="submit" className="text-xs text-red-600 hover:underline">Remove</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        {canManage && (
          <div className="mt-8 rounded-lg border p-6">
            <h2 className="mb-4 font-semibold">Add Member</h2>
            <form action={addMember.bind(null, orgId)} className="flex gap-3">
              <input name="email" type="email" placeholder="Email" required
                className="flex-1 rounded-lg border px-3 py-2 text-sm" />
              <select name="role" required className="rounded-lg border px-3 py-2 text-sm">
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">Add</button>
            </form>
          </div>
        )}
      </main>
    </>
  )
}
