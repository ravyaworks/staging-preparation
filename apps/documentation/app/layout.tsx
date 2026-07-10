import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/sidebar';
import { ThemeToggle } from '../components/theme-toggle';

export const metadata: Metadata = {
  title: 'Conversation Platform - Developer Documentation',
  description:
    'Official developer documentation for the Conversation Platform. Build, integrate, and scale conversational experiences across channels.',
  keywords: ['conversation platform', 'API', 'documentation', 'chatbot', 'integrations'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white dark:bg-gray-950">
        <Sidebar />
        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
            <div className="lg:hidden" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
