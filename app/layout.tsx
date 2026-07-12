import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeWrapper } from '@/components/ThemeWrapper';
import { getServerSession } from 'next-auth';
import SessionProvider from '@/components/SessionProvider';
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ResumeItNow - Free Open Source Resume Builder',
  description: 'Create professional, ATS-friendly resumes for free. No watermarks, no hidden fees. AI-powered resume builder with modern templates.',
  keywords: 'resume builder, cv maker, free resume, ATS-friendly resume, AI resume builder, professional templates',
  authors: [{ name: 'Mahesh Paul J' }],
  creator: 'ResumeItNow',
  publisher: 'ResumeItNow',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://resumeitnow.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ResumeItNow - Free Open Source Resume Builder',
    description: 'Create professional, ATS-friendly resumes for free. No watermarks, no hidden fees. AI-powered resume builder with modern templates.',
    url: 'https://resumeitnow.vercel.app',
    siteName: 'ResumeItNow',
    images: [
      {
        url: '/assets/ss.png',
        width: 1200,
        height: 630,
        alt: 'ResumeItNow Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeItNow - Free Open Source Resume Builder',
    description: 'Create professional, ATS-friendly resumes for free. No watermarks, no hidden fees. AI-powered resume builder with modern templates.',
    images: ['/assets/ss.png'],
    creator: '@resumeitnow',
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
  verification: {
    google: 'IVOjL--iVz33j73JnMvQT2vZsRoEje6C9GQGxF8BlxQ',
  },
  category: 'technology',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession();
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="google-site-verification" content="IVOjL--iVz33j73JnMvQT2vZsRoEje6C9GQGxF8BlxQ" />
        {/* Schema.org markup for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "http://schema.org",
              "@type": "WebApplication",
              "name": "ResumeItNow",
              "description": "Create professional, ATS-friendly resumes for free. No watermarks, no hidden fees. AI-powered resume builder with modern templates.",
              "url": "https://resumeitnow.vercel.app",
              "applicationCategory": "Resume Builder",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "ResumeItNow"
              }
            })
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider session={session}>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}