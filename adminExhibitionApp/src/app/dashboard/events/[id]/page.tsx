'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  LayoutGrid,
  Users,
  IndianRupee,
  Clock
} from 'lucide-react'
import Link from 'next/link'

type Event = {
  id: string
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  image_url: string | null
  status: string
  total_stalls: number
  available_stalls: number
  price_per_stall: number
  created_at: string
}

type Stall = {
  id: string
  stall_number: string
  hall_id: string | null
  status: string
  price: number
}

type Booking = {
  id: string
  status: string
  total_amount: number
  created_at: string
  profiles?: { name: string }
  stalls?: { stall_number: string }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  ongoing: 'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [stalls, setStalls] = useState<Stall[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  async function fetchEventData() {
    const supabase = createClient()
    
    // Fetch event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) {
      toast.error('Event not found')
      router.push('/dashboard/events')
      return
    }

    setEvent(eventData)

    // Fetch stalls for this event
    const { data: stallsData } = await supabase
      .from('stalls')
      .select('*')
      .eq('event_id', eventId)
      .order('stall_number')

    setStalls(stallsData || [])

    // Fetch bookings for this event
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*, profiles(name), stalls(stall_number)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(10)

    setBookings(bookingsData || [])
    setLoading(false)
  }

  const deleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      toast.error('Failed to delete event')
      console.error(error)
    } else {
      toast.success('Event deleted successfully')
      router.push('/dashboard/events')
    }
  }

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

  if (!event) {
    return (
      <div className="p-8">
        <p>Event not found</p>
      </div>
    )
  }

  // Calculate stats
  const bookedStalls = stalls.filter(s => s.status === 'booked').length
  const availableStalls = stalls.filter(s => s.status === 'available').length
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.total_amount), 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/events" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[event.status]}`}>
                {event.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {event.location}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/events/${eventId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            </Link>
            <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={deleteEvent}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Stalls</p>
                <p className="text-2xl font-bold">{stalls.length}</p>
              </div>
              <LayoutGrid className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold text-green-600">{availableStalls}</p>
              </div>
              <LayoutGrid className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Booked</p>
                <p className="text-2xl font-bold text-blue-600">{bookedStalls}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="mt-1">{event.description || 'No description provided'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{format(new Date(event.start_date), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{format(new Date(event.end_date), 'PPP')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Price per Stall</p>
                <p className="font-medium">₹{event.price_per_stall.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{format(new Date(event.created_at), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Recent Bookings
            </CardTitle>
            <CardDescription>Latest booking activity for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{booking.profiles?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">Stall {booking.stalls?.stall_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Number(booking.total_amount).toLocaleString()}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookings.length > 5 && (
              <Link href="/dashboard/bookings" className="block text-center text-purple-600 hover:underline mt-4">
                View all bookings →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stalls Overview */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Stalls Overview</CardTitle>
              <CardDescription>All stalls for this event</CardDescription>
            </div>
            <Link href="/dashboard/stalls">
              <Button variant="outline" size="sm">Manage Stalls</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stalls.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No stalls configured for this event</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stalls.map(stall => (
                <div 
                  key={stall.id}
                  className={`p-3 rounded-lg border text-center ${
                    stall.status === 'available' ? 'bg-green-50 border-green-200' :
                    stall.status === 'booked' ? 'bg-blue-50 border-blue-200' :
                    stall.status === 'reserved' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="font-medium">{stall.stall_number}</p>
                  <p className="text-xs text-gray-500">{stall.hall_id || 'No Hall'}</p>
                  <p className="text-xs capitalize mt-1">{stall.status}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
