'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

type Event = {
  id: string
  title: string
  location: string
  start_date: string
  end_date: string
  status: string
  total_stalls: number
  available_stalls: number
  price_per_stall: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch events')
      console.error(error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  async function deleteEvent(id: string) {
    if (!confirm('Are you sure you want to delete this event?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete event')
      console.error(error)
    } else {
      toast.success('Event deleted successfully')
      fetchEvents()
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage your exhibition events</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button className="bg-gradient-to-r from-purple-600 to-orange-500">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>View and manage all exhibition events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No events found</p>
              <Link href="/dashboard/events/new">
                <Button>Create your first event</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stalls</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      {format(new Date(event.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'draft'
                            ? 'bg-gray-100 text-gray-700'
                            : event.status === 'ongoing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {event.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {event.available_stalls}/{event.total_stalls}
                    </TableCell>
                    <TableCell>₹{event.price_per_stall.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/events/${event.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
