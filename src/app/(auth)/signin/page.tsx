'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) setError('Invalid email or password')
    else { router.push('/orgs'); router.refresh() }
  }

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <h1 className="mb-8 text-center text-3xl font-bold">Sign In</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700">Sign In</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        No account? <Link href="/register" className="underline">Register</Link>
      </p>
    </div>
  )
}
