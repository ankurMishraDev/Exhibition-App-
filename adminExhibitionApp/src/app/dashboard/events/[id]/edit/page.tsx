'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, MapPin, IndianRupee, LayoutGrid, Save } from 'lucide-react'
import Link from 'next/link'

type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'draft' as EventStatus,
    total_stalls: 0,
    available_stalls: 0,
    price_per_stall: 0,
    image_url: '',
  })

  const fetchEvent = useCallback(async () => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error || !data) {
      toast.error('Event not found')
      router.push('/dashboard/events')
      return
    }

    setFormData({
      title: data.title,
      description: data.description || '',
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      total_stalls: data.total_stalls,
      available_stalls: data.available_stalls,
      price_per_stall: data.price_per_stall,
      image_url: data.image_url || '',
    })
    setLoading(false)
  }, [eventId, router])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['total_stalls', 'available_stalls', 'price_per_stall'].includes(name) 
        ? Number(value) 
        : value
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as EventStatus }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.location || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date must be after start date')
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          total_stalls: formData.total_stalls,
          available_stalls: formData.available_stalls,
          price_per_stall: formData.price_per_stall,
          image_url: formData.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)

      if (error) throw error

      toast.success('Event updated successfully!')
      router.push(`/dashboard/events/${eventId}`)
    } catch (error: unknown) {
      console.error('Error updating event:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update event')
    } finally {
      setSaving(false)
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/events/${eventId}`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-500 mt-1">Update the event details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Basic Information
              </CardTitle>
              <CardDescription>Update the event name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Tech Expo 2026"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your event..."
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-600" />
                Location & Schedule
              </CardTitle>
              <CardDescription>Update venue and event dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Convention Center, Mumbai"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stalls & Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-green-600" />
                Stalls & Pricing
              </CardTitle>
              <CardDescription>Configure stall availability and pricing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_stalls">Total Stalls</Label>
                  <Input
                    id="total_stalls"
                    name="total_stalls"
                    type="number"
                    min="0"
                    value={formData.total_stalls}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available_stalls">Available Stalls</Label>
                  <Input
                    id="available_stalls"
                    name="available_stalls"
                    type="number"
                    min="0"
                    max={formData.total_stalls}
                    value={formData.available_stalls}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_stall">Price per Stall (₹)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="price_per_stall"
                      name="price_per_stall"
                      type="number"
                      min="0"
                      className="pl-10"
                      value={formData.price_per_stall}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Status</CardTitle>
              <CardDescription>Control event visibility and state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {formData.status === 'draft' && 'Draft events are not visible to exhibitors'}
                  {formData.status === 'published' && 'Published events are visible and open for booking'}
                  {formData.status === 'ongoing' && 'The event is currently in progress'}
                  {formData.status === 'completed' && 'The event has ended'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href={`/dashboard/events/${eventId}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-linear-to-r from-purple-600 to-orange-500"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
