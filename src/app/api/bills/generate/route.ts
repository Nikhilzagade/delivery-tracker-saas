import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // In a real scenario, this would be triggered by a cron job at the end of the month.
    const month = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

    // Get all active customers
    const customers = await prisma.customer.findMany({
      where: { active: true },
      include: {
        vendor: true,
        dailyLogs: {
          where: {
            date: {
              gte: new Date(`${month}-01`),
              lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
            }
          }
        }
      }
    });

    const generatedBills = [];

    for (const customer of customers) {
      let totalAmount = 0;
      
      // Calculate amount based on logs. Assuming ratePerUnit.
      // (Mock logic: count delivered + extra - skipped)
      // For MVP simplicity, let's say 30 days * defaultQuantity * ratePerUnit
      // Adjusting based on skips/extras.
      
      let totalUnits = customer.defaultQuantity * 30; // base for 30 days
      
      customer.dailyLogs.forEach(log => {
        if (log.status === 'SKIPPED') {
          totalUnits -= customer.defaultQuantity;
        } else if (log.status === 'EXTRA') {
          totalUnits += (log.quantity - customer.defaultQuantity);
        }
      });

      totalAmount = totalUnits * customer.ratePerUnit;

      // UPI deep link generation
      // Format: upi://pay?pa={vendor_upi}&pn={vendor_name}&am={amount}&cu=INR
      const upiLink = `upi://pay?pa=${customer.vendor.upiId}&pn=${encodeURIComponent(customer.vendor.name)}&am=${totalAmount}&cu=INR`;

      const bill = await prisma.monthlyBill.create({
        data: {
          customerId: customer.id,
          vendorId: customer.vendor.id,
          month,
          totalAmount,
          status: 'PENDING',
          paymentLink: upiLink
        }
      });

      generatedBills.push(bill);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${generatedBills.length} bills for ${month}.`,
      bills: generatedBills
    });

  } catch (error) {
    console.error('Bill Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
