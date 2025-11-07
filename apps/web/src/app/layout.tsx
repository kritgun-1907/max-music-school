// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './global.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Max Music School',
    template: '%s | Max Music School',
  },
  description: 'Comprehensive music education management platform for students and teachers',
  keywords: ['music school', 'education', 'management', 'learning', 'attendance', 'music classes'],
  authors: [{ name: 'Max Music School Team' }],
  creator: 'Max Music School',
  publisher: 'Max Music School',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Max Music School',
    description: 'Comprehensive music education management platform',
    url: '/',
    siteName: 'Max Music School',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased min-h-screen bg-gradient-warm">
        <div id="root" className="min-h-screen">
          {children}
        </div>
        <div id="portal" />
      </body>
    </html>
  );
}