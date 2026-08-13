// Run via `npm run db:seed`, which passes --env-file=.env.
//
// This builds its own client rather than importing lib/db: Node's ESM loader
// needs an explicit `.ts` extension on relative imports, which TypeScript
// rejects unless the whole project opts into allowImportingTsExtensions.
import '../lib/trust-system-ca';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const MENU_ITEMS = [
  {
    name: 'Green Machine Smoothie',
    description:
      'Kale, spinach, green apple, banana and lime, pressed to order. No added sugar.',
    price: 16.9,
    category: 'SMOOTHIES & DRINKS',
    image:
      'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800&auto=format&fit=crop',
    badges: ['VEGAN', 'LOW SUGAR', 'SUPERFOOD']
  },
  {
    name: 'Cold Brew Oat Latte',
    description:
      '18-hour cold brew from Sumatran beans, cut with barista oat milk.',
    price: 13.5,
    category: 'SMOOTHIES & DRINKS',
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop',
    badges: ['CAFFEINE', 'VEGAN']
  },
  {
    name: 'Berry Antioxidant Blend',
    description:
      'Blueberry, acai, raspberry and chia, blended with coconut water.',
    price: 18.9,
    category: 'SMOOTHIES & DRINKS',
    image:
      'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop',
    badges: ['ANTIOXIDANTS', 'VEGAN', 'BESTSELLER']
  },
  {
    name: 'Teriyaki Salmon Bowl',
    description:
      'Grilled salmon over brown rice with edamame, cucumber ribbons and sesame.',
    price: 28.9,
    category: 'BOWLS',
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop',
    badges: ['HIGH PROTEIN', 'OMEGA-3', 'BESTSELLER']
  },
  {
    name: 'Mediterranean Quinoa Bowl',
    description:
      'Quinoa, roasted chickpeas, olives, sun-dried tomato and herbed tahini.',
    price: 24.9,
    category: 'BOWLS',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
    badges: ['VEGAN', 'HIGH PROTEIN', 'GLUTEN-FREE']
  },
  {
    name: 'Korean Chicken Rice Bowl',
    description:
      'Gochujang-glazed chicken thigh, pickled radish, kimchi and short-grain rice.',
    price: 26.9,
    category: 'BOWLS',
    image:
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&auto=format&fit=crop',
    badges: ['HIGH PROTEIN', 'SPICY']
  },
  {
    name: 'Grilled Chicken Caesar Wrap',
    description:
      'Chargrilled chicken, romaine and shaved parmesan in a wholemeal wrap.',
    price: 21.9,
    category: 'WRAPS',
    image:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop',
    badges: ['HIGH PROTEIN', 'BESTSELLER']
  },
  {
    name: 'Falafel & Hummus Wrap',
    description:
      'Baked falafel, hummus, pickled turnip and parsley salad in a spinach wrap.',
    price: 19.9,
    category: 'WRAPS',
    image:
      'https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=800&auto=format&fit=crop',
    badges: ['VEGAN', 'VEGETARIAN']
  },
  {
    name: 'Kale Caesar Salad',
    description:
      'Massaged kale, sourdough croutons, parmesan and a light anchovy dressing.',
    price: 22.9,
    category: 'SALADS',
    image:
      'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&auto=format&fit=crop',
    badges: ['LOW CARB', 'SUPERFOOD']
  },
  {
    name: 'Thai Beef Salad',
    description:
      'Seared sirloin, mint, coriander, cherry tomato and a chilli-lime dressing.',
    price: 27.9,
    category: 'SALADS',
    image:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop',
    badges: ['HIGH PROTEIN', 'SPICY', 'LOW CARB']
  },
  {
    name: 'Overnight Oats & Berries',
    description:
      'Rolled oats soaked in almond milk, layered with chia and mixed berries.',
    price: 14.9,
    category: 'BREAKFAST',
    image:
      'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&auto=format&fit=crop',
    badges: ['VEGAN', 'LOW SUGAR']
  },
  {
    name: 'Avocado Sourdough Toast',
    description:
      'Smashed avocado, chilli flakes and lemon on toasted sourdough.',
    price: 17.9,
    category: 'BREAKFAST',
    image:
      'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&auto=format&fit=crop',
    badges: ['VEGETARIAN', 'BESTSELLER']
  },
  {
    name: 'Protein Energy Balls (6pc)',
    description:
      'Dates, oats, almond butter and cacao nibs. Nothing else in them.',
    price: 12.9,
    category: 'SNACKS',
    image:
      'https://images.unsplash.com/photo-1490567674331-72de84996c8f?w=800&auto=format&fit=crop',
    badges: ['VEGAN', 'HIGH PROTEIN', 'LOW SUGAR']
  },
  {
    name: 'Office Grazing Platter (10 pax)',
    description:
      'Seasonal fruit, crudités, hummus, mixed nuts and energy balls on one board.',
    price: 189,
    category: 'CATERING',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
    badges: ['VEGETARIAN', 'SUPERFOOD']
  }
];

