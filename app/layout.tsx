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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-body text-brand-700 bg-cream-50 selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
