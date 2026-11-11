import { Geist } from 'next/font/google';

import './globals.css';

import ErrorBoundary from '@/components/ui/ErrorBoundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata = {
  title: 'BTC Graph Explorer',
  description: 'Interactive Bitcoin transaction graph explorer',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable}`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
