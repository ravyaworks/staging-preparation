'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
  Badge, Button, Input, Dialog, Toggle, Skeleton, ErrorState,
} from '@conversation-platform/ui'
import { Shield, AlertTriangle, Power, PowerOff, Calendar } from 'lucide-react'

export default function AdminMaintenance() {
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('System is currently under maintenance. Please check back later.')
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [allowlist, setAllowlist] = useState('admin@example.com, super@example.com')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'enable' | 'disable' | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const handleToggle = (action: 'enable' | 'disable') => {
    setPendingAction(action)
    setConfirmOpen(true)
  }

  const confirmAction = () => {
    if (pendingAction === 'enable') setEnabled(true)
    else setEnabled(false)
    setConfirmOpen(false)
    setPendingAction(null)
  }

  if (error) return <div className="p-6"><ErrorState title="Failed to load" description={error} onRetry={() => {}} /></div>

  return (
    <>
      <PageHeader title="Maintenance Mode" description="Control system maintenance mode" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card className={`p-0 border-2 ${enabled ? 'border-yellow-400' : 'border-gray-200'}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${enabled ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-400'} shrink-0`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>
                    {enabled
                      ? 'Maintenance mode is currently active. Most users will see the maintenance message.'
                      : 'Maintenance mode is disabled. All users can access the platform normally.'}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={enabled ? 'warning' : 'default'} size="lg">{enabled ? 'Active' : 'Inactive'}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Maintenance Message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter a message for users" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Scheduled Start" type="datetime-local" value={scheduledStart} onChange={e => setScheduledStart(e.target.value)} />
              <Input label="Scheduled End" type="datetime-local" value={scheduledEnd} onChange={e => setScheduledEnd(e.target.value)} />
            </div>
            <Input label="Allowlist (comma-separated user IDs or emails)" value={allowlist} onChange={e => setAllowlist(e.target.value)} placeholder="user@example.com, user-id-123" />
          </CardContent>
          <CardFooter className="flex justify-between">
            <span className="text-xs text-gray-400">Administrators in the allowlist bypass maintenance mode</span>
            <div className="flex gap-2">
              {enabled ? (
                <Button variant="outline" onClick={() => handleToggle('disable')}><PowerOff className="h-4 w-4" /> Disable Maintenance</Button>
              ) : (
                <Button variant="warning" onClick={() => handleToggle('enable')}><Power className="h-4 w-4" /> Enable Maintenance</Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title={pendingAction === 'enable' ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
        description={pendingAction === 'enable' ? 'This will show the maintenance message to all non-allowlisted users.' : 'All users will regain full access to the platform.'}
        size="sm"
        footer={<><Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button><Button variant={pendingAction === 'enable' ? 'warning' : 'default'} onClick={confirmAction}>{pendingAction === 'enable' ? 'Enable' : 'Disable'}</Button></>} />
    </>
  )
}
