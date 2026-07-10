'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Skeleton, ErrorState, Progress,
} from '@conversation-platform/ui'
import { cn, formatDate, formatBytes } from '@/lib/utils'
import {
  FileText, ArrowLeft, Trash2, RefreshCw, Check, X, Clock, AlertCircle,
} from 'lucide-react'

interface Chunk {
  id: string
  index: number
  content: string
  tokenCount: number
  embeddingStatus: 'embedded' | 'pending' | 'failed'
}

interface DocumentMetadata {
  author?: string
  source?: string
  language?: string
  pageCount?: number
  wordCount?: number
}

interface DocumentDetail {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
  updatedAt: string
  status: 'processing' | 'indexed' | 'failed' | 'queued'
  chunks: Chunk[]
  metadata: DocumentMetadata
  content: string
}

const mockDocument: DocumentDetail = {
  id: '1',
  name: 'Getting Started Guide.pdf',
  type: 'application/pdf',
  size: 2450000,
  createdAt: '2026-07-01T10:00:00Z',
  updatedAt: '2026-07-01T10:05:00Z',
  status: 'indexed',
  chunks: [
    { id: 'ch1', index: 1, content: 'Welcome to the Getting Started Guide. This guide will walk you through the initial setup and configuration of the Conversation Platform...', tokenCount: 128, embeddingStatus: 'embedded' },
    { id: 'ch2', index: 2, content: 'System Requirements: Before you begin, ensure your system meets the following minimum requirements. A modern web browser with JavaScript enabled is required...', tokenCount: 96, embeddingStatus: 'embedded' },
    { id: 'ch3', index: 3, content: 'Step 1: Create an Account. Navigate to the registration page and fill in your details. You will receive a confirmation email to verify your account...', tokenCount: 156, embeddingStatus: 'embedded' },
    { id: 'ch4', index: 4, content: 'Step 2: Configure Your Workspace. After logging in, you will be prompted to create your first workspace. Choose a name and configure your team settings...', tokenCount: 142, embeddingStatus: 'embedded' },
    { id: 'ch5', index: 5, content: 'Step 3: Integrate Your Channels. Connect your communication channels including email, chat, and social media platforms to start receiving conversations...', tokenCount: 134, embeddingStatus: 'embedded' },
    { id: 'ch6', index: 6, content: 'Step 4: Train Your AI. Upload knowledge base documents and configure your AI model settings to customize responses for your specific use case...', tokenCount: 118, embeddingStatus: 'pending' },
    { id: 'ch7', index: 7, content: 'Troubleshooting: If you encounter any issues during setup, refer to our troubleshooting guide or contact support for assistance...', tokenCount: 88, embeddingStatus: 'embedded' },
    { id: 'ch8', index: 8, content: 'Next Steps: Once setup is complete, explore advanced features such as custom workflows, analytics dashboards, and API integrations...', tokenCount: 105, embeddingStatus: 'embedded' },
  ],
  metadata: {
    author: 'Documentation Team',
    source: 'Internal Wiki',
    language: 'en',
    pageCount: 12,
    wordCount: 3200,
  },
  content: 'Welcome to the Getting Started Guide. This guide will walk you through the initial setup and configuration of the Conversation Platform. System Requirements: Before you begin, ensure your system meets the following minimum requirements. A modern web browser with JavaScript enabled is required. Step 1: Create an Account. Navigate to the registration page and fill in your details. Step 2: Configure Your Workspace. After logging in, you will be prompted to create your first workspace. Step 3: Integrate Your Channels. Connect your communication channels including email, chat, and social media platforms. Step 4: Train Your AI. Upload knowledge base documents and configure your AI model settings. Troubleshooting: If you encounter any issues during setup, refer to our troubleshooting guide. Next Steps: Once setup is complete, explore advanced features such as custom workflows and analytics dashboards.',
}

