import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Role } from '@prisma/client';
import { CreateCategoryDto } from '../../categories/dto/create-category.dto.js';
import { CreateLocationDto } from '../../locations/dto/create-location.dto.js';
import { UpdateLocationDto } from '../../locations/dto/update-location.dto.js';
import { UpdateUserRoleDto } from './update-user-role.dto.js';

const validationOptions = { whitelist: true, forbidNonWhitelisted: true };

describe('Admin DTOs', () => {
  it('accepts valid category names and role updates', async () => {
    const category = plainToInstance(CreateCategoryDto, { name: 'Documents' });
    const role = plainToInstance(UpdateUserRoleDto, { role: Role.ADMIN });

    await expect(validate(category, validationOptions)).resolves.toEqual([]);
    await expect(validate(role, validationOptions)).resolves.toEqual([]);
  });

  it('rejects unsupported roles', async () => {
    const role = plainToInstance(UpdateUserRoleDto, { role: 'OWNER' });

    const errors = await validate(role, validationOptions);

    expect(errors.map((error) => error.property)).toContain('role');
  });

  it('transforms and validates Tunisian location coordinates', async () => {
    const location = plainToInstance(CreateLocationDto, {
      governorate: 'Tunis',
      delegation: 'La Marsa',
      latitude: '36.8782',
      longitude: '10.3247',
    });

    await expect(validate(location, validationOptions)).resolves.toEqual([]);
    expect(location.latitude).toBe(36.8782);
    expect(location.longitude).toBe(10.3247);
  });

  it('rejects out-of-range coordinates', async () => {
    const location = plainToInstance(CreateLocationDto, {
      governorate: 'Tunis',
      delegation: 'La Marsa',
      latitude: '120',
      longitude: '10',
    });

    const errors = await validate(location, validationOptions);

    expect(errors.map((error) => error.property)).toContain('latitude');
  });

  it('accepts partial location updates and transforms coordinate fields', async () => {
    const location = plainToInstance(UpdateLocationDto, { latitude: '36.8' });

    await expect(validate(location, validationOptions)).resolves.toEqual([]);
    expect(location.latitude).toBe(36.8);
  });
});
