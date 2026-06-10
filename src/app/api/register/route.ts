import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return Response.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existing = await (prisma as any).user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    await (prisma as any).user.create({
      data: { name, email, password: hashed },
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Registration failed' }, { status: 500 })
  }
}
