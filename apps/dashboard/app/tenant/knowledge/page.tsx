'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import {
  Card, CardContent,
  Button, Input, Badge, Dialog, Skeleton, EmptyState, Select,
} from '@conversation-platform/ui'
import { formatDate, pluralize } from '@/lib/utils'
import {
  BookOpen, Search, Plus, FileText, FolderTree, Tag, Grid3X3, List, Library,
} from 'lucide-react'
import Link from 'next/link'

interface KnowledgeLibrary {
  id: string
  name: string
  description: string
  documentCount: number
  categoryCount: number
  lastUpdated: string
  status: 'active' | 'archived'
}

interface CreateLibraryData {
  name: string
  description: string
  category: string
}

const mockLibraries: KnowledgeLibrary[] = [
  { id: '1', name: 'Product Documentation', description: 'Official product docs, API references, and integration guides', documentCount: 48, categoryCount: 6, lastUpdated: '2026-07-05T14:30:00Z', status: 'active' },
  { id: '2', name: 'Customer Support KB', description: 'FAQs, troubleshooting guides, and support best practices', documentCount: 124, categoryCount: 12, lastUpdated: '2026-07-04T09:15:00Z', status: 'active' },
  { id: '3', name: 'Engineering Wiki', description: 'Internal engineering documentation and architecture decisions', documentCount: 76, categoryCount: 8, lastUpdated: '2026-07-03T16:45:00Z', status: 'active' },
  { id: '4', name: 'Onboarding Materials', description: 'New hire onboarding guides and training resources', documentCount: 32, categoryCount: 4, lastUpdated: '2026-06-28T11:00:00Z', status: 'active' },
  { id: '5', name: 'Compliance & Legal', description: 'Regulatory documents, compliance checklists, and legal policies', documentCount: 19, categoryCount: 5, lastUpdated: '2026-06-20T08:30:00Z', status: 'active' },
  { id: '6', name: 'Marketing Assets', description: 'Brand guidelines, campaign playbooks, and content templates', documentCount: 57, categoryCount: 7, lastUpdated: '2026-06-15T13:00:00Z', status: 'archived' },
]

const statsData = [
  { label: 'Total Libraries', value: '6', icon: <Library className="h-5 w-5" /> },
  { label: 'Documents', value: '356', icon: <FileText className="h-5 w-5" /> },
  { label: 'Total Chunks', value: '12,847', icon: <FolderTree className="h-5 w-5" /> },
  { label: 'Embeddings', value: '12,847', icon: <Tag className="h-5 w-5" /> },
]

export default function KnowledgeLibraries() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [createOpen, setCreateOpen] = useState(false)
  const [createData, setCreateData] = useState<CreateLibraryData>({ name: '', description: '', category: '' })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filteredLibraries = useMemo(() => {
    if (!searchQuery) {return mockLibraries}
    const q = searchQuery.toLowerCase()
    return mockLibraries.filter(
      (lib) => lib.name.toLowerCase().includes(q) || lib.description.toLowerCase().includes(q),
    )
  }, [searchQuery])

  const handleCreate = () => {
    setCreateOpen(false)
    setCreateData({ name: '', description: '', category: '' })
  }

  const StatCard = ({ item }: { item: typeof statsData[number] }) => (
    <Card className="p-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            {item.icon}
          </div>
        </div>
        <p className="mt-4 text-2xl font-bold text-gray-900">{item.value}</p>
        <p className="mt-1 text-sm text-gray-500">{item.label}</p>
      </CardContent>
    </Card>
  )

  const StatCardSkeleton = () => (
    <Card className="p-0">
      <CardContent className="p-6">
        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
        <Skeleton variant="text" width="60%" className="mt-4" />
        <Skeleton variant="text" width="40%" className="mt-1" />
      </CardContent>
    </Card>
  )

  const LibraryCard = ({ library }: { library: KnowledgeLibrary }) => (
    <Link href={`/tenant/knowledge/${library.id}`}>
      <Card className="p-0 h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <Badge variant={library.status === 'active' ? 'success' : 'default'}>
              {library.status}
            </Badge>
          </div>
          <h3 className="mt-4 font-semibold text-gray-900">{library.name}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{library.description}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {library.documentCount} {pluralize(library.documentCount, 'document')}
            </span>
            <span className="flex items-center gap-1">
              <FolderTree className="h-3.5 w-3.5" />
              {library.categoryCount} {pluralize(library.categoryCount, 'category')}
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-400">Updated {formatDate(library.lastUpdated)}</p>
        </CardContent>
      </Card>
    </Link>
  )

  const LibraryListItem = ({ library }: { library: KnowledgeLibrary }) => (
    <Link href={`/tenant/knowledge/${library.id}`}>
      <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 transition-shadow hover:shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{library.name}</h3>
          <p className="mt-0.5 text-sm text-gray-500 truncate">{library.description}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
          <span>{library.documentCount} docs</span>
          <span>{library.categoryCount} categories</span>
        </div>
        <p className="hidden md:block text-xs text-gray-400">{formatDate(library.lastUpdated)}</p>
        <Badge variant={library.status === 'active' ? 'success' : 'default'}>
          {library.status}
        </Badge>
      </div>
    </Link>
  )

  const LibraryCardSkeleton = () => (
    <Card className="p-0">
      <CardContent className="p-6">
        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
        <Skeleton variant="text" width="70%" className="mt-4" />
        <Skeleton variant="text" width="100%" className="mt-2" />
        <Skeleton variant="text" width="50%" className="mt-4" />
        <Skeleton variant="text" width="40%" className="mt-1" />
      </CardContent>
    </Card>
  )

  return (
    <>
      <PageHeader title="Knowledge Libraries" description="Manage your knowledge bases for AI-powered conversations">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Library
        </Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((item) => <StatCard key={item.label} item={item} />)}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search libraries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <LibraryCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4">
                  <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="70%" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredLibraries.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="No libraries found"
            description={searchQuery ? 'Try a different search term' : 'Create your first knowledge library to get started'}
            action={
              !searchQuery ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Library
                </Button>
              ) : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibraries.map((library) => <LibraryCard key={library.id} library={library} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLibraries.map((library) => <LibraryListItem key={library.id} library={library} />)}
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Knowledge Library"
        description="Create a new library to organize your knowledge documents"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!createData.name}>Create</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. Product Documentation"
            value={createData.name}
            onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Brief description of this library"
            value={createData.description}
            onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
          />
          <Select
            label="Category"
            options={[
              { value: 'general', label: 'General' },
              { value: 'technical', label: 'Technical' },
              { value: 'support', label: 'Support' },
              { value: 'internal', label: 'Internal' },
            ]}
            placeholder="Select a category"
            value={createData.category}
            onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
          />
        </div>
      </Dialog>
    </>
  )
}