const statusConfig = {
  processing: { variant: 'info' as const, icon: <Clock className="h-4 w-4" />, label: 'Processing' },
  indexed: { variant: 'success' as const, icon: <Check className="h-4 w-4" />, label: 'Indexed' },
  failed: { variant: 'danger' as const, icon: <X className="h-4 w-4" />, label: 'Failed' },
  queued: { variant: 'warning' as const, icon: <AlertCircle className="h-4 w-4" />, label: 'Queued' },
}

const embeddingStatusConfig = {
  embedded: { color: 'text-green-600 bg-green-50', icon: <Check className="h-3.5 w-3.5" />, label: 'Embedded' },
  pending: { color: 'text-yellow-600 bg-yellow-50', icon: <Clock className="h-3.5 w-3.5" />, label: 'Pending' },
  failed: { color: 'text-red-600 bg-red-50', icon: <X className="h-3.5 w-3.5" />, label: 'Failed' },
}

export default function DocumentDetailPage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reindexing, setReindexing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (error) {
    return (
      <>
        <PageHeader title="Error" />
        <div className="p-6">
          <ErrorState title="Failed to load document" description={error} onRetry={() => setError(null)} />
        </div>
      </>
    )
  }

  const doc = mockDocument
  const status = statusConfig[doc.status]

  return (
    <>
      <div className="flex items-center gap-2 px-6 pt-4 pb-0">
        <Link href="/tenant/knowledge" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Libraries
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/tenant/knowledge/${params.id}`} className="text-sm text-gray-500 hover:text-gray-700">
          {params.id}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{doc.name}</span>
      </div>

      {loading ? (
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton variant="text" width={400} height={32} />
            <Skeleton variant="text" width={250} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton variant="rectangular" width="100%" height={200} className="rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton variant="rectangular" width="100%" height={200} className="rounded-lg" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{doc.name}</h1>
                <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                  <span>{doc.type.split('/').pop()?.toUpperCase()}</span>
                  <span>{formatBytes(doc.size)}</span>
                  <span>Created {formatDate(doc.createdAt)}</span>
                  <Badge variant={status.variant} className="gap-1">
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={reindexing}
                onClick={() => {
                  setReindexing(true)
                  setTimeout(() => setReindexing(false), 2000)
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Re-index
              </Button>
              {deleteConfirm ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                  <Button variant="danger" size="sm">Confirm Delete</Button>
                </div>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-0">
                <CardHeader>
                  <CardTitle>Content Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{doc.content}</pre>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Chunks</CardTitle>
                    <span className="text-sm text-gray-500">{doc.chunks.length} chunks</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {doc.chunks.map((chunk) => {
                      const embStatus = embeddingStatusConfig[chunk.embeddingStatus]
                      return (
                        <div key={chunk.id} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase">Chunk {chunk.index}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400">{chunk.tokenCount} tokens</span>
                              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', embStatus.color)}>
                                {embStatus.icon}
                                {embStatus.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3">{chunk.content}</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-0">
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Author', value: doc.metadata.author },
                    { label: 'Source', value: doc.metadata.source },
                    { label: 'Language', value: doc.metadata.language?.toUpperCase() },
                    { label: 'Pages', value: doc.metadata.pageCount },
                    { label: 'Word Count', value: doc.metadata.wordCount?.toLocaleString() },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value ?? '—'}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="font-medium text-gray-900">{formatDate(doc.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader>
                  <CardTitle>Embedding Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress
                    value={doc.chunks.filter((c) => c.embeddingStatus === 'embedded').length}
                    max={doc.chunks.length}
                    showLabel
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doc.chunks.filter((c) => c.embeddingStatus === 'embedded').length} embedded</span>
                    <span>{doc.chunks.filter((c) => c.embeddingStatus === 'pending').length} pending</span>
                    <span>{doc.chunks.filter((c) => c.embeddingStatus === 'failed').length} failed</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-0">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <DownloadIcon className="h-4 w-4" />
                    Download Document
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <RefreshCw className="h-4 w-4" />
                    Re-index Document
                  </Button>
                  <Button variant="danger" className="w-full justify-start" size="sm" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4" />
                    Delete Document
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
