import { ClerkProvider } from '@clerk/nextjs'
import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Topbar from '@/components/shareds/Topbar'
import LeftSidebar from '@/components/shareds/LeftSidebar'
import RightSidebar from '@/components/shareds/RightSidebar'
import Bottombar from '@/components/shareds/Bottombar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Threads clone',
  description: 'The NextJS 13 Meta Threads Application',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Topbar />

          <main className="flex flex-row"> 
            <LeftSidebar />

            <section className="main-container">
              <div className="w-full max-w-4xl">
                {children}
              </div>
            </section>

            <RightSidebar />
          </main>

          <Bottombar />
        </body>
      </html>
    </ClerkProvider>
  )
}
