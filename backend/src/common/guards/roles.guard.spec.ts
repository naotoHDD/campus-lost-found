import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { jest } from '@jest/globals';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  const getAllAndOverride = jest.fn();
  const guard = new RolesGuard({ getAllAndOverride } as unknown as Reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createContext(role?: Role): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows a route without required roles', () => {
    getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows a user with a required role', () => {
    getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(createContext(Role.ADMIN))).toBe(true);
  });

  it('denies a user without a required role', () => {
    getAllAndOverride.mockReturnValue([Role.ADMIN]);

    expect(guard.canActivate(createContext(Role.USER))).toBe(false);
  });
});
