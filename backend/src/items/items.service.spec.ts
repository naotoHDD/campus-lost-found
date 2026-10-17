import { ForbiddenException } from '@nestjs/common';
import { ItemStatus } from '@prisma/client';
import { jest } from '@jest/globals';
import { CategoriesService } from '../categories/categories.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { ItemsService } from './items.service.js';

describe('ItemsService', () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const findUnique = jest.fn();
  const count = jest.fn().mockResolvedValue(0);
  const update = jest.fn();
  const remove = jest.fn();
  const service = new ItemsService(
    { item: { findMany, findUnique, count, update, delete: remove } } as unknown as PrismaService,
    {} as CategoriesService,
    {} as LocationsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([]);
    findUnique.mockReset();
    count.mockResolvedValue(0);
  });

  it('applies governorate and delegation filters together', async () => {
    await service.list({ governorate: 'Tunis', delegation: 'La Marsa' });

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        location: {
          is: {
            governorate: { contains: 'Tunis', mode: 'insensitive' },
            delegation: { contains: 'La Marsa', mode: 'insensitive' },
          },
        },
      }),
    }));
  });

  it('does not expose the item author email in public item details', async () => {
    findUnique.mockResolvedValue({
      id: 4,
      title: 'Keys',
      description: 'Blue keychain',
      type: 'FOUND',
      status: 'ACTIVE',
      imageUrl: null,
      itemDate: new Date('2026-10-05T12:00:00.000Z'),
      createdAt: new Date('2026-10-05T12:00:00.000Z'),
      category: { id: 1, name: 'Keys' },
      location: {
        governorate: 'Tunis',
        delegation: 'Tunis',
        locality: 'El Menzah',
        addressText: 'Exact gate location',
        latitude: 36.8065,
        longitude: 10.1815,
      },
      author: { id: 2, name: 'Amina', email: 'amina@example.com' },
    });

    const result = await service.findOne(4);

    expect(result.author).toEqual({ id: 2, name: 'Amina' });
    expect(result.locality).toBeUndefined();
    expect(result.addressText).toBeUndefined();
    expect(result.latitude).toBe(36.81);
    expect(result.longitude).toBe(10.18);
  });

  it('forbids non-owners from updating or deleting an item', async () => {
    findUnique.mockResolvedValue({ id: 4, authorId: 1 });

    await expect(service.update(4, 2, {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove(4, 2, false)).rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('only lets owners close an active item through status updates', async () => {
    findUnique.mockResolvedValue({ id: 4, authorId: 2, status: ItemStatus.ACTIVE });

    await expect(service.update(4, 2, { status: ItemStatus.CLAIMED }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });
});
