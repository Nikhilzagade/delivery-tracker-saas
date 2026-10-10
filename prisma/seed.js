const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.monthlyBill.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();

  console.log('Seeding vendor data...');
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Nikhil Zagade',
      phone: '9999999999',
      serviceType: 'MILK',
      upiId: 'nikhil@upi',
    }
  });

  console.log('Seeding customers...');
  const c1 = await prisma.customer.create({
    data: {
      vendorId: vendor.id,
      name: 'Ramesh Sharma',
      phone: '9876543210',
      address: 'B-201, Green View Apts',
      routeOrder: 1,
      defaultQuantity: 1.0,
      ratePerUnit: 60,
    }
  });

  const c2 = await prisma.customer.create({
    data: {
      vendorId: vendor.id,
      name: 'Priya Patel',
      phone: '9876543211',
      address: 'A-105, Sunflower Society',
      routeOrder: 2,
      defaultQuantity: 2.0,
      ratePerUnit: 60,
    }
  });

  const c3 = await prisma.customer.create({
    data: {
      vendorId: vendor.id,
      name: 'Amit Kumar',
      phone: '9876543212',
      address: 'C-302, Blue Ridge',
      routeOrder: 3,
      defaultQuantity: 1.5,
      ratePerUnit: 65,
    }
  });

  console.log('Seeding initial daily logs for today...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.dailyLog.create({
    data: { customerId: c1.id, date: today, status: 'DELIVERED', quantity: c1.defaultQuantity }
  });
  await prisma.dailyLog.create({
    data: { customerId: c2.id, date: today, status: 'DELIVERED', quantity: c2.defaultQuantity }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
