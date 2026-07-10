'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, Button, Progress, Badge } from '@conversation-platform/ui'
import { cn, formatBytes } from '@/lib/utils'
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
}

interface DocumentUploadProps {
  open: boolean
  onClose: () => void
  onUpload: (files: File[]) => void
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/csv',
  'text/html',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
]

const ACCEPTED_STR = '.pdf,.md,.txt,.csv,.html,.docx,.doc,.png,.jpg,.jpeg'

export function DocumentUpload({ open, onClose, onUpload }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: File[]) => {
    const newFiles = incoming
      .filter((f) => ACCEPTED_TYPES.includes(f.type))
      .map((file) => ({
        file,
        id: Math.random().toString(36).substring(2, 9),
        progress: 0,
        status: 'pending' as const,
      }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }, [addFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }, [addFiles])

  const handleUpload = () => {
    if (files.length === 0) {return}
    setUploading(true)
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'uploading' as const })),
    )

    const totalSteps = 10
    let step = 0
    const interval = setInterval(() => {
      step++
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          progress: Math.min(Math.round((step / totalSteps) * 100), 100),
          status: step >= totalSteps ? 'done' as const : 'uploading' as const,
        })),
      )
      if (step >= totalSteps) {
        clearInterval(interval)
        onUpload(files.map((f) => f.file))
        setTimeout(() => {
          setFiles([])
          setUploading(false)
          onClose()
        }, 1000)
      }
    }, 300)
  }

  const handleClose = () => {
    if (uploading) {return}
    setFiles([])
    onClose()
  }

  const totalProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0

  const allDone = files.length > 0 && files.every((f) => f.status === 'done')

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Upload Documents"
      description="Upload files to your knowledge library"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-gray-500">
            {files.length > 0 && `${files.length} file${files.length !== 1 ? 's' : ''} selected`}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading} isLoading={uploading}>
              {uploading ? 'Uploading...' : allDone ? 'Done' : 'Upload'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_STR}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="mb-3 rounded-full bg-blue-100 p-3 text-blue-600">
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            {dragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF, Markdown, TXT, CSV, HTML, DOCX, PNG, JPEG (max 50MB each)
          </p>
        </div>

        {uploading && files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="text-gray-500">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} variant={allDone ? 'success' : 'default'} />
          </div>
        )}

        {files.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  f.status === 'done' && 'border-green-200 bg-green-50',
                  f.status === 'error' && 'border-red-200 bg-red-50',
                )}
              >
                <FileText className="h-5 w-5 shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(f.file.size)}</p>
                  {(f.status === 'uploading' || f.status === 'done') && (
                    <Progress
                      value={f.progress}
                      variant={f.status === 'done' ? 'success' : 'default'}
                      size="sm"
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.status === 'done' && <Check className="h-4 w-4 text-green-500" />}
                  {f.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {f.status === 'pending' && (
                    <button
                      onClick={() => removeFile(f.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {ACCEPTED_TYPES.slice(0, 4).map((type) => (
              <Badge key={type} variant="default" className="text-xs">
                {type.split('/').pop()?.toUpperCase()}
              </Badge>
            ))}
            <Badge variant="default" className="text-xs">+ more</Badge>
          </div>
        )}
      </div>
    </Dialog>
  )
}
