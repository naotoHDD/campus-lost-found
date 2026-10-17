import { validate } from 'class-validator';
import { CreateClaimDto } from './create-claim.dto.js';

describe('CreateClaimDto', () => {
  it('accepts the fields sent by the Angular claim form', async () => {
    const dto = Object.assign(new CreateClaimDto(), {
      proofText: 'A detail only the owner would know',
      answer: 'Blue interior lining',
    });

    await expect(validate(dto, { whitelist: true, forbidNonWhitelisted: true })).resolves.toEqual([]);
  });

  it('requires proofText', async () => {
    const dto = Object.assign(new CreateClaimDto(), { answer: 'Blue interior lining' });

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    expect(errors.map((error) => error.property)).toContain('proofText');
  });
});