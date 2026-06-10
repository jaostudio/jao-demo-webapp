import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

export async function getSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user) return null
  const user = session.user as any
  return { id: user.id, name: user.name, email: user.email }
}
