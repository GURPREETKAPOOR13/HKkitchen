import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HK Kitchen - Homemade Goodness, Just Like Home!',
  description: 'Fresh, hygienic, and delicious homemade food in Rohini, Delhi. Serving parathas, rice combos, sandwiches, evening snacks, and desserts right to your doorstep.',
  keywords: 'homemade food, food delivery Rohini, HK Kitchen, home kitchen Delhi, tiffin service Rohini, fresh paratha, rajma rice, chole rice Delhi',
  authors: [{ name: 'HK Kitchen' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-[#1a4a1a] bg-[#fdfbf7] selection:bg-[#f5a623] selection:text-white">
        {children}
      </body>
    </html>
  );
}
