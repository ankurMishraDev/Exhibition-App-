'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Calendar, LayoutGrid, Receipt, CreditCard, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    publishedEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      try {
        // Fetch events stats
        const { count: totalEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })

        const { count: publishedEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')

        // Fetch bookings stats
        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })

        // Fetch revenue
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, status')

        const totalRevenue = payments
          ?.filter(p => p.status === 'captured')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0

        const pendingPayments = payments
          ?.filter(p => p.status === 'created')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0

        setStats({
          totalEvents: totalEvents || 0,
          publishedEvents: publishedEvents || 0,
          totalBookings: totalBookings || 0,
          totalRevenue,
          pendingPayments,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome to your exhibition management dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedEvents} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Receipt className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Captured payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.pendingPayments.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting capture
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/dashboard/events/new" className="block p-3 rounded-lg border hover:bg-gray-50 transition">
              <div className="font-medium">Create New Event</div>
              <div className="text-sm text-gray-500">Add a new exhibition event</div>
            </a>
            <a href="/dashboard/stalls" className="block p-3 rounded-lg border hover:bg-gray-50 transition">
              <div className="font-medium">Manage Stalls</div>
              <div className="text-sm text-gray-500">Configure stall layouts</div>
            </a>
            <a href="/dashboard/bookings" className="block p-3 rounded-lg border hover:bg-gray-50 transition">
              <div className="font-medium">View Bookings</div>
              <div className="text-sm text-gray-500">Review and manage bookings</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity to display</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
