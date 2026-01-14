import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Updated font configuration with more specific options
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "adbix",
  description: "Upload and host your static website",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/favicon.ico', sizes: '48x48', type: 'image/x-icon' }
    ],
    shortcut: '/favicon_io/favicon.ico',
    apple: '/favicon_io/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome', url: '/favicon_io/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/favicon_io/android-chrome-512x512.png', sizes: '512x512' }
    ]
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2651064707147566"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
