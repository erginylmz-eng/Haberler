import './globals.css';

export const metadata = {
  title: 'Movus Haber | Lojistik & Finans Özetleri',
  description:
    'Movus Lojistik için dünya ve Türkiye lojistik gelişmeleri ile finans sektörü haberlerinin yapay zeka destekli özetleri.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#132559',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
