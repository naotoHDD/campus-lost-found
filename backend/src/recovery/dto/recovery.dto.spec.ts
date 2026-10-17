import { validate } from 'class-validator';
import { RecoveryCodeDto, RecoveryConfirmationDto, RecoveryMeetingDto } from './recovery.dto.js';

describe('Recovery DTOs', () => {
  it('accepts the documented meeting fields', async () => {
    const dto = Object.assign(new RecoveryMeetingDto(), {
      location: 'Bibliothèque',
      date: '2026-10-05',
      time: '15:00',
    });

    await expect(validate(dto, { whitelist: true, forbidNonWhitelisted: true })).resolves.toEqual([]);
  });

  it('requires a six-digit recovery code', async () => {
    const dto = Object.assign(new RecoveryCodeDto(), { code: '12ab' });

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    expect(errors.map((error) => error.property)).toContain('code');
  });

  it('only accepts supported participant confirmation roles', async () => {
    const dto = Object.assign(new RecoveryConfirmationDto(), { confirmation: 'ADMIN' });

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    expect(errors.map((error) => error.property)).toContain('confirmation');
  });
});
