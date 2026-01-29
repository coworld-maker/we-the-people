import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Vote, FileText, User } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Vote className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">We The People</span>
              </Link>
              
              <div className="hidden md:flex gap-6">
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link 
                  href="/bills" 
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Bills
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
