export const instant = false;

import React from 'react';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { connection } from 'next/server';
import { 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  MessageCircle,
  Truck,
  Users,
  Wallet
} from 'lucide-react';

// Server Action to log a delivery status
async function logDeliveryStatus(formData: FormData) {
  'use server';
  await connection();
  const customerId = formData.get('customerId') as string;
  const status = formData.get('status') as string;
  const quantity = parseFloat(formData.get('quantity') as string);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if a log already exists for today
  const existing = await prisma.dailyLog.findFirst({
    where: { customerId, date: today }
  });

  if (existing) {
    await prisma.dailyLog.update({
      where: { id: existing.id },
      data: { status, quantity }
    });
  } else {
    await prisma.dailyLog.create({
      data: { customerId, date: today, status, quantity }
    });
  }

  revalidatePath('/'); // Refresh UI
}

async function getDashboardData() {
  try {
    await connection();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vendor = await prisma.vendor.findFirst();
    if (!vendor) throw new Error('No vendors found');

    const [customers, todaysLogs, pendingBills] = await Promise.all([
      prisma.customer.findMany({
        where: { vendorId: vendor.id },
        orderBy: { routeOrder: 'asc' },
      }),
      prisma.dailyLog.findMany({
        where: { 
          date: today,
          customer: { vendorId: vendor.id }
        }
      }),
      prisma.monthlyBill.findMany({
        where: { 
          status: 'PENDING',
          vendorId: vendor.id
        }
      })
    ]);
    
    if (customers.length > 0) {
      const skippedCount = todaysLogs.filter(log => log.status === 'SKIPPED').length;
      const deliveredCount = todaysLogs.filter(log => log.status === 'DELIVERED').length;
      const extraCount = todaysLogs.filter(log => log.status === 'EXTRA').length;
      
      const totalPending = pendingBills.reduce((acc, bill) => acc + bill.totalAmount, 0);

      return {
        customers,
        stats: {
          delivered: deliveredCount + extraCount,
          skipped: skippedCount,
          pendingBillsAmount: totalPending,
        },
        logs: todaysLogs
      };
    }
    throw new Error('Empty or no DB');
  } catch (error) {
    return {
      customers: [
        { id: '1', name: 'Ramesh Sharma', phone: '9876543210', address: 'B-201, Green View Apts', defaultQuantity: 1, routeOrder: 1, active: true },
        { id: '2', name: 'Priya Patel', phone: '9876543211', address: 'A-105, Sunflower Society', defaultQuantity: 2, routeOrder: 2, active: true },
        { id: '3', name: 'Amit Kumar', phone: '9876543212', address: 'C-302, Blue Ridge', defaultQuantity: 1.5, routeOrder: 3, active: true },
      ],
      stats: { delivered: 0, skipped: 0, pendingBillsAmount: 0 },
      logs: []
    };
  }
}

export default async function Dashboard() {
  const { customers, stats, logs } = await getDashboardData();
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <main>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500">Today's Deliveries</span>
            <span className="text-2xl font-bold text-gray-900 mt-1">{stats.delivered}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500">Skipped</span>
            <span className="text-2xl font-bold text-amber-500 mt-1">{stats.skipped}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500">Pending Bills</span>
            <span className="text-2xl font-bold text-red-500 mt-1">₹{stats.pendingBillsAmount}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-medium text-gray-500">Active Customers</span>
            <span className="text-2xl font-bold text-blue-600 mt-1">{customers.length}</span>
          </div>
        </div>

        {/* Route Sheet */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Route</h2>
              <p suppressHydrationWarning className="text-sm text-gray-500 mt-1">Route order for {date}</p>
            </div>
            <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Customer</span>
            </button>
          </div>
          
          <div className="divide-y divide-gray-50">
            {customers.map((customer, index) => {
              const customerLogs = logs.filter((l: any) => l.customerId === customer.id);
              const isDelivered = customerLogs.some((l: any) => l.status === 'DELIVERED');
              const isSkipped = customerLogs.some((l: any) => l.status === 'SKIPPED');
              const extraLog = customerLogs.find((l: any) => l.status === 'EXTRA');
              const isExtra = !!extraLog;
              
              return (
              <div key={customer.id} className={`p-4 sm:p-6 hover:bg-gray-50 transition flex flex-col sm:flex-row gap-4 sm:items-center justify-between ${isSkipped ? 'opacity-50' : ''}`}>
                <div className="flex gap-4 items-start sm:items-center">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDelivered || isExtra ? 'bg-green-100 text-green-700' : isSkipped ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{customer.name} {isDelivered && '✓'} {isSkipped && '✕'}</h3>
                      {isExtra && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide">
                          + Extra Delivery
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{customer.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {isExtra ? extraLog.quantity : customer.defaultQuantity} L
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {customer.phone}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:ml-auto">
                  <form action={logDeliveryStatus} className="flex-1 sm:flex-none">
                    <input type="hidden" name="customerId" value={customer.id} />
                    <input type="hidden" name="status" value="SKIPPED" />
                    <input type="hidden" name="quantity" value="0" />
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition active:scale-95">
                      <XCircle className="w-4 h-4 text-gray-400 group-hover:text-red-500" /> Skip
                    </button>
                  </form>
                  <form action={logDeliveryStatus} className="flex-1 sm:flex-none">
                    <input type="hidden" name="customerId" value={customer.id} />
                    <input type="hidden" name="status" value="DELIVERED" />
                    <input type="hidden" name="quantity" value={customer.defaultQuantity} />
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition active:scale-95">
                      <CheckCircle className="w-4 h-4" /> Delivered
                    </button>
                  </form>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
