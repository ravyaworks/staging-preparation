'use client'

import { useState } from 'react'
import {
  Key, Palette, AlertTriangle, Eye, EyeOff, Save,
} from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Input, Toggle, Tabs, Dialog, Avatar, Skeleton, ErrorState,
} from '@conversation-platform/ui'
import { PageHeader } from '@/components/layout/page-header'
import { useAuthStore } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

interface ProfileForm {
  name: string
  email: string
  avatar: string
}

interface PasswordForm {
  current: string
  newPassword: string
  confirm: string
}

interface Preferences {
  theme: 'light' | 'dark' | 'system'
  notifications: boolean
  language: string
}

interface NotificationPrefs {
  email: boolean
  inApp: boolean
  digestFrequency: 'daily' | 'weekly' | 'never'
}

type PageState = 'loading' | 'error' | 'loaded'

export default function UserSettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [pageState] = useState<PageState>('loaded')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [profile, setProfile] = useState<ProfileForm>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    avatar: user?.avatar ?? '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)

  const [password, setPassword] = useState<PasswordForm>({
    current: '',
    newPassword: '',
    confirm: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [preferences, setPreferences] = useState<Preferences>({
    theme: 'system',
    notifications: true,
    language: 'en',
  })

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: true,
    inApp: true,
    digestFrequency: 'weekly',
  })

  if (pageState === 'loading') {
    return (
      <>
        <PageHeader title="Settings" />
        <div className="p-6 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton variant="text" width="30%" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="60%" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    )
  }

  if (pageState === 'error') {
    return (
      <>
        <PageHeader title="Settings" />
        <div className="p-6">
          <ErrorState title="Failed to load settings" onRetry={() => {}} />
        </div>
      </>
    )
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileMessage(null)
    await new Promise((r) => setTimeout(r, 800))
    updateUser({ name: profile.name, email: profile.email })
    setProfileMessage('Profile updated successfully')
    setProfileSaving(false)
  }

  const handlePasswordSave = async () => {
    const errors: Partial<Record<keyof PasswordForm, string>> = {}
    if (!password.current) {errors.current = 'Current password is required'}
    if (!password.newPassword) {errors.newPassword = 'New password is required'}
    else if (password.newPassword.length < 8) {errors.newPassword = 'Must be at least 8 characters'}
    if (password.newPassword !== password.confirm) {errors.confirm = 'Passwords do not match'}
    setPasswordErrors(errors)
    if (Object.keys(errors).length > 0) {return}

    setPasswordSaving(true)
    setPasswordMessage(null)
    await new Promise((r) => setTimeout(r, 800))
    setPasswordMessage('Password changed successfully')
    setPassword({ current: '', newPassword: '', confirm: '' })
    setPasswordErrors({})
    setPasswordSaving(false)
  }

  const tabContent = [
    {
      id: 'profile',
      label: 'Profile',
      content: (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar src={profile.avatar} name={profile.name} size="lg" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{profile.name || 'Your Name'}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
              <Input
                label="Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <Input
                label="Avatar URL"
                value={profile.avatar}
                onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                helperText="URL to your profile image"
              />
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {profileMessage && <p className="text-sm text-green-600">{profileMessage}</p>}
              <Button className="ml-auto" onClick={handleProfileSave} isLoading={profileSaving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      ),
    },
    {
      id: 'password',
      label: 'Password',
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                type={showCurrent ? 'text' : 'password'}
                value={password.current}
                error={passwordErrors.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={password.newPassword}
                error={passwordErrors.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              label="Confirm New Password"
              type="password"
              value={password.confirm}
              error={passwordErrors.confirm}
              onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
            />
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            {passwordMessage && <p className={cn('text-sm', passwordMessage.includes('success') ? 'text-green-600' : 'text-red-600')}>{passwordMessage}</p>}
            <Button className="ml-auto" onClick={handlePasswordSave} isLoading={passwordSaving}>
              <Key className="h-4 w-4" />
              Change Password
            </Button>
          </CardFooter>
        </Card>
      ),
    },
    {
      id: 'preferences',
      label: 'Preferences',
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Theme</label>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPreferences({ ...preferences, theme: t })}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                        preferences.theme === t
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <Palette className="h-4 w-4" />
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Toggle
                label="Enable notifications"
                description="Receive notifications about conversations and updates"
                checked={preferences.notifications}
                onChange={(v) => setPreferences({ ...preferences, notifications: v })}
              />
              <div className="space-y-2">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  id="language"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Toggle
                label="Email notifications"
                description="Receive email updates for important events"
                checked={notifPrefs.email}
                onChange={(v) => setNotifPrefs({ ...notifPrefs, email: v })}
              />
              <Toggle
                label="In-app notifications"
                description="Show notifications within the dashboard"
                checked={notifPrefs.inApp}
                onChange={(v) => setNotifPrefs({ ...notifPrefs, inApp: v })}
              />
              <div className="space-y-2">
                <label htmlFor="digest" className="block text-sm font-medium text-gray-700">Digest Frequency</label>
                <select
                  id="digest"
                  value={notifPrefs.digestFrequency}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, digestFrequency: e.target.value as NotificationPrefs['digestFrequency'] })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      content: (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Warning</p>
                <p className="text-sm text-red-700 mt-1">
                  Deleting your account will remove all your conversations, notifications, and personal data.
                  This operation is permanent and cannot be reversed.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              <AlertTriangle className="h-4 w-4" />
              Delete My Account
            </Button>
          </CardFooter>
        </Card>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Settings" description="Manage your account settings and preferences" />

      <div className="p-6">
        <Tabs tabs={tabContent} />
      </div>

      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Account"
        description="Are you absolutely sure you want to delete your account? This action cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setShowDeleteDialog(false) }}>Yes, Delete</Button>
          </>
        }
      />
    </>
  )
}
