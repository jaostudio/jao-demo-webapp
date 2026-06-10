import { PrismaClient } from '@prisma/webapp-client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('password123', 10)

  const owner = await prisma.user.upsert({
    where: { email: 'alice@demo.dev' },
    update: {},
    create: { name: 'Alice Chen', email: 'alice@demo.dev', password, image: null },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'bob@demo.dev' },
    update: {},
    create: { name: 'Bob Martinez', email: 'bob@demo.dev', password, image: null },
  })

  const member = await prisma.user.upsert({
    where: { email: 'carol@demo.dev' },
    update: {},
    create: { name: 'Carol Nguyen', email: 'carol@demo.dev', password, image: null },
  })

  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: { name: 'Acme Corp', slug: 'acme-corp' },
  })

  const roles = [
    { userId: owner.id, organizationId: org.id, role: 'OWNER' as const },
    { userId: admin.id, organizationId: org.id, role: 'ADMIN' as const },
    { userId: member.id, organizationId: org.id, role: 'MEMBER' as const },
  ]

  for (const r of roles) {
    await prisma.orgMembership.upsert({
      where: { userId_organizationId: { userId: r.userId, organizationId: r.organizationId } },
      update: {},
      create: r,
    })
  }

  const project = await prisma.project.create({
    data: {
      title: 'Q2 Product Launch',
      description: 'Core product features for the Q2 release cycle.',
      status: 'ACTIVE',
      organizationId: org.id,
      createdById: owner.id,
    },
  })

  const tasks = [
    { title: 'Design system audit', status: 'DONE' as const, position: 0, assigneeId: admin.id },
    { title: 'User onboarding flow', status: 'IN_REVIEW' as const, position: 1, assigneeId: member.id },
    { title: 'API rate limiting', status: 'IN_PROGRESS' as const, position: 2, assigneeId: admin.id },
    { title: 'Payment integration', status: 'TODO' as const, position: 3, assigneeId: null },
    { title: 'Mobile responsive layout', status: 'TODO' as const, position: 4, assigneeId: member.id },
    { title: 'Email notification system', status: 'BACKLOG' as const, position: 5, assigneeId: null },
  ]

  for (let i = 0; i < tasks.length; i++) {
    await prisma.task.create({
      data: {
        title: tasks[i].title,
        status: tasks[i].status,
        position: tasks[i].position,
        projectId: project.id,
        assigneeId: tasks[i].assigneeId,
        createdById: owner.id,
      },
    })
  }

  const tasks2 = [
    { title: 'Admin panel redesign', status: 'TODO' as const, position: 0 },
    { title: 'Dashboard metrics', status: 'BACKLOG' as const, position: 1 },
  ]

  const project2 = await prisma.project.create({
    data: {
      title: 'Website Redesign',
      description: 'Company website and admin panel refresh.',
      status: 'ACTIVE',
      organizationId: org.id,
      createdById: admin.id,
    },
  })

  for (let i = 0; i < tasks2.length; i++) {
    await prisma.task.create({
      data: {
        title: tasks2[i].title,
        status: tasks2[i].status,
        position: tasks2[i].position,
        projectId: project2.id,
        createdById: admin.id,
      },
    })
  }

  console.log('Seeded successfully')
}

main().catch((e) => { console.error(e); process.exit(1) })
