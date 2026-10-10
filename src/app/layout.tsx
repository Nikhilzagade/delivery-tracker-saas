import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { connection } from 'next/server';
import { Truck, Users, Wallet } from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeliveryTracker | Vendor Dashboard',
  description: 'WhatsApp-first daily delivery tracker for vendors.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DeliveryTracker</h1>
            </div>
            <div className="flex items-center gap-4">
              <span suppressHydrationWarning className="text-sm text-gray-500 hidden md:block">{date}</span>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                V
              </div>
            </div>
          </div>
        </header>

        <div className="pb-20 md:pb-0 min-h-[calc(100vh-64px)]">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around pb-safe z-20">
          <Link href="/" className="flex flex-col items-center p-3 text-blue-600 hover:text-blue-700 transition">
            <Truck className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Route</span>
          </Link>
          <Link href="/customers" className="flex flex-col items-center p-3 text-gray-400 hover:text-gray-900 transition">
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Customers</span>
          </Link>
          <Link href="/bills" className="flex flex-col items-center p-3 text-gray-400 hover:text-gray-900 transition">
            <Wallet className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Bills</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
