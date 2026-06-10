'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Registration failed'); return }
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.ok) { router.push('/orgs'); router.refresh() }
  }

  return (
    <div className="mx-auto mt-20 max-w-md px-4">
      <h1 className="mb-8 text-center text-3xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
          <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2" />
        </div>
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
        <button type="submit" className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-700">Register</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account? <Link href="/signin" className="underline">Sign in</Link>
      </p>
    </div>
  )
}
