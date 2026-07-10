'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md border bg-white p-2 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
