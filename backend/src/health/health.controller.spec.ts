import { ServiceUnavailableException } from '@nestjs/common';
import { jest } from '@jest/globals';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const query = jest.fn();
  const controller = new HealthController({
    $queryRawUnsafe: query,
  } as unknown as PrismaService);

  beforeEach(() => jest.clearAllMocks());

  it('reports readiness only after PostgreSQL answers', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      database: 'up',
      timestamp: expect.any(String),
    });
  });

  it('returns a service-unavailable error when PostgreSQL is down', async () => {
    query.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
