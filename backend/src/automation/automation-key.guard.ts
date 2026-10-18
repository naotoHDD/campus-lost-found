import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class AutomationKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('AUTOMATION_API_KEY');
    const provided = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>()
      .headers['x-automation-key'];

    if (!expected || typeof provided !== 'string') {
      throw new UnauthorizedException('A valid automation API key is required.');
    }

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);

    if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
      throw new UnauthorizedException('A valid automation API key is required.');
    }

    return true;
  }
}
