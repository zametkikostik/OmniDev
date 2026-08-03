import type { Metadata } from 'next';
import './globals.css';
import { Web3Providers } from '@/components/wallet/Providers';
import { I18nProvider } from '@/lib/i18n/context';

export const metadata: Metadata = {
  title: 'OmniDev — AI Full-Stack Builder',
  description: 'Build full-stack apps with AI. Autonomous. Instant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <I18nProvider>
          <Web3Providers>{children}</Web3Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
