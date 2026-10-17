import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? 'Administrateur';

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding an administrator.');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: Role.ADMIN, passwordHash: hashedPassword },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const categories = [
    'Électronique',
    'Documents',
    'Clés',
    'Sacs',
    'Vêtements',
    'Bijoux',
    'Portefeuilles',
    'Animaux',
    'Téléphones et tablettes',
    'Ordinateurs',
    'Audio et accessoires',
    'Cartes bancaires',
    'Chaussures',
    'Montres',
    'Lunettes',
    'Jouets',
    'Articles de sport',
    'Outils',
    'Véhicules et accessoires',
    'Autre',
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category },
      update: {},
      create: {
        name: category,
        slug: category.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  console.log(`Seed completed: administrator ${adminEmail} and ${categories.length} categories are ready.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
