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
import { Eye, Filter, TrendingUp, Clock, CheckCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

type Payment = {
  id: string
  booking_id: string
  user_id: string
  amount: number
  currency: string
  method: string
  status: 'created' | 'captured' | 'failed' | 'refunded'
  razorpay_payment_id: string | null
  razorpay_order_id: string | null
  created_at: string
  bookings?: {
    id: string
    status: string
    events?: { title: string }
    stalls?: { stall_number: string }
  }
  profiles?: { name: string; phone: string }
}

const statusColors: Record<string, string> = {
  created: 'bg-yellow-100 text-yellow-700',
  captured: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
}

const statusIcons: Record<string, any> = {
  created: Clock,
  captured: CheckCircle,
  failed: RefreshCw,
  refunded: RefreshCw,
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings(
          id,
          status,
          events(title),
          stalls(stall_number)
        ),
        profiles(name, phone)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch payments')
      console.error(error)
    } else {
      setPayments(data || [])
    }
    setLoading(false)
  }

  const filteredPayments = payments.filter(payment => {
    if (filterStatus !== 'all' && payment.status !== filterStatus) return false
    return true
  })

  const openDetailDialog = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailDialogOpen(true)
  }

  const initiateRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to refund this payment?')) return
    
    const supabase = createClient()
    
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId)

      if (error) throw error

      toast.success('Payment marked as refunded')
      fetchPayments()
      setDetailDialogOpen(false)
    } catch (error: any) {
      toast.error('Failed to process refund')
      console.error(error)
    }
  }

  // Stats
  const totalPayments = payments.length
  const capturedPayments = payments.filter(p => p.status === 'captured')
  const totalCaptured = capturedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingPayments = payments.filter(p => p.status === 'created')
  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const refundedPayments = payments.filter(p => p.status === 'refunded')
  const totalRefunded = refundedPayments.reduce((sum, p) => sum + Number(p.amount), 0)

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
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">Track and manage all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">{totalPayments}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Captured</p>
                <p className="text-2xl font-bold text-green-600">₹{totalCaptured.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">{capturedPayments.length} payments</p>
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
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{totalPending.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">{pendingPayments.length} payments</p>
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
                <p className="text-sm text-gray-500">Refunded</p>
                <p className="text-2xl font-bold text-gray-600">₹{totalRefunded.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">{refundedPayments.length} payments</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-gray-600" />
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
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="created">Pending</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setFilterStatus('all')}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filter
            </Button>
            <Button variant="outline" onClick={fetchPayments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({filteredPayments.length})</CardTitle>
          <CardDescription>View all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Stall</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}...</TableCell>
                    <TableCell>{payment.profiles?.name || 'N/A'}</TableCell>
                    <TableCell>{payment.bookings?.events?.title || 'N/A'}</TableCell>
                    <TableCell>{payment.bookings?.stalls?.stall_number || 'N/A'}</TableCell>
                    <TableCell className="font-medium">₹{Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{payment.method || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                        {payment.status === 'created' ? 'pending' : payment.status}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(payment.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(payment)}>
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
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View payment transaction details
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Payment ID</p>
                  <p className="font-mono text-xs">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p>{format(new Date(selectedPayment.created_at), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-gray-500">User</p>
                  <p className="font-medium">{selectedPayment.profiles?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{selectedPayment.profiles?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Event</p>
                  <p className="font-medium">{selectedPayment.bookings?.events?.title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Stall</p>
                  <p className="font-medium">{selectedPayment.bookings?.stalls?.stall_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Method</p>
                  <p className="capitalize">{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-gray-500">Currency</p>
                  <p>{selectedPayment.currency}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">Amount</p>
                    <p className="text-2xl font-bold">₹{Number(selectedPayment.amount).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedPayment.status]}`}>
                    {selectedPayment.status === 'created' ? 'pending' : selectedPayment.status}
                  </span>
                </div>
              </div>

              {selectedPayment.razorpay_payment_id && (
                <div className="border-t pt-4">
                  <p className="text-gray-500 text-sm mb-1">Razorpay Payment ID</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{selectedPayment.razorpay_payment_id}</p>
                </div>
              )}

              {selectedPayment.razorpay_order_id && (
                <div>
                  <p className="text-gray-500 text-sm mb-1">Razorpay Order ID</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{selectedPayment.razorpay_order_id}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedPayment?.status === 'captured' && (
              <Button 
                variant="outline" 
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => initiateRefund(selectedPayment.id)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Mark as Refunded
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
