'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@conversation-platform/ui'
import { Input } from '@conversation-platform/ui'
import { Button } from '@conversation-platform/ui'
import { Badge } from '@conversation-platform/ui'
import { Textarea } from '@conversation-platform/ui'
import { cn } from '@/lib/utils'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LifeBuoy,
  BookOpen,
  ArrowRight,
  Send,
  Code,
} from 'lucide-react'
import Link from 'next/link'

interface FaqItem {
  question: string
  answer: string
  category: string
}

const faqCategories = [
  { label: 'Getting Started', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Account & Billing', icon: <FileText className="h-4 w-4" /> },
  { label: 'Widget Setup', icon: <MessageSquare className="h-4 w-4" /> },
  { label: 'API & Integrations', icon: <ExternalLink className="h-4 w-4" /> },
  { label: 'Troubleshooting', icon: <AlertTriangle className="h-4 w-4" /> },
]

const faqs: FaqItem[] = [
  {
    question: 'How do I get started with the platform?',
    answer: 'Sign up for an account, create your first tenant, and use our quickstart guide to set up your first conversation widget. You can find the full guide in our documentation.',
    category: 'Getting Started',
  },
  {
    question: 'How do I create and manage API keys?',
    answer: 'Visit the Developer Portal from the sidebar. You can create, view, copy, and revoke API keys there. We recommend creating separate keys for production, staging, and development environments.',
    category: 'API & Integrations',
  },
  {
    question: 'Can I customize the chat widget appearance?',
    answer: 'Yes! Use the Widget Builder to customize colors, fonts, corner radius, position, and more. You can also enable dark mode and toggle branding visibility.',
    category: 'Widget Setup',
  },
  {
    question: 'How does billing work?',
    answer: 'We charge based on your plan tier and usage. Each plan includes a base number of conversations and API calls. Overages are billed at the end of each billing cycle. You can view your current usage in the analytics dashboard.',
    category: 'Account & Billing',
  },
  {
    question: 'What models are available for conversations?',
    answer: 'We support GPT-4 Turbo, GPT-3.5 Turbo, Claude 3 Sonnet, Claude 3 Haiku, and Mistral Large. You can switch models per conversation or set a default model for your tenant.',
    category: 'Getting Started',
  },
  {
    question: 'How do I set up webhooks?',
    answer: 'Go to Settings > Webhooks in your tenant dashboard. Add your endpoint URL, select the events you want to receive, and save. We\'ll send HTTP POST requests with event data to your endpoint.',
    category: 'API & Integrations',
  },
  {
    question: 'Why is my widget not appearing on my website?',
    answer: 'Common issues include: incorrect embed code, ad blockers interfering, or the widget not being published. Check the Widget Builder to ensure your widget is published and the embed code is correctly placed before the closing body tag.',
    category: 'Troubleshooting',
  },
  {
    question: 'Can I export my conversation data?',
    answer: 'Yes, you can export conversations from the Analytics dashboard. Use the Export button to download data in CSV or JSON format. For programmatic access, use our API with the appropriate endpoint.',
    category: 'Account & Billing',
  },
]

const systemStatus = [
  { label: 'API', status: 'operational' as const, uptime: '99.99%' },
  { label: 'Widget Delivery', status: 'operational' as const, uptime: '99.97%' },
  { label: 'Webhook Processing', status: 'operational' as const, uptime: '99.95%' },
  { label: 'Knowledge Base', status: 'operational' as const, uptime: '99.99%' },
  { label: 'Database', status: 'operational' as const, uptime: '99.99%' },
  { label: 'AI Inference', status: 'degraded' as const, uptime: '99.80%' },
]

const statusConfig = {
  operational: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-green-600', bg: 'bg-green-50', label: 'Operational' },
  degraded: { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Degraded' },
  down: { icon: <XCircle className="h-3.5 w-3.5" />, color: 'text-red-600', bg: 'bg-red-50', label: 'Down' },
}

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('Getting Started')
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const toggleFaq = (question: string) => {
    setExpandedFaqs((prev) =>
      prev.includes(question) ? prev.filter((q) => q !== question) : [...prev, question]
    )
  }

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.category === activeCategory &&
      (faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <PageHeader title="Help & Support" description="Find answers, contact support, and check system status" />

      <div className="p-6 space-y-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for answers..."
            className="pl-12 py-3 text-base rounded-xl border-gray-200"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {faqCategories.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => setActiveCategory(cat.label)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                        activeCategory === cat.label
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-1">
                  {filteredFaqs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No results found for &quot;{search}&quot;
                    </p>
                  ) : (
                    filteredFaqs.map((faq) => (
                      <div key={faq.question} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleFaq(faq.question)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-left">{faq.question}</span>
                          {expandedFaqs.includes(faq.question) ? (
                            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFaqs.includes(faq.question) && (
                          <div className="px-4 pb-3 text-sm text-gray-500">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Message Sent!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Our support team will get back to you within 24 hours.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setContactForm({ name: '', email: '', subject: '', message: '' }) }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <Input
                        value={contactForm.subject}
                        onChange={(e) => setContactForm((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="How can we help?"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <Textarea
                        value={contactForm.message}
                        onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Describe your issue in detail..."
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Send className="h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemStatus.map((item) => {
                  const status = statusConfig[item.status]
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={status.color}>{status.icon}</span>
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-medium', status.color)}>{status.label}</span>
                        <span className="text-xs text-gray-400">{item.uptime}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last checked</span>
                    <span className="text-gray-700 font-medium">2 minutes ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/docs" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Documentation</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link href="/developer" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Code className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">API Reference</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
                <a href="mailto:support@conversation-platform.com" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Email Support</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </a>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Live Chat</span>
                  </div>
                  <Badge variant="success">Online</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
              <LifeBuoy className="h-8 w-8 mb-3" />
              <h3 className="text-base font-semibold mb-1">Need urgent help?</h3>
              <p className="text-sm text-blue-100 mb-4">
                Our support team is available 24/7 for critical issues.
              </p>
              <a href="tel:+18005551234" className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white">
                <Phone className="h-4 w-4" />
                +1 (800) 555-1234
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
