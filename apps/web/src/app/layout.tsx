import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniDev — AI Full-Stack Builder',
  description: 'Создавай полноценные приложения с помощью ИИ. Автономно. Мгновенно.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
