import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemStatus, ItemType } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';

describe('PostgreSQL integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  function assertDedicatedTestDatabase(): void {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl)
      throw new Error('DATABASE_URL is required for integration tests.');

    const databaseName = decodeURIComponent(
      new URL(databaseUrl).pathname.replace(/^\//, ''),
    );
    if (!/(^|[-_])test$/i.test(databaseName)) {
      throw new Error(
        `Refusing to clean database "${databaseName}". Integration tests require a database name ending in _test, -test, or test.`,
      );
    }
  }

  async function cleanDatabase(): Promise<void> {
    await prisma.notification.deleteMany();
    await prisma.recovery.deleteMany();
    await prisma.claim.deleteMany();
    await prisma.item.deleteMany();
    await prisma.location.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }

  async function register(
    name: string,
    email: string,
  ): Promise<{ token: string; userId: number }> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name, email, password: 'Integration123!' })
      .expect(201);

    return {
      token: response.body.accessToken as string,
      userId: response.body.user.id as number,
    };
  }

  beforeAll(async () => {
    assertDedicatedTestDatabase();
    process.env.JWT_SECRET ??= 'integration-test-secret-at-least-32-characters';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    await cleanDatabase();
  });

  afterAll(async () => {
    if (prisma) await cleanDatabase();
    if (app) await app.close();
  });

  it('persists the complete publish and claim flow in PostgreSQL', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ status: 'ok', database: 'up' });
      });

    const owner = await register(
      'Déposant test',
      'owner.integration@example.com',
    );
    const claimant = await register(
      'Propriétaire test',
      'claimant.integration@example.com',
    );

    const itemResponse = await request(app.getHttpServer())
      .post('/api/items')
      .set('Authorization', `Bearer ${owner.token}`)
      .field('title', 'Sac à dos de test')
      .field('description', 'Sac trouvé devant la bibliothèque')
      .field('type', ItemType.FOUND)
      .field('category', 'Sacs')
      .field('itemDate', '2026-10-17')
      .field('governorate', 'Tunis')
      .field('delegation', 'El Menzah')
      .field('locality', 'Campus')
      .field('addressText', 'Entrée de la bibliothèque')
      .field('verificationDetails', 'La doublure est violette')
      .field('verificationQuestion', 'Quelle couleur a la doublure ?')
      .expect(201);

    const itemId = itemResponse.body.id as number;
    expect(itemResponse.body).toMatchObject({
      id: itemId,
      status: ItemStatus.ACTIVE,
      verificationQuestion: 'Quelle couleur a la doublure ?',
    });
    expect(itemResponse.body).not.toHaveProperty('verificationDetails');

    const publicItem = await request(app.getHttpServer())
      .get(`/api/items/${itemId}`)
      .expect(200);
    expect(publicItem.body.verificationQuestion).toBe(
      'Quelle couleur a la doublure ?',
    );
    expect(publicItem.body).not.toHaveProperty('verificationDetails');

    await request(app.getHttpServer())
      .post(`/api/items/${itemId}/claims`)
      .set('Authorization', `Bearer ${claimant.token}`)
      .field('proofText', 'Le sac contient un carnet bleu et deux stylos.')
      .field('answer', 'Violette')
      .expect(201);

    const received = await request(app.getHttpServer())
      .get('/api/claims/received')
      .set('Authorization', `Bearer ${owner.token}`)
      .expect(200);
    expect(received.body).toHaveLength(1);
    expect(received.body[0]).toMatchObject({
      answer: 'Violette',
      claimant: {
        id: claimant.userId,
        email: 'claimant.integration@example.com',
      },
    });

    await expect(prisma.user.count()).resolves.toBe(2);
    await expect(prisma.item.count()).resolves.toBe(1);
    await expect(prisma.claim.count()).resolves.toBe(1);
    await expect(prisma.notification.count()).resolves.toBe(1);
  });
});
