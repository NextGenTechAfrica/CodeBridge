// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import PWAProvider from '@/components/common/PWAProvider';
import './globals.css';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0B1B3D' },
    { media: '(prefers-color-scheme: dark)', color: '#070F26' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'CodeBridge — Ideas to Impact | Build Your Project. Bridge to the World.',
  description:
    'CodeBridge designs, develops, and deploys high-performance digital products and custom business software for companies globally — delivered on time and within budget.',
  keywords: [
    'CodeBridge',
    'Ideas to Impact',
    'Digital products',
    'Custom software development',
    'Web application development',
    'Business management systems',
    'E-commerce platforms',
    'Milestone escrow software',
    'PWA'
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CodeBridge',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png?v=cb6', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=cb6', sizes: '16x16', type: 'image/png' },
      { url: '/icon.svg?v=cb6', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico?v=cb6',
    apple: [
      { url: '/apple-touch-icon.png?v=cb6', sizes: '180x180', type: 'image/png' },
    ],
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CodeBridge" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=cb6" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=cb6" />
        <link rel="shortcut icon" href="/favicon.ico?v=cb6" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg?v=cb6" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=cb6" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PWAProvider>
            {children}
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
