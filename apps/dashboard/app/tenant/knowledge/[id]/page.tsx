'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Badge, Tabs, Dialog, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Skeleton, EmptyState, ErrorState, Select, Toggle, Dropdown, Progress,
} from '@conversation-platform/ui'
import { cn, formatDate, formatBytes } from '@/lib/utils'
import { DocumentUpload } from '@/components/knowledge/document-upload'
import {
  FileText, Search, Plus, Upload, Download, Trash2, Edit, ExternalLink,
  FolderTree, Tag, Clock, Check, X, AlertCircle, ChevronRight, ChevronDown, BookOpen,
  Settings, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

type DocumentStatus = 'processing' | 'indexed' | 'failed' | 'queued'

interface Document {
  id: string
  name: string
  type: string
  size: number
  chunks: number
  status: DocumentStatus
  createdAt: string
  category: string
}

interface Category {
  id: string
  name: string
  parentId: string | null
  documentCount: number
  children?: Category[]
}

interface EmbeddingConfig {
  model: string
  chunkSize: number
  chunkOverlap: number
  indexingSchedule: string
  autoIndex: boolean
}

const documentsData: Document[] = [
  { id: '1', name: 'Getting Started Guide.pdf', type: 'application/pdf', size: 2450000, chunks: 18, status: 'indexed', createdAt: '2026-07-01T10:00:00Z', category: 'guides' },
  { id: '2', name: 'API Reference.md', type: 'text/markdown', size: 82000, chunks: 32, status: 'indexed', createdAt: '2026-07-02T14:30:00Z', category: 'technical' },
  { id: '3', name: 'Troubleshooting Common Issues.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1560000, chunks: 24, status: 'processing', createdAt: '2026-07-03T09:00:00Z', category: 'support' },
  { id: '4', name: 'FAQ Database.csv', type: 'text/csv', size: 450000, chunks: 0, status: 'queued', createdAt: '2026-07-04T11:00:00Z', category: 'support' },
  { id: '5', name: 'Architecture Overview.png', type: 'image/png', size: 3200000, chunks: 0, status: 'failed', createdAt: '2026-07-04T16:00:00Z', category: 'technical' },
  { id: '6', name: 'Release Notes v3.2.md', type: 'text/markdown', size: 28000, chunks: 8, status: 'indexed', createdAt: '2026-07-05T08:00:00Z', category: 'general' },
  { id: '7', name: 'Security Best Practices.pdf', type: 'application/pdf', size: 1890000, chunks: 15, status: 'indexed', createdAt: '2026-07-05T12:00:00Z', category: 'guides' },
  { id: '8', name: 'Integration Guide.html', type: 'text/html', size: 125000, chunks: 11, status: 'processing', createdAt: '2026-07-06T09:30:00Z', category: 'technical' },
]

const categoriesData: Category[] = [
  { id: 'c1', name: 'Guides', parentId: null, documentCount: 2 },
  { id: 'c2', name: 'Technical', parentId: null, documentCount: 3 },
  { id: 'c3', name: 'Support', parentId: null, documentCount: 2 },
  { id: 'c4', name: 'General', parentId: null, documentCount: 1 },
  { id: 'c5', name: 'API Docs', parentId: 'c2', documentCount: 0 },
  { id: 'c6', name: 'SDK Reference', parentId: 'c2', documentCount: 0 },
]

const statusVariant: Record<DocumentStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  processing: 'info',
  indexed: 'success',
  failed: 'danger',
  queued: 'warning',
}

const statusIcon: Record<DocumentStatus, React.ReactNode> = {
  processing: <Clock className="h-3.5 w-3.5" />,
  indexed: <Check className="h-3.5 w-3.5" />,
  failed: <X className="h-3.5 w-3.5" />,
  queued: <AlertCircle className="h-3.5 w-3.5" />,
}

const mockLibrary = {
  name: 'Product Documentation',
  description: 'Official product docs, API references, and integration guides',
  stats: { documents: 48, chunks: 1824, embeddings: 1824, categories: 6 },
}

function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>()
  const roots: Category[] = []
  categories.forEach((c) => map.set(c.id, { ...c, children: [] }))
  categories.forEach((c) => {
    const item = map.get(c.id)
    if (!item) { return }
    if (c.parentId) {
      map.get(c.parentId)?.children?.push(item)
    } else {
      roots.push(item)
    }
  })
  return roots
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) { return <FileText className="h-4 w-4 text-red-500" /> }
  if (type.includes('markdown') || type.includes('html')) { return <FileText className="h-4 w-4 text-blue-500" /> }
  if (type.includes('csv')) { return <FileText className="h-4 w-4 text-green-500" /> }
  if (type.includes('image')) { return <FileText className="h-4 w-4 text-purple-500" /> }
  return <FileText className="h-4 w-4 text-gray-500" />
}

