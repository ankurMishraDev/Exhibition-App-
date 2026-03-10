'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Filter } from 'lucide-react'
import { toast } from 'sonner'

type Event = {
  id: string
  title: string
}

type Stall = {
  id: string
  event_id: string
  hall_id: string | null
  stall_number: string
  position_x: number
  position_y: number
  width: number
  height: number
  status: 'available' | 'reserved' | 'booked' | 'disabled'
  price: number
  features: string[] | null
  events?: { title: string }
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-yellow-100 text-yellow-700',
  booked: 'bg-blue-100 text-blue-700',
  disabled: 'bg-gray-100 text-gray-700',
}

export default function StallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStall, setEditingStall] = useState<Stall | null>(null)
  const [formData, setFormData] = useState({
    event_id: '',
    hall_id: '',
    stall_number: '',
    price: 10000,
    status: 'available' as 'available' | 'reserved' | 'booked' | 'disabled',
    position_x: 0,
    position_y: 0,
    width: 100,
    height: 100,
    features: '',
  })


  async function fetchData() {
    const supabase = createClient()
    
    // Fetch events
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title')
      .order('created_at', { ascending: false })
    
    setEvents(eventsData || [])

    // Fetch stalls with event info
    const { data: stallsData, error } = await supabase
      .from('stalls')
      .select('*, events(title)')
      .order('stall_number', { ascending: true })

    if (error) {
      toast.error('Failed to fetch stalls')
      console.error(error)
    } else {
      setStalls(stallsData || [])
    }
    setLoading(false)
  }

    useEffect(() => {
    fetchData()
  }, [])

  const filteredStalls = stalls.filter(stall => {
    if (filterEvent !== 'all' && stall.event_id !== filterEvent) return false
    if (filterStatus !== 'all' && stall.status !== filterStatus) return false
    return true
  })

  const resetForm = () => {
    setFormData({
      event_id: '',
      hall_id: '',
      stall_number: '',
      price: 10000,
      status: 'available',
      position_x: 0,
      position_y: 0,
      width: 100,
      height: 100,
      features: '',
    })
    setEditingStall(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditDialog = (stall: Stall) => {
    setEditingStall(stall)
    setFormData({
      event_id: stall.event_id,
      hall_id: stall.hall_id || '',
      stall_number: stall.stall_number,
      price: stall.price,
      status: stall.status,
      position_x: stall.position_x,
      position_y: stall.position_y,
      width: stall.width,
      height: stall.height,
      features: stall.features?.join(', ') || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.event_id || !formData.stall_number) {
      toast.error('Please fill required fields')
      return
    }

    const supabase = createClient()
    const stallData = {
      event_id: formData.event_id,
      hall_id: formData.hall_id || null,
      stall_number: formData.stall_number,
      price: formData.price,
      status: formData.status,
      position_x: formData.position_x,
      position_y: formData.position_y,
      width: formData.width,
      height: formData.height,
      features: formData.features ? formData.features.split(',').map(f => f.trim()) : null,
    }

    if (editingStall) {
      const { error } = await supabase
        .from('stalls')
        .update(stallData)
        .eq('id', editingStall.id)

      if (error) {
        toast.error('Failed to update stall')
        console.error(error)
      } else {
        toast.success('Stall updated successfully')
        setDialogOpen(false)
        fetchData()
      }
    } else {
      const { error } = await supabase
        .from('stalls')
        .insert(stallData)

      if (error) {
        toast.error('Failed to create stall')
        console.error(error)
      } else {
        toast.success('Stall created successfully')
        setDialogOpen(false)
        fetchData()
      }
    }
  }

  const deleteStall = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stall?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('stalls')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete stall')
      console.error(error)
    } else {
      toast.success('Stall deleted successfully')
      fetchData()
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
          <h1 className="text-3xl font-bold text-gray-900">Stalls</h1>
          <p className="text-gray-500 mt-1">Manage exhibition stalls across all events</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-purple-600 to-orange-500">
          <Plus className="mr-2 h-4 w-4" />
          Add Stall
        </Button>
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
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

      {/* Stalls Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stalls ({filteredStalls.length})</CardTitle>
          <CardDescription>View and manage stalls for all events</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStalls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No stalls found</p>
              <Button onClick={openCreateDialog}>Add your first stall</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stall #</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Hall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStalls.map((stall) => (
                  <TableRow key={stall.id}>
                    <TableCell className="font-medium">{stall.stall_number}</TableCell>
                    <TableCell>{stall.events?.title || 'N/A'}</TableCell>
                    <TableCell>{stall.hall_id || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[stall.status]}`}>
                        {stall.status}
                      </span>
                    </TableCell>
                    <TableCell>₹{stall.price.toLocaleString()}</TableCell>
                    <TableCell>
                      {stall.features?.length ? (
                        <span className="text-xs text-gray-500">{stall.features.slice(0, 2).join(', ')}{stall.features.length > 2 ? '...' : ''}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(stall)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteStall(stall.id)}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStall ? 'Edit Stall' : 'Add New Stall'}</DialogTitle>
            <DialogDescription>
              {editingStall ? 'Update the stall details' : 'Create a new stall for an event'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event *</Label>
              <Select value={formData.event_id} onValueChange={(v) => setFormData(p => ({ ...p, event_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stall Number *</Label>
                <Input
                  value={formData.stall_number}
                  onChange={(e) => setFormData(p => ({ ...p, stall_number: e.target.value }))}
                  placeholder="e.g., A-01"
                />
              </div>
              <div className="space-y-2">
                <Label>Hall ID</Label>
                <Input
                  value={formData.hall_id}
                  onChange={(e) => setFormData(p => ({ ...p, hall_id: e.target.value }))}
                  placeholder="e.g., H1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features (comma-separated)</Label>
              <Input
                value={formData.features}
                onChange={(e) => setFormData(p => ({ ...p, features: e.target.value }))}
                placeholder="e.g., Corner, Extra Space, Power Outlet"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-orange-500">
              {editingStall ? 'Update Stall' : 'Create Stall'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
