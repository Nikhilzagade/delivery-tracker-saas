import { connection } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  Users,
  MessageCircle,
  MapPin,
  TrendingUp,
  Settings
} from 'lucide-react';

async function getCustomers() {
  await connection();
  const vendor = await prisma.vendor.findFirst();
  if (!vendor) return [];
  
  return prisma.customer.findMany({
    where: { vendorId: vendor.id },
    orderBy: { routeOrder: 'asc' },
  });
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers Directory</h2>
          <p className="text-gray-500">Manage your {customers.length} active subscribers.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition active:scale-95">
          + New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer: any) => (
          <div key={customer.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">
                {customer.name.charAt(0)}
              </div>
              <button className="text-gray-400 hover:text-gray-900 p-2 opacity-0 group-hover:opacity-100 transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
            
            <div className="space-y-2 mt-4 text-sm text-gray-500 flex-1">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="line-clamp-1">{customer.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{customer.phone}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">Default Qt.</span>
                <span className="font-bold text-gray-900">{customer.defaultQuantity} Liters</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">Rate</span>
                <span className="font-bold text-gray-900 text-blue-600">₹{customer.ratePerUnit}/L</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
