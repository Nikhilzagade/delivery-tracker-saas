import { connection } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  Wallet,
  IndianRupee,
  Share2,
  CheckCircle2,
  Clock
} from 'lucide-react';

async function getBills() {
  await connection();
  const vendor = await prisma.vendor.findFirst();
  if (!vendor) return [];
  
  return prisma.monthlyBill.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true
    }
  });
}

export default async function BillsPage() {
  const bills = await getBills();
  
  const pendingCount = bills.filter((b: any) => b.status === 'PENDING').length;
  const totalExpected = bills.filter((b: any) => b.status === 'PENDING').reduce((acc: number, bill: any) => acc + bill.totalAmount, 0);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Monthly Bills</h2>
        <p className="text-gray-500">Manage invoices and track pending payments.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 justify-between items-center mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div>
          <span className="text-blue-100 font-medium">Total Pending Revenue</span>
          <h3 className="text-4xl font-bold mt-1 flex items-center">
            <IndianRupee className="w-8 h-8 mr-1" />
            {totalExpected}
          </h3>
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm text-center min-w-[120px]">
          <span className="block text-3xl font-bold">{pendingCount}</span>
          <span className="text-sm font-medium text-blue-100">Unpaid Bills</span>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {bills.map((bill: any) => (
            <div key={bill.id} className="p-4 sm:p-6 hover:bg-gray-50 transition flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-2xl ${bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {bill.status === 'PAID' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{bill.customer.name}</h3>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1">
                    <span>Month: {bill.month}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Ph: {bill.customer.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-0 pt-4 sm:pt-0 border-gray-100">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-500 block">Amount</span>
                  <span className="text-lg font-bold text-gray-900">₹{bill.totalAmount}</span>
                </div>
                
                {bill.status === 'PENDING' && (
                  <a 
                    href={bill.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2 active:scale-95"
                  >
                    <Share2 className="w-4 h-4" /> Send Link
                  </a>
                )}
                {bill.status === 'PAID' && (
                  <div className="bg-green-50 text-green-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                    Settled
                  </div>
                )}
              </div>
            </div>
          ))}

          {bills.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No bills generated yet.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
