import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 1. Webhook Verification (Required by Meta)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // We will set this token in Meta Dashboard later. Let's hardcode it for the MVP test.
  const VERIFY_TOKEN = 'delivery_tracker_123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// 2. Handling Incoming Messages
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Check if it's a WhatsApp status update or a message
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages && change.value.messages[0]) {
            const msg = change.value.messages[0];
            
            // Meta formats phone numbers with country code (e.g. "919876543210")
            // We strip the country code if it's India "91" for our MVP database matching
            let phone = msg.from;
            if (phone.startsWith('91') && phone.length === 12) {
              phone = phone.substring(2);
            }

            const message = msg.text?.body || '';
            console.log(`Received message from ${phone}: ${message}`);

            // Find the customer by phone
            let customer = await prisma.customer.findUnique({
              where: { phone },
            });

            if (!customer) {
              console.log('Unknown number detected. Auto-assigning to Amit Kumar for testing...');
              // Find Amit Kumar
              const amit = await prisma.customer.findFirst({ where: { name: 'Amit Kumar' } });
              if (amit) {
                customer = await prisma.customer.update({
                  where: { id: amit.id },
                  data: { phone }
                });
                console.log(`Successfully linked your phone number to Amit Kumar!`);
              } else {
                continue; // Skip if Amit is somehow missing
              }
            }

            const lowerMessage = message.toLowerCase();
            
            // Basic NLP mock for intents
            if (lowerMessage.includes('skip')) {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(0, 0, 0, 0);

              await prisma.dailyLog.create({
                data: {
                  customerId: customer.id,
                  date: tomorrow,
                  status: 'SKIPPED',
                  quantity: 0,
                  notes: 'Requested via WhatsApp',
                }
              });
              console.log(`Skipped delivery for ${customer.name}`);
            }

            if (lowerMessage.includes('extra')) {
              const match = lowerMessage.match(/extra\s*(\d+)/);
              const extraAmount = match ? parseFloat(match[1]) : 1;
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              await prisma.dailyLog.create({
                data: {
                  customerId: customer.id,
                  date: today,
                  status: 'EXTRA',
                  quantity: customer.defaultQuantity + extraAmount,
                  notes: `Extra ${extraAmount} requested via WhatsApp`,
                }
              });
              console.log(`Added extra delivery for ${customer.name}`);
            }
          }
        }
      }
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    
    return NextResponse.json({ status: 'not a whatsapp event' }, { status: 404 });
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
