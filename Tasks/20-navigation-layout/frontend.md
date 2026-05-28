# Feature 20: Navigation & Layout — Frontend Tasks

## Overview
Feature 20 establishes the core navigation structure and layout for the entire web application using Next.js 15 App Router and Module Federation.

---

## Task 20.1.1: Root Layout Component & Theme Provider

### Description
Build the root layout with theme provider, global styles, and navigation wrapper.

### Dependencies
- TypeScript strict mode enabled
- TailwindCSS + CSS variables for theming
- React Context for theme management

### Requirements
- Root layout that wraps all pages
- Theme provider with Zatona Classic theme + 4 alternates
- Global styles with CSS variable system
- Dark mode support with localStorage persistence
- Font optimization with next/font

### Implementation Details

```typescript
// apps/web/shell/app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/app/providers';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'ELZATONA - Frontend Interview Prep',
  description: 'Gamified platform for frontend interview preparation',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0C0D0E" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans bg-white dark:bg-gray-950`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**CSS Variables:**
```css
/* apps/web/shell/app/globals.css */
:root {
  /* Zatona Classic Theme */
  --color-primary: #0C0D0E;
  --color-accent: #D1D29E;
  --color-secondary: #1A1B1E;
  --color-tertiary: #2D2E33;
  
  /* Additional colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}

html.dark {
  --color-primary: #F3F4F6;
  --color-secondary: #E5E7EB;
}

* {
  @apply transition-colors duration-200;
}

body {
  @apply bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100;
}
```

**Theme Provider:**
```typescript
// apps/web/shell/app/providers.tsx
'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

### Testing Checklist
- ✅ Root layout renders without errors
- ✅ Theme provider initializes correctly
- ✅ CSS variables apply to elements
- ✅ Dark mode toggle works
- ✅ Theme persists in localStorage
- ✅ Font optimization loads correctly
- ✅ Mobile viewport meta tags set properly

---

## Task 20.1.2: Navigation Bar & Authentication State

### Description
Build responsive navigation bar with logo, user menu, and authentication status indicator.

### Implementation Details

```typescript
// apps/web/shell/components/Navigation/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import MobileMenu from './MobileMenu';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">⚡</span>
            <span>ELZATONA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link href="/dashboard" className="hover:text-primary transition">
                  Dashboard
                </Link>
                <Link href="/paths" className="hover:text-primary transition">
                  Paths
                </Link>
                <Link href="/practice" className="hover:text-primary transition">
                  Practice
                </Link>
              </>
            ) : (
              <>
                <Link href="/features" className="hover:text-primary transition">
                  Features
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            {/* Auth Section */}
            {isLoading ? (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            ) : user ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login" className="px-4 py-2 rounded-lg hover:bg-gray-100">
                  Login
                </Link>
                <Link href="/auth/signup" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <MobileMenu user={user} onLogout={logout} />}
    </nav>
  );
}
```

### Testing Checklist
- ✅ Navigation bar renders on all pages
- ✅ Logo links to home
- ✅ Auth state displays correctly
- ✅ Theme toggle switches themes
- ✅ Mobile menu appears on small screens
- ✅ User menu dropdown works
- ✅ Logout function works
- ✅ Responsive layout adapts to screen size

---

## Task 20.1.3: Sidebar Navigation & Main Layout

### Description
Build collapsible sidebar for main application with navigation links and user stats.

### Implementation Details

```typescript
// apps/web/shell/components/Navigation/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Learning Paths', href: '/paths', icon: '🎯' },
  { label: 'Practice', href: '/practice', icon: '✏️' },
  { label: 'Leaderboard', href: '/leaderboard', icon: '🏆' },
  { label: 'Achievements', href: '/achievements', icon: '🏅' },
  { label: 'Shop', href: '/shop', icon: '🛍️' },
  { label: 'Profile', href: '/profile', icon: '👤' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: userService.getStats,
  });

  return (
    <aside
      className={`${
        open ? 'w-64' : 'w-20'
      } bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 min-h-screen flex flex-col`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Toggle sidebar"
      >
        {open ? '◀' : '▶'}
      </button>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
              title={!open ? item.label : undefined}
            >
              <span className="text-xl">{item.icon}</span>
              {open && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Stats Widget */}
      {open && stats && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Level</span>
            <span className="font-bold">{stats.level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">XP</span>
            <span className="font-bold">{stats.xp}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Streak</span>
            <span className="font-bold">🔥 {stats.streak}</span>
          </div>
        </div>
      )}
    </aside>
  );
}
```

### Testing Checklist
- ✅ Sidebar toggles between open/closed states
- ✅ Navigation links highlight on active page
- ✅ Stats display correctly when sidebar open
- ✅ Responsive on mobile (collapses)
- ✅ Icons render clearly
- ✅ Hover states work
- ✅ Links navigate correctly

---

## Task 20.1.4: Dashboard Layout Template

### Description
Build the main dashboard layout combining navbar, sidebar, and content area.

### Implementation Details

```typescript
// apps/web/shell/app/(authenticated)/layout.tsx
import Navbar from '@/components/Navigation/Navbar';
import Sidebar from '@/components/Navigation/Sidebar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### Testing Checklist
- ✅ Layout renders with all components
- ✅ Navigation and sidebar visible
- ✅ Content scrolls independently
- ✅ Responsive on all screen sizes
- ✅ No layout shift on scroll

---

## Task 20.1.5: Mobile Bottom Navigation (Web & Mobile)

### Description
Build bottom navigation bar for mobile devices with quick access to main sections.

### Implementation Details

```typescript
// apps/web/shell/components/Navigation/BottomNav.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const items = [
  { label: 'Home', href: '/dashboard', icon: '🏠' },
  { label: 'Paths', href: '/paths', icon: '🎯' },
  { label: 'Practice', href: '/practice', icon: '✏️' },
  { label: 'Profile', href: '/profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="flex justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 text-center flex flex-col items-center gap-1 transition ${
                isActive ? 'text-primary' : 'text-gray-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Testing Checklist
- ✅ Bottom nav appears only on mobile
- ✅ Links highlight on active page
- ✅ Navigation functions correctly
- ✅ Doesn't overlap content
- ✅ Touch targets adequate size

---

## Summary

Feature 20 frontend includes 5 interconnected tasks establishing the core navigation and layout structure for the entire application.

**Total Frontend Tasks: 5**
**Estimated Effort: 35 hours**
**Dependencies: None (foundational feature)**
