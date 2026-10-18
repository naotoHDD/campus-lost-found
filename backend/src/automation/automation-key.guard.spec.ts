import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { jest } from '@jest/globals';
import { AutomationKeyGuard } from './automation-key.guard.js';

function contextWithHeader(value?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: value ? { 'x-automation-key': value } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe('AutomationKeyGuard', () => {
  const config = {
    get: jest.fn().mockReturnValue('expected-secret'),
  } as unknown as ConfigService;
  const guard = new AutomationKeyGuard(config);

  it('accepts the configured automation key', () => {
    expect(guard.canActivate(contextWithHeader('expected-secret'))).toBe(true);
  });

  it('rejects a missing key', () => {
    expect(() => guard.canActivate(contextWithHeader())).toThrow(UnauthorizedException);
  });

  it('rejects an invalid key', () => {
    expect(() => guard.canActivate(contextWithHeader('wrong-secret'))).toThrow(UnauthorizedException);
  });
});
