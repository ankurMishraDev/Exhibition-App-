'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Calendar, 
  LayoutGrid, 
  Receipt, 
  CreditCard, 
  LogOut,
  Users
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-purple-600 to-purple-800 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Exhibition Admin</h1>
          <p className="text-purple-200 text-sm mt-1">Management Dashboard</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-purple-700">
              <LayoutGrid className="mr-3 h-5 w-5" />
              Overview
            </Button>
          </Link>
          <Link href="/dashboard/events">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-purple-700">
              <Calendar className="mr-3 h-5 w-5" />
              Events
            </Button>
          </Link>
          <Link href="/dashboard/stalls">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-purple-700">
              <LayoutGrid className="mr-3 h-5 w-5" />
              Stalls
            </Button>
          </Link>
          <Link href="/dashboard/bookings">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-purple-700">
              <Receipt className="mr-3 h-5 w-5" />
              Bookings
            </Button>
          </Link>
          <Link href="/dashboard/payments">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-purple-700">
              <CreditCard className="mr-3 h-5 w-5" />
              Payments
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-purple-700">
          <div className="flex items-center mb-3 px-2">
            <Users className="h-5 w-5 mr-2" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-purple-700"
            onClick={() => signOut()}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
