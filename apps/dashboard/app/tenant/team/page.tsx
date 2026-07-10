'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  MoreHorizontal,
  Trash2,
  Edit3,
  Crown,
  User as UserIcon,
  Clock,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  Dialog,
  Badge,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  Dropdown,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { cn, formatDate, pluralize } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent' | 'viewer'
  status: 'online' | 'away' | 'offline'
  avatar?: string
  lastActive: string
  conversations: number
}

const mockMembers: TeamMember[] = [
  { id: '1', name: 'You', email: 'you@example.com', role: 'admin', status: 'online', lastActive: '2026-07-08T10:30:00Z', conversations: 28 },
  { id: '2', name: 'Alex Chen', email: 'alex.chen@example.com', role: 'agent', status: 'online', lastActive: '2026-07-08T10:15:00Z', conversations: 42 },
  { id: '3', name: 'Sam Wilson', email: 'sam.wilson@example.com', role: 'agent', status: 'away', lastActive: '2026-07-08T08:00:00Z', conversations: 35 },
  { id: '4', name: 'Jordan Lee', email: 'jordan.lee@example.com', role: 'agent', status: 'offline', lastActive: '2026-07-07T18:30:00Z', conversations: 19 },
  { id: '5', name: 'Taylor Reed', email: 'taylor.reed@example.com', role: 'viewer', status: 'online', lastActive: '2026-07-08T09:45:00Z', conversations: 5 },
  { id: '6', name: 'Morgan Page', email: 'morgan.page@example.com', role: 'agent', status: 'offline', lastActive: '2026-07-06T15:20:00Z', conversations: 51 },
  { id: '7', name: 'Casey Kim', email: 'casey.kim@example.com', role: 'viewer', status: 'away', lastActive: '2026-07-08T07:30:00Z', conversations: 8 },
]

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Viewer' },
]

const roleBadge: Record<string, 'info' | 'success' | 'default'> = {
  admin: 'info',
  agent: 'success',
  viewer: 'default',
}

const statusDot: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-gray-400',
}

function TeamSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton width="70%" />
                <Skeleton width="90%" height={12} />
                <Skeleton width="40%" height={12} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('agent')
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null)
  const [showEditRole, setShowEditRole] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setMembers(mockMembers)
      setLoading(false)
    }, 600)
  }, [])

  useEffect(() => { load() }, [load])

  const handleInvite = () => {
    if (!inviteEmail) { return }
    const newMember: TeamMember = {
      id: `inv-${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole as TeamMember['role'],
      status: 'offline',
      lastActive: new Date().toISOString(),
      conversations: 0,
    }
    setMembers((prev) => [...(prev ?? []), newMember])
    setInviteEmail('')
    setInviteRole('agent')
    setShowInvite(false)
  }

  const handleRemove = (id: string) => {
    setMembers((prev) => (prev ?? []).filter((m) => m.id !== id))
    setShowRemoveDialog(null)
  }

  const handleEditRole = (id: string) => {
    setMembers((prev) =>
      (prev ?? []).map((m) => (m.id === id ? { ...m, role: editRole as TeamMember['role'] } : m)),
    )
    setShowEditRole(null)
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Team" description="Manage your team members" />
        <div className="p-6">
          <ErrorState title="Failed to load team" description={error} onRetry={load} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Team" description="Manage your team members">
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite Member
        </Button>
      </PageHeader>

      <div className="p-6">
        {loading ? <TeamSkeleton /> : !members || members.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No team members"
                description="Invite your first team member to get started."
                action={
                  <Button onClick={() => setShowInvite(true)}>
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Invite Member
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {members.length} {pluralize(members.length, 'member')} &middot; {' '}
              {members.filter((m) => m.status === 'online').length} online
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.map((member) => (
                <Card key={member.id} className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar
                          name={member.name}
                          size="md"
                        />
                        <span className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                          statusDot[member.status],
                        )} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{member.name}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
                          </div>
                          <Dropdown
                            trigger={<MoreHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />}
                            align="end"
                            items={[
                              {
                                label: 'Edit role',
                                onClick: () => {
                                  setEditRole(member.role)
                                  setShowEditRole(member.id)
                                },
                                icon: <Edit3 className="h-4 w-4" />,
                              },
                              {
                                label: 'Remove member',
                                onClick: () => setShowRemoveDialog(member.id),
                                icon: <Trash2 className="h-4 w-4" />,
                                variant: 'danger',
                              },
                            ]}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={roleBadge[member.role]}>
                            {member.role === 'admin' && <Crown className="mr-1 h-3 w-3" />}
                            {member.role === 'agent' && <UserIcon className="mr-1 h-3 w-3" />}
                            {member.role === 'viewer' && <Shield className="mr-1 h-3 w-3" />}
                            {member.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(member.lastActive)}
                          </span>
                          <span>{member.conversations} convos</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite team member"
        description="Send an invitation to join your tenant."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>Send Invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select
            label="Role"
            options={roleOptions}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        open={showEditRole !== null}
        onClose={() => setShowEditRole(null)}
        title="Edit member role"
        description="Change the role permissions for this member."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEditRole(null)}>Cancel</Button>
            <Button onClick={() => showEditRole && handleEditRole(showEditRole)}>Save</Button>
          </>
        }
      >
        <Select
          label="Role"
          options={roleOptions}
          value={editRole}
          onChange={(e) => setEditRole(e.target.value)}
        />
      </Dialog>

      <Dialog
        open={showRemoveDialog !== null}
        onClose={() => setShowRemoveDialog(null)}
        title="Remove member"
        description="Are you sure you want to remove this member from the tenant? They will lose access immediately."
        footer={
          <>
            <Button variant="outline" onClick={() => setShowRemoveDialog(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => showRemoveDialog && handleRemove(showRemoveDialog)}>Remove</Button>
          </>
        }
      />
    </div>
  )
}
