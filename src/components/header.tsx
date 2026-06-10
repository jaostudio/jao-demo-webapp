'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()
  const user = session?.user as any

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">Web App</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/orgs" className="hover:underline">Organizations</Link>
          {session ? (
            <>
              <span className="text-gray-500">{user?.name}</span>
              <button onClick={() => signOut()} className="hover:underline">Sign Out</button>
            </>
          ) : (
            <Link href="/signin" className="hover:underline">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
