import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function KnowledgePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Knowledge API</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage knowledge bases that power AI-generated responses and RAG pipelines.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <pre>https://api.conversation-platform.dev/v1/knowledge</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Knowledge Bases</h2>
        <pre>
{`GET /v1/knowledge/bases`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "kb_abc123",
      "name": "Product FAQ",
      "description": "Frequently asked questions about our product",
      "documentCount": 45,
      "status": "ready",
      "embeddingModel": "text-embedding-3-small",
      "createdAt": "2024-03-10T09:00:00Z"
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Create Knowledge Base</h2>
        <pre>
{`POST /v1/knowledge/bases
Content-Type: application/json

{
  "name": "Product FAQ",
  "description": "Frequently asked questions about our product",
  "embeddingModel": "text-embedding-3-small",
  "chunkSize": 1000,
  "chunkOverlap": 200
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Upload Document</h2>
        <pre>
{`POST /v1/knowledge/bases/:id/documents
Content-Type: multipart/form-data

file: product-guide.pdf
metadata: {"category": "guide", "version": "2.0"}`}
        </pre>
        <h3 className="text-lg font-medium">Supported Formats</h3>
        <ul className="list-disc space-y-1 pl-6">
          <li>PDF (.pdf)</li>
          <li>Markdown (.md)</li>
          <li>Plain text (.txt)</li>
          <li>HTML (.html)</li>
          <li>CSV (.csv)</li>
          <li>JSON (.json)</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">List Documents</h2>
        <pre>
{`GET /v1/knowledge/bases/:id/documents`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "data": [
    {
      "id": "doc_xyz",
      "name": "product-guide.pdf",
      "size": 245760,
      "chunkCount": 32,
      "status": "indexed",
      "uploadedAt": "2024-07-01T10:00:00Z"
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Search Knowledge Base</h2>
        <pre>
{`POST /v1/knowledge/bases/:id/search
Content-Type: application/json

{
  "query": "How do I reset my password?",
  "limit": 5,
  "scoreThreshold": 0.7
}`}
        </pre>
        <h3 className="text-lg font-medium">Response</h3>
        <pre>
{`{
  "results": [
    {
      "documentId": "doc_abc",
      "chunkId": "chunk_xyz",
      "content": "To reset your password, go to Settings > Security > Reset Password...",
      "score": 0.92,
      "metadata": {
        "page": 3,
        "section": "Account Management"
      }
    }
  ]
}`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Document</h2>
        <pre>
{`DELETE /v1/knowledge/bases/:id/documents/:docId`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delete Knowledge Base</h2>
        <pre>
{`DELETE /v1/knowledge/bases/:id`}
        </pre>
      </section>

      <div className="flex items-center justify-between border-t pt-6 dark:border-gray-800">
        <Link href="/api/messages" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Messages
        </Link>
        <Link href="/api/workflows" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
          Workflows <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
