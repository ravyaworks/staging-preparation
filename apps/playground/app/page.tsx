import Link from 'next/link'
import { Code2, ArrowRight } from 'lucide-react'

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center rounded-xl bg-blue-50 p-4">
          <Code2 className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">API Playground</h1>
        <p className="text-lg text-muted-foreground">
          Test and explore the Conversation Platform API interactively.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href="https://github.com/ravyaworks/conversation-platform"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            View on GitHub <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
