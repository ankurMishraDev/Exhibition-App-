'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { LayoutGrid, Receipt, CreditCard, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalHalls: 0,
    totalStalls: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [hallsSnap, stallsSnap, bookingsSnap, pendingSnap, paymentsSnap] = await Promise.all([
          getDocs(collection(db, 'halls')),
          getDocs(collection(db, 'stalls')),
          getDocs(collection(db, 'bookings')),
          getDocs(query(collection(db, 'bookings'), where('status', '==', 'pending_approval'))),
          getDocs(collection(db, 'payments')),
        ])

        const totalRevenue = paymentsSnap.docs.reduce((sum, d) => {
          return sum + (d.data().paidAmount ?? 0)
        }, 0)

        setStats({
          totalHalls: hallsSnap.size,
          totalStalls: stallsSnap.size,
          totalBookings: bookingsSnap.size,
          pendingBookings: pendingSnap.size,
          totalRevenue,
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
