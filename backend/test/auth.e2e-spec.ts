import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import { ClaimStatus, ItemStatus, ItemType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { jest } from '@jest/globals';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';

describe('API HTTP contract', () => {
  let app: INestApplication;
  let openApiDocument: ReturnType<typeof SwaggerModule.createDocument>;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    claim: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    recovery: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    $transaction: jest.fn(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback(prisma),
    ),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET ??=
      'test-only-secret-that-is-never-used-outside-jest';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    openApiDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Lost & Found Tunisia API')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, openApiDocument);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$queryRawUnsafe.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('reports API and PostgreSQL readiness', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      database: 'up',
      timestamp: expect.any(String),
    });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
  });

  async function registerToken(id = 12) {
    const user = {
      id,
      name: 'Amina Ben Ali',
      email: `amina${id}@example.com`,
      role: Role.USER,
      passwordHash: 'not-used-by-register-response',
    };
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: user.name, email: user.email, password: 'secret123' });

    expect(response.status).toBe(201);
    prisma.user.findUnique.mockResolvedValue({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    return response.body.accessToken as string;
  }

  it('rejects registration without required fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(400);
  });

  it('registers with the frontend response shape and stores only a password hash', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async (args: any) => ({
      id: 1,
      ...args.data,
    }));

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Amina Ben Ali',
        email: 'amina@example.com',
        password: 'secret123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      user: {
        id: 1,
        name: 'Amina Ben Ali',
        email: 'amina@example.com',
        role: Role.USER,
      },
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
    const storedUser = prisma.user.create.mock.calls[0]?.[0].data;
    expect(storedUser.passwordHash).not.toBe('secret123');
    await expect(
      bcrypt.compare('secret123', storedUser.passwordHash),
    ).resolves.toBe(true);
  });

  it('rejects duplicate registrations', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });

    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Amina Ben Ali',
        email: 'amina@example.com',
        password: 'secret123',
      });

    expect(response.status).toBe(409);
  });

  it('rejects login with invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'wrongpass' });

    expect(response.status).toBe(401);
  });

  it('logs in with valid credentials', async () => {
    const user = {
      id: 1,
      name: 'Amina Ben Ali',
      email: 'amina@example.com',
      role: Role.USER,
      passwordHash: await bcrypt.hash('secret123', 10),
    };
    prisma.user.findUnique.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'secret123' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      accessToken: expect.any(String),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: Role.USER,
      },
    });
  });

  it("protects /auth/me and returns the current user's public profile", async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    const token = await registerToken(21);
    prisma.user.findUnique.mockResolvedValue({
      id: 21,
      name: 'Amina Ben Ali',
      email: 'amina21@example.com',
      role: Role.USER,
    });

    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({
      id: 21,
      name: 'Amina Ben Ali',
      email: 'amina21@example.com',
      role: Role.USER,
    });
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('uses the current database role for an existing token', async () => {
    const token = await registerToken(22);
    prisma.user.findUnique.mockResolvedValue({ id: 22, role: Role.USER });

    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    prisma.user.findUnique.mockResolvedValue({ id: 22, role: Role.ADMIN });
    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    prisma.user.findUnique.mockResolvedValue({ id: 22, role: Role.USER });
    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('serves paginated item search results through the HTTP route', async () => {
    prisma.item.findMany.mockResolvedValue([]);
    prisma.item.count.mockResolvedValue(0);

    const response = await request(app.getHttpServer())
      .get(
        '/api/items?type=FOUND&status=ACTIVE&governorate=Tunis&delegation=La%20Marsa&page=2&limit=3',
      )
      .expect(200);

    expect(response.body).toEqual({
      data: [],
      meta: { page: 2, limit: 3, total: 0, totalPages: 1 },
    });
    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 3,
        take: 3,
        where: {
          type: ItemType.FOUND,
          status: ItemStatus.ACTIVE,
          location: {
            is: {
              governorate: { contains: 'Tunis', mode: 'insensitive' },
              delegation: { contains: 'La Marsa', mode: 'insensitive' },
            },
          },
        },
      }),
    );
  });

  it('rejects invalid item filters and out-of-range pagination', async () => {
    await request(app.getHttpServer())
      .get('/api/items?type=UNKNOWN')
      .expect(400);
    await request(app.getHttpServer()).get('/api/items?limit=101').expect(400);
  });

  it('creates an item through the protected multipart-compatible endpoint', async () => {
    const token = await registerToken(31);
    prisma.category.findUnique.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({
      id: 1,
      name: 'Keys',
      slug: 'keys',
    });
    prisma.location.upsert.mockResolvedValue({
      id: 1,
      governorate: 'Tunis',
      delegation: 'La Marsa',
      locality: 'Gammarth',
      addressText: 'Campus gate',
      latitude: 36.9,
      longitude: 10.3,
    });
    prisma.item.create.mockResolvedValue({
      id: 5,
      title: 'Lost keys',
      description: 'Blue keychain',
      type: ItemType.LOST,
      status: ItemStatus.ACTIVE,
      imageUrl: null,
      itemDate: new Date('2026-10-05T12:00:00.000Z'),
      createdAt: new Date('2026-10-05T12:00:00.000Z'),
      category: { id: 1, name: 'Keys' },
      location: {
        governorate: 'Tunis',
        delegation: 'La Marsa',
        locality: 'Gammarth',
        addressText: 'Campus gate',
        latitude: 36.9,
        longitude: 10.3,
      },
      author: { id: 31, name: 'Amina Ben Ali' },
    });

    const response = await request(app.getHttpServer())
      .post('/api/items')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Lost keys')
      .field('description', 'Blue keychain')
      .field('type', ItemType.LOST)
      .field('category', 'Keys')
      .field('itemDate', '2026-10-05')
      .field('governorate', 'Tunis')
      .field('delegation', 'La Marsa')
      .field('locality', 'Gammarth')
      .field('addressText', 'Campus gate')
      .field('latitude', '36.9')
      .field('longitude', '10.3')
      .field('verificationDetails', 'A blue rubber tag')
      .field('verificationQuestion', 'What is attached?')
      .expect(201);

    expect(response.body).toMatchObject({
      id: 5,
      title: 'Lost keys',
      category: { id: 1, name: 'Keys' },
      governorate: 'Tunis',
      addressText: 'Campus gate',
      author: { id: 31, name: 'Amina Ben Ali' },
    });
    expect(response.body.author).not.toHaveProperty('email');
  });

  it('creates a claim through the protected route for an active item', async () => {
    const token = await registerToken(41);
    prisma.item.findUnique.mockResolvedValue({
      id: 5,
      authorId: 10,
      status: ItemStatus.ACTIVE,
    });
    prisma.claim.findFirst.mockResolvedValue(null);
    prisma.claim.create.mockResolvedValue({
      id: 7,
      itemId: 5,
      claimantId: 41,
      proofText: 'The key tag is blue',
      answer: 'Blue',
      attachmentUrl: null,
      status: ClaimStatus.PENDING,
      createdAt: new Date('2026-10-05T12:00:00.000Z'),
      item: { id: 5, title: 'Lost keys' },
    });

    const response = await request(app.getHttpServer())
      .post('/api/items/5/claims')
      .set('Authorization', `Bearer ${token}`)
      .field('proofText', 'The key tag is blue')
      .field('answer', 'Blue')
      .expect(201);

    expect(response.body).toMatchObject({
      id: 7,
      item: { id: 5, title: 'Lost keys' },
      status: ClaimStatus.PENDING,
      proofText: 'The key tag is blue',
    });
  });

  it('lists claims received by an item owner without exposing them publicly', async () => {
    await request(app.getHttpServer()).get('/api/claims/received').expect(401);
    const token = await registerToken(10);
    prisma.claim.findMany.mockResolvedValue([
      {
        id: 7,
        status: ClaimStatus.PENDING,
        proofText: 'The phone has a scratch near the camera.',
        answer: 'Transparent',
        attachmentUrl: null,
        createdAt: new Date('2026-10-17T20:00:00.000Z'),
        item: {
          id: 5,
          title: 'Black phone',
          type: ItemType.FOUND,
          status: ItemStatus.ACTIVE,
          verificationQuestion: 'What color is the case?',
        },
        claimant: { id: 41, name: 'Amina', email: 'amina@example.com' },
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/claims/received')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body[0]).toMatchObject({
      id: 7,
      answer: 'Transparent',
      claimant: { id: 41, name: 'Amina', email: 'amina@example.com' },
    });
    expect(prisma.claim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { item: { authorId: 10 } },
      }),
    );
  });

  it('returns a recovery view tailored to the authenticated participant', async () => {
    const ownerToken = await registerToken(20);
    prisma.claim.findUnique.mockResolvedValue({
      id: 8,
      itemId: 5,
      claimantId: 20,
      status: ClaimStatus.ACCEPTED,
      item: {
        id: 5,
        title: 'Black phone',
        type: ItemType.FOUND,
        status: ItemStatus.CLAIMED,
        authorId: 10,
      },
    });
    prisma.recovery.findUnique.mockResolvedValue({
      status: 'SCHEDULED',
      meetingLocation: 'Bibliothèque',
      meetingDate: new Date('2026-10-20T14:00:00.000Z'),
      verificationCode: '123456',
      verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      verificationAttempts: 0,
      finderConfirmed: false,
      claimantConfirmed: false,
    });

    const ownerResponse = await request(app.getHttpServer())
      .get('/api/recovery/8')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(ownerResponse.body).toMatchObject({
      participantRole: 'CLAIMANT',
      verificationCode: '123456',
      hasVerificationCode: true,
    });

    const finderToken = await registerToken(10);
    prisma.claim.findUnique.mockResolvedValue({
      id: 8,
      itemId: 5,
      claimantId: 20,
      status: ClaimStatus.ACCEPTED,
      item: {
        id: 5,
        title: 'Black phone',
        type: ItemType.FOUND,
        status: ItemStatus.CLAIMED,
        authorId: 10,
      },
    });

    const finderResponse = await request(app.getHttpServer())
      .get('/api/recovery/8')
      .set('Authorization', `Bearer ${finderToken}`)
      .expect(200);

    expect(finderResponse.body.participantRole).toBe('FINDER');
    expect(finderResponse.body).not.toHaveProperty('verificationCode');
  });

  it('denies normal users and allows admins on admin routes', async () => {
    await request(app.getHttpServer()).get('/api/admin/stats').expect(401);
    const userToken = await registerToken(51);
    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    prisma.user.count.mockResolvedValue(0);
    prisma.item.count.mockResolvedValue(0);
    prisma.claim.count.mockResolvedValue(0);
    prisma.location.findMany.mockResolvedValue([]);
    const adminToken = app.get(JwtService).sign({
      sub: 99,
      email: 'admin@example.com',
      role: Role.ADMIN,
    });
    prisma.user.findUnique.mockResolvedValue({ id: 99, role: Role.ADMIN });

    await request(app.getHttpServer())
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    prisma.user.findUnique.mockResolvedValue({ id: 51, role: Role.USER });
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Documents' })
      .expect(403);

    prisma.category.create.mockResolvedValue({
      id: 2,
      name: 'Documents',
      slug: 'documents',
    });
    prisma.user.findUnique.mockResolvedValue({ id: 99, role: Role.ADMIN });
    await request(app.getHttpServer())
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Documents' })
      .expect(201);

    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 99, role: Role.ADMIN })
      .mockResolvedValueOnce({ id: 77 });
    prisma.user.update.mockResolvedValue({
      id: 77,
      name: 'User 77',
      email: 'user77@example.com',
      role: Role.ADMIN,
    });
    const roleResponse = await request(app.getHttpServer())
      .patch('/api/admin/users/77/role')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: Role.ADMIN })
      .expect(200);
    expect(roleResponse.body.role).toBe(Role.ADMIN);
  });

  it('documents bearer auth, filters, and multipart uploads in OpenAPI', () => {
    const paths = openApiDocument.paths;
    const itemList = Object.entries(paths).find(([path]) =>
      path.endsWith('/items'),
    )?.[1];
    const adminStats = Object.entries(paths).find(([path]) =>
      path.endsWith('/admin/stats'),
    )?.[1];
    const itemCreateSchema =
      itemList?.post?.requestBody?.content?.['multipart/form-data']?.schema;

    expect(itemList?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'governorate', in: 'query' }),
        expect.objectContaining({ name: 'delegation', in: 'query' }),
        expect.objectContaining({ name: 'status', in: 'query' }),
      ]),
    );
    expect(itemCreateSchema?.properties?.image).toMatchObject({
      type: 'string',
      format: 'binary',
    });
    expect(adminStats?.get?.security).toContainEqual({ bearer: [] });
    expect(
      openApiDocument.components?.schemas?.RegisterDto?.properties?.password
        ?.writeOnly,
    ).toBe(true);
  });
});
