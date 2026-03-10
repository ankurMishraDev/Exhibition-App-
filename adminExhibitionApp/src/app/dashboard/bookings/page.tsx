'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

type Booking = {
  id: string
  user_id: string
  event_id: string
  stall_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'refunded'
  total_amount: number
  created_at: string
  events?: { title: string }
  stalls?: { stall_number: string; hall_id: string }
  profiles?: { name: string; phone: string }
}

type Event = {
  id: string
  title: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-700',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createClient()
    
    // Fetch events for filter
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title')
      .order('created_at', { ascending: false })
    
    setEvents(eventsData || [])

    // Fetch bookings with related data
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        events(title),
        stalls(stall_number, hall_id),
        profiles(name, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch bookings')
      console.error(error)
    } else {
      setBookings(bookingsData || [])
    }
    setLoading(false)
  }

  const filteredBookings = bookings.filter(booking => {
    if (filterEvent !== 'all' && booking.event_id !== filterEvent) return false
    if (filterStatus !== 'all' && booking.status !== filterStatus) return false
    return true
  })

  const updateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    const supabase = createClient()
    
    const booking = bookings.find(b => b.id === bookingId)
    if (!booking) return

    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (bookingError) throw bookingError

      // If cancelled, make stall available again
      if (newStatus === 'cancelled') {
        const { error: stallError } = await supabase
          .from('stalls')
          .update({ status: 'available' })
          .eq('id', booking.stall_id)

        if (stallError) throw stallError
      }

      toast.success(`Booking ${newStatus === 'confirmed' ? 'confirmed' : 'cancelled'} successfully`)
      fetchData()
      setDetailDialogOpen(false)
    } catch (error: any) {
      toast.error('Failed to update booking')
      console.error(error)
    }
  }

  const openDetailDialog = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailDialogOpen(true)
  }

  // Stats
  const totalBookings = bookings.length
  const pendingBookings = bookings.filter(b => b.status === 'pending').length
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <p className="text-gray-500 mt-1">Manage stall bookings from exhibitors</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{pendingBookings}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold">{confirmedBookings}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold">₹</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Filter by Event</Label>
              <Select value={filterEvent} onValueChange={setFilterEvent}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => { setFilterEvent('all'); setFilterStatus('all') }}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
          <CardDescription>View and manage all stall bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No bookings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Exhibitor</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Stall</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                    <TableCell>{booking.profiles?.name || 'N/A'}</TableCell>
                    <TableCell>{booking.events?.title || 'N/A'}</TableCell>
                    <TableCell>
                      {booking.stalls?.stall_number || 'N/A'}
                      {booking.stalls?.hall_id && <span className="text-gray-400 text-xs ml-1">({booking.stalls.hall_id})</span>}
                    </TableCell>
                    <TableCell>₹{Number(booking.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[booking.payment_status]}`}>
                        {booking.payment_status}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(booking.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(booking)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View and manage this booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Booking ID</p>
                  <p className="font-mono">{selectedBooking.id.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p>{format(new Date(selectedBooking.created_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Exhibitor</p>
                  <p className="font-medium">{selectedBooking.profiles?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{selectedBooking.profiles?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Event</p>
                  <p className="font-medium">{selectedBooking.events?.title}</p>
                </div>
                <div>
                  <p className="text-gray-500">Stall</p>
                  <p className="font-medium">{selectedBooking.stalls?.stall_number} ({selectedBooking.stalls?.hall_id})</p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-bold text-lg">₹{Number(selectedBooking.total_amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[selectedBooking.payment_status]}`}>
                    {selectedBooking.payment_status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-gray-500 text-sm mb-2">Booking Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedBooking.status]}`}>
                  {selectedBooking.status}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedBooking?.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Booking
                </Button>
              </>
            )}
            {selectedBooking?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
