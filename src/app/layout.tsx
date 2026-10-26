import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { NotificationProvider } from '@/context/notification-context';

export const metadata: Metadata = {
  title: 'NyeniPOS — Mango Nyeni POS & Operational System',
  description: 'Sistem Kasir dan Operasional Bisnis Dessert Mango Nyeni',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/logo-mango-nyeni.png',
    apple: '/assets/logo-mango-nyeni.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#142A72',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <NotificationProvider>
            <CartProvider>{children}</CartProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