export default function KnowledgeLibraryDetail() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [categoryParent, setCategoryParent] = useState('none')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['c2']))

  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig>({
    model: 'text-embedding-3-small',
    chunkSize: 512,
    chunkOverlap: 64,
    indexingSchedule: 'daily',
    autoIndex: true,
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredDocuments = useMemo(() => {
    return documentsData.filter((doc) => {
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) { return false }
      if (typeFilter !== 'all' && doc.type !== typeFilter) { return false }
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) { return false }
      return true
    })
  }, [searchQuery, typeFilter, categoryFilter])

  const handleDeleteConfirm = () => {
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  const handleUpload = (_files: File[]) => {
    setUploadStatus('uploading')
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval)
          setUploadStatus('done')
          setTimeout(() => {
            setUploadOpen(false)
            setUploadProgress(null)
            setUploadStatus('idle')
          }, 1500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const CategoryTree = ({ categories, depth = 0 }: { categories: Category[]; depth?: number }) => (
    <ul className={cn('space-y-1', depth > 0 && 'ml-5')}>
      {categories.map((cat) => (
        <li key={cat.id}>
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
            'hover:bg-gray-50 group',
          )}>
            {cat.children && cat.children.length > 0 ? (
              <button onClick={() => toggleCategory(cat.id)} className="text-gray-400 hover:text-gray-600">
                {expandedCategories.has(cat.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}
            <FolderTree className="h-4 w-4 text-amber-500" />
            <span className="flex-1 font-medium text-gray-700">{cat.name}</span>
            <span className="text-xs text-gray-400">{cat.documentCount} docs</span>
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); setCategoryParent(cat.parentId ?? 'none'); setEditCategoryOpen(true) }}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setEditingCategory(cat); setDeleteOpen(true) }}
                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {cat.children && cat.children.length > 0 && expandedCategories.has(cat.id) && (
            <CategoryTree categories={cat.children} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  )

  if (error) {
    return (
      <>
        <PageHeader title="Error" />
        <div className="p-6">
          <ErrorState title="Failed to load library" description={error} onRetry={() => setError(null)} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 px-6 pt-4 pb-0">
        <Link href="/tenant/knowledge" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Libraries
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{mockLibrary.name}</span>
      </div>

      {loading ? (
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton variant="text" width={300} height={32} />
              <Skeleton variant="text" width={450} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-0">
                <CardContent className="p-6">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="30%" className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton variant="rectangular" width="100%" height={400} className="rounded-lg" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{mockLibrary.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{mockLibrary.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Documents', value: String(mockLibrary.stats.documents), icon: <FileText className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Chunks', value: String(mockLibrary.stats.chunks), icon: <FolderTree className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Embeddings', value: String(mockLibrary.stats.embeddings), icon: <Tag className="h-5 w-5" />, color: 'bg-purple-50 text-purple-600' },
              { label: 'Categories', value: String(mockLibrary.stats.categories), icon: <BookOpen className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
            ].map((stat) => (
              <Card key={stat.label} className="p-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.color)}>
                      {stat.icon}
                    </div>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs
            tabs={[
              {
                id: 'documents',
                label: 'Documents',
                content: (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search documents..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Select
                        options={[
                          { value: 'all', label: 'All Types' },
                          { value: 'application/pdf', label: 'PDF' },
                          { value: 'text/markdown', label: 'Markdown' },
                          { value: 'text/csv', label: 'CSV' },
                          { value: 'text/html', label: 'HTML' },
                          { value: 'image/png', label: 'Image' },
                        ]}
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-40"
                      />
                      <Select
                        options={[
                          { value: 'all', label: 'All Categories' },
                          { value: 'guides', label: 'Guides' },
                          { value: 'technical', label: 'Technical' },
                          { value: 'support', label: 'Support' },
                          { value: 'general', label: 'General' },
                        ]}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-40"
                      />
                      <Button onClick={() => setUploadOpen(true)} className="ml-auto">
                        <Upload className="h-4 w-4" />
                        Upload
                      </Button>
                    </div>

                    {uploadProgress !== null && (
                      <Card className="p-0">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Upload className={cn('h-5 w-5', uploadStatus === 'done' ? 'text-green-500' : uploadStatus === 'error' ? 'text-red-500' : 'text-blue-500')} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">
                                {uploadStatus === 'uploading' && 'Uploading documents...'}
                                {uploadStatus === 'done' && 'Upload complete!'}
                                {uploadStatus === 'error' && 'Upload failed'}
                              </p>
                              <Progress value={uploadProgress} variant={uploadStatus === 'done' ? 'success' : 'default'} size="sm" className="mt-2" />
                            </div>
                            {uploadStatus === 'done' && <Check className="h-5 w-5 text-green-500" />}
                            {uploadStatus === 'error' && <X className="h-5 w-5 text-red-500" />}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {filteredDocuments.length === 0 ? (
                      <EmptyState
                        icon={<FileText className="h-12 w-12" />}
                        title="No documents found"
                        description={searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' ? 'Try adjusting your filters' : 'Upload your first document to this library'}
                        action={
                          !searchQuery && typeFilter === 'all' && categoryFilter === 'all' ? (
                            <Button onClick={() => setUploadOpen(true)}>
                              <Upload className="h-4 w-4" />
                              Upload Document
                            </Button>
                          ) : undefined
                        }
                      />
                    ) : (
                      <Card className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Chunks</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDocuments.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell>
                                  <Link href={`/tenant/knowledge/${params.id}/documents/${doc.id}`} className="flex items-center gap-2 font-medium text-gray-900 hover:text-blue-600">
                                    {getFileIcon(doc.type)}
                                    <span className="truncate max-w-[200px]">{doc.name}</span>
                                    <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  </Link>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {doc.type.split('/').pop()?.toUpperCase()}
                                </TableCell>
                                <TableCell className="text-gray-500">{formatBytes(doc.size)}</TableCell>
                                <TableCell>{doc.chunks}</TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant[doc.status]} className="gap-1">
                                    {statusIcon[doc.status]}
                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-500 text-xs">{formatDate(doc.createdAt)}</TableCell>
                                <TableCell>
                                  <Dropdown
                                    align="end"
                                    trigger={
                                      <button className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                                        </svg>
                                      </button>
                                    }
                                    items={[
                                      { label: 'View Details', icon: <ExternalLink className="h-4 w-4" />, onClick: () => window.location.href = `/tenant/knowledge/${params.id}/documents/${doc.id}` },
                                      { label: 'Re-index', icon: <RefreshCwIcon />, onClick: () => {} },
                                      { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, onClick: () => { setDeleteTarget(doc); setDeleteOpen(true) }, variant: 'danger' },
                                    ]}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: 'categories',
                label: 'Categories',
                content: (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Organize documents into categories and subcategories</p>
                      <Button size="sm" onClick={() => { setCategoryName(''); setCategoryParent('none'); setAddCategoryOpen(true) }}>
                        <Plus className="h-4 w-4" />
                        Add Category
                      </Button>
                    </div>
                    {categoriesData.length === 0 ? (
                      <EmptyState
                        icon={<FolderTree className="h-12 w-12" />}
                        title="No categories"
                        description="Create categories to organize your documents"
                        action={<Button size="sm" onClick={() => setAddCategoryOpen(true)}><Plus className="h-4 w-4" />Add Category</Button>}
                      />
                    ) : (
                      <Card className="p-0">
                        <CardContent className="p-4">
                          <CategoryTree categories={buildCategoryTree(categoriesData)} />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                id: 'settings',
                label: 'Settings',
                content: (
                  <div className="space-y-6 max-w-2xl">
                    <Card className="p-0">
                      <CardHeader>
                        <CardTitle>Embedding Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Select
                          label="Embedding Model"
                          options={[
                            { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
                            { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
                            { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' },
                          ]}
                          value={embeddingConfig.model}
                          onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, model: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Chunk Size"
                            type="number"
                            value={embeddingConfig.chunkSize}
                            onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, chunkSize: parseInt(e.target.value) || 0 })}
                          />
                          <Input
                            label="Chunk Overlap"
                            type="number"
                            value={embeddingConfig.chunkOverlap}
                            onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, chunkOverlap: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <Select
                          label="Indexing Schedule"
                          options={[
                            { value: 'manual', label: 'Manual' },
                            { value: 'hourly', label: 'Hourly' },
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                          ]}
                          value={embeddingConfig.indexingSchedule}
                          onChange={(e) => setEmbeddingConfig({ ...embeddingConfig, indexingSchedule: e.target.value })}
                        />
                        <Toggle
                          label="Auto-index documents"
                          description="Automatically index documents when they are uploaded"
                          checked={embeddingConfig.autoIndex}
                          onChange={(checked) => setEmbeddingConfig({ ...embeddingConfig, autoIndex: checked })}
                        />
                      </CardContent>
                    </Card>
                    <div className="flex justify-end">
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      <Dialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteTarget(null) }}
        title="Delete Document"
        description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.` : 'Are you sure you want to delete this item?'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
          </>
        }
      />

      <DocumentUpload
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />

      <Dialog
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        title="Add Category"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddCategoryOpen(false)} disabled={!categoryName}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. API Reference"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <Select
            label="Parent Category"
            options={[
              { value: 'none', label: 'None (Top Level)' },
              ...categoriesData.filter((c) => !c.parentId).map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryParent}
            onChange={(e) => setCategoryParent(e.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        open={editCategoryOpen}
        onClose={() => setEditCategoryOpen(false)}
        title="Edit Category"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditCategoryOpen(false)}>Cancel</Button>
            <Button onClick={() => setEditCategoryOpen(false)} disabled={!categoryName}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <Select
            label="Parent Category"
            options={[
              { value: 'none', label: 'None (Top Level)' },
              ...categoriesData.filter((c) => !c.parentId && c.id !== editingCategory?.id).map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryParent}
            onChange={(e) => setCategoryParent(e.target.value)}
          />
        </div>
      </Dialog>
    </>
  )
}

function RefreshCwIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}