const COMPANIES = [
  {
    name: 'Tanjung Digital Sdn Bhd',
    billingEmail: 'finance@tanjungdigital.my',
    billingAddress: 'Level 22, Menara Binjai, Jalan Binjai, 50450 Kuala Lumpur',
    phone: '+60 3-2166 4400'
  },
  {
    name: 'Selasih Consulting',
    billingEmail: 'accounts@selasih.my',
    billingAddress: 'Unit 8-3, Bangsar South, 59200 Kuala Lumpur',
    phone: '+60 3-2242 1188'
  },
  {
    name: 'Harimau Fintech',
    billingEmail: 'ap@harimau.io',
    billingAddress: 'Tower B, Plaza 33, 47301 Petaling Jaya',
    phone: '+60 3-7890 2020'
  }
];

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@vfresh.my')
    .toLowerCase()
    .trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'SEED_ADMIN_PASSWORD is not set — refusing to seed an admin with a guessable password.'
    );
  }

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'VFresh Admin',
      password: await bcrypt.hash(password, 10),
      role: 'ADMIN'
    }
  });
  console.log(`admin: ${admin.email}`);

  for (const company of COMPANIES) {
    await prisma.company.upsert({
      where: { name: company.name },
      update: {},
      create: company
    });
  }
  console.log(`companies: ${COMPANIES.length}`);

  // Vendors first so menu items can attach to them.
  const vendorEmail = (
    process.env.SEED_VENDOR_EMAIL ?? 'vendor@vfresh.my'
  )
    .toLowerCase()
    .trim();
  const vendorPassword =
    process.env.SEED_VENDOR_PASSWORD ?? password;

  const vendor = await prisma.vendor.upsert({
    where: { email: vendorEmail },
    update: { status: 'APPROVED' },
    create: {
      email: vendorEmail,
      password: await bcrypt.hash(vendorPassword, 10),
      businessName: 'Demo Kitchen',
      slug: 'demo-kitchen',
      description: 'Healthy bowls and cold-pressed drinks for office lunch.',
      phone: '+60 12-345 6789',
      address: 'Bangsar South, Kuala Lumpur',
      premisesType: 'OTHER',
      status: 'APPROVED',
    },
  });
  console.log(`vendor: ${vendor.email} (APPROVED)`);

  const vendor2 = await prisma.vendor.upsert({
    where: { email: 'greens@vfresh.my' },
    update: { status: 'APPROVED' },
    create: {
      email: 'greens@vfresh.my',
      password: await bcrypt.hash(vendorPassword, 10),
      businessName: 'Green Bowl Co',
      slug: 'green-bowl-co',
      description: 'Grain bowls and salads, packed fresh every morning.',
      phone: '+60 12-987 6543',
      address: 'Damansara Heights, KL',
      premisesType: 'HOMEBASED',
      status: 'APPROVED',
    },
  });
  console.log(`vendor: ${vendor2.email} (APPROVED)`);

  const customerEmail = (
    process.env.SEED_CUSTOMER_EMAIL ?? 'customer@vfresh.my'
  )
    .toLowerCase()
    .trim();
  const customerPassword =
    process.env.SEED_CUSTOMER_PASSWORD ?? password;

  await prisma.customer.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      name: 'Demo Customer',
      password: await bcrypt.hash(customerPassword, 10),
    },
  });
  console.log(`customer: ${customerEmail}`);

  // Wipe orphan items without a vendor, then seed under vendors.
  await prisma.menuItem.deleteMany({});
  let created = 0;
  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const item = MENU_ITEMS[i];
    const ownerId = i % 3 === 0 ? vendor2.id : vendor.id;
    await prisma.menuItem.create({
      data: { ...item, available: true, vendorId: ownerId },
    });
    created++;
  }
  console.log(`menu items: ${created} created`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
