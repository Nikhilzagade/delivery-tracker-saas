import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old data...');
  await prisma.dailyLog.deleteMany();
  await prisma.monthlyBill.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();

  console.log('Creating Vendor...');
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Ramu Kaka Dairy',
      phone: '9876543219',
      serviceType: 'MILK',
      upiId: 'ramu@upi',
    },
  });

  console.log('Creating Customers...');
  await prisma.customer.createMany({
    data: [
      {
        vendorId: vendor.id,
        name: 'Ramesh Sharma',
        phone: '9876543210',
        address: 'B-201, Green View Apts',
        routeOrder: 1,
        defaultQuantity: 1,
        ratePerUnit: 60,
      },
      {
        vendorId: vendor.id,
        name: 'Priya Patel',
        phone: '9876543211',
        address: 'A-105, Sunflower Society',
        routeOrder: 2,
        defaultQuantity: 2,
        ratePerUnit: 60,
      },
      {
        vendorId: vendor.id,
        name: 'Amit Kumar',
        phone: '9876543212',
        address: 'C-302, Blue Ridge',
        routeOrder: 3,
        defaultQuantity: 1.5,
        ratePerUnit: 60,
      },
    ],
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
