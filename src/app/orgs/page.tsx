import { getCurrentUser } from '@/lib/auth/get-session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { createOrg } from '@/lib/actions'

export const dynamic = 'force-dynamic'

export default async function OrgsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/signin')

  const memberships = await (prisma as any).orgMembership.findMany({
    where: { userId: user.id },
    include: { organization: true },
  })

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-2xl font-bold">Organizations</h1>
        <p className="mb-8 text-sm text-gray-500">Select an organization or create a new one.</p>

        <div className="mb-8 space-y-3">
          {memberships.map((m: any) => (
            <Link key={m.id} href={`/org/${m.organization.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-sm">
              <div>
                <p className="font-medium">{m.organization.name}</p>
                <p className="text-xs text-gray-500">{m.role} · {m.organization.slug}</p>
              </div>
              <span className="text-xs text-gray-400">&rarr;</span>
            </Link>
          ))}
          {memberships.length === 0 && (
            <p className="rounded-lg border p-4 text-sm text-gray-500">You are not a member of any organization yet.</p>
          )}
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 font-semibold">Create Organization</h2>
          <form action={createOrg} className="flex gap-3">
            <input name="name" placeholder="Organization name" required
              className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700">Create</button>
          </form>
        </div>
      </main>
    </>
  )
}
