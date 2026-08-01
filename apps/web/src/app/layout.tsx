import type { Metadata } from 'next';
import './globals.css';
import { Web3Providers } from '@/components/wallet/Providers';

export const metadata: Metadata = {
  title: 'OmniDev — AI Full-Stack Builder',
  description: 'Создавай полноценные приложения с помощью ИИ.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
