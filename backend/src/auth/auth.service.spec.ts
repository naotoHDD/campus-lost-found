import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { jest } from '@jest/globals';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwtService = { sign: jest.fn(() => 'signed-token') };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user with a hashed password and returns the frontend auth shape', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 12,
      ...data,
    }));

    const result = await service.register({
      name: 'Amina Ben Ali',
      email: 'amina@example.com',
      password: 'secret123',
    });

    const createCall = prisma.user.create.mock.calls[0]?.[0];
    expect(createCall.data.passwordHash).not.toBe('secret123');
    await expect(bcrypt.compare('secret123', createCall.data.passwordHash)).resolves.toBe(true);
    expect(createCall.data.role).toBe(Role.USER);
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 12,
        name: 'Amina Ben Ali',
        email: 'amina@example.com',
        role: Role.USER,
      },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate registration emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 12 });

    await expect(service.register({
      name: 'Amina Ben Ali',
      email: 'amina@example.com',
      password: 'secret123',
    })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects login when the email is not registered', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login({
      email: 'missing@example.com',
      password: 'secret123',
    })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an incorrect password and returns the auth shape for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);
    const user = {
      id: 12,
      name: 'Amina Ben Ali',
      email: 'amina@example.com',
      role: Role.USER,
      passwordHash,
    };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.login({
      email: user.email,
      password: 'wrong-password',
    })).rejects.toBeInstanceOf(UnauthorizedException);

    const result = await service.login({ email: user.email, password: 'secret123' });
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: Role.USER,
      },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
