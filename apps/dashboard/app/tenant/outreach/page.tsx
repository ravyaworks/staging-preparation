'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/analytics/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@conversation-platform/ui'
import { Upload, Building2, FileSpreadsheet, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
}

export default function OutreachPage() {
  const [imports, setImports] = useState<any[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadType, setUploadType] = useState<'json' | 'csv'>('json')
  const [jsonInput, setJsonInput] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [importsRes, bizRes] = await Promise.all([
        fetch('/api/v1/outreach/jobs?limit=5'),
        fetch('/api/v1/outreach/businesses?limit=5'),
      ])
      if (importsRes.ok) {
        const data = await importsRes.json()
        setImports(data.data?.items ?? [])
      }
      if (bizRes.ok) {
        const data = await bizRes.json()
        setBusinesses(data.data?.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    setUploading(true)
    try {
      const body = uploadType === 'json' ? jsonInput : null
      const res = await fetch('/api/v1/outreach/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: uploadType,
          data: uploadType === 'json' ? JSON.parse(jsonInput) : undefined,
        }),
      })
      if (res.ok) {
        setJsonInput('')
        fetchData()
      }
    } catch {
      // wait for API
    } finally {
      setUploading(false)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => setJsonInput(evt.target?.result as string)
    reader.readAsText(file)
  }

  const totalImports = imports.length
  const completedImports = imports.filter(i => i.status === 'completed').length
  const failedImports = imports.filter(i => i.status === 'failed').length

  return (
    <div>
      <PageHeader title="Outreach" description="Import businesses and manage outreach campaigns" />

      <div className="p-6 grid gap-4 md:grid-cols-3">
        <StatCard title="Recent Imports" value={totalImports} icon={Upload} />
        <StatCard title="Completed" value={completedImports} icon={CheckCircle} />
        <StatCard title="Failed" value={failedImports} icon={XCircle} />
      </div>

      <div className="px-6 pb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Businesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={uploadType === 'json' ? 'default' : 'outline'} size="sm" onClick={() => setUploadType('json')}>
                JSON
              </Button>
              <Button variant={uploadType === 'csv' ? 'default' : 'outline'} size="sm" onClick={() => setUploadType('csv')}>
                CSV
              </Button>
            </div>

            {uploadType === 'csv' ? (
              <div>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer" />
                <p className="text-xs text-muted-foreground mt-1">CSV columns: businessName, phone, personalizedMessage, industry, previewUrl, email</p>
              </div>
            ) : (
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='[{ "businessName": "...", "phone": "+1234567890", "personalizedMessage": "..." }]'
                rows={6}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            )}

            <Button onClick={handleSubmit} disabled={uploading || !jsonInput} className="w-full">
              {uploading ? 'Importing...' : 'Submit Import'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Recent Imports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : imports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No imports yet. Submit your first batch above.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imports.map((imp: any) => (
                    <TableRow key={imp.id}>
                      <TableCell className="uppercase text-xs font-mono">{imp.type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[imp.status] ?? ''}>{imp.status}</Badge>
                      </TableCell>
                      <TableCell>{imp.successCount}/{imp.totalRecords}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(imp.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4">
              <Link href="/tenant/outreach/imports">
                <Button variant="outline" size="sm">
                  View All Imports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Recent Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : businesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No businesses imported yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((biz: any) => (
                    <TableRow key={biz.id}>
                      <TableCell>
                        <Link href={`/tenant/outreach/businesses/${biz.id}`} className="text-primary hover:underline font-medium">
                          {biz.businessName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{biz.phone}</TableCell>
                      <TableCell className="text-xs">{biz.campaignName}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[biz.status] ?? ''}>{biz.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(biz.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4">
              <Link href="/tenant/outreach/businesses">
                <Button variant="outline" size="sm">
                  View All Businesses
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
