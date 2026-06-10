import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Web Application Demo — Project Management SaaS', template: '%s | Web Application Demo' },
  description: 'A project management SaaS platform: multi-tenant orgs, Kanban boards, task management, and team collaboration.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white text-neutral-900 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
