import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { deleteOrg } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const membership = await (prisma as any).orgMembership.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
    include: { organization: true },
  })
  if (!membership || membership.role === 'VIEWER') redirect(`/org/${orgId}`)

  const org = membership.organization

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">Settings</h1>
        <p className="mb-8 text-sm text-gray-500">{org.name}</p>

        <div className="mb-6 rounded-lg border p-6">
          <h2 className="mb-4 font-semibold">Organization Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd>{org.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Slug</dt>
              <dd>{org.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd>{new Date(org.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {membership.role === 'OWNER' && (
          <div className="rounded-lg border border-red-200 p-6">
            <h2 className="mb-2 font-semibold text-red-700">Danger Zone</h2>
            <p className="mb-4 text-sm text-gray-600">Deleting the organization removes all projects, tasks, and data.</p>
            <form action={deleteOrg.bind(null, orgId)}>
              <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                onClick={(e: any) => { if (!confirm('Delete this organization permanently?')) e.preventDefault() }}>
                Delete Organization
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  )
}
