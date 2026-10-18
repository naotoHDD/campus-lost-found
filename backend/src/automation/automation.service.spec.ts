import { ItemType } from '@prisma/client';
import { jest } from '@jest/globals';
import type { PrismaService } from '../common/prisma/prisma.service.js';
import { AutomationService, calculateMatchScore } from './automation.service.js';

describe('calculateMatchScore', () => {
  const base = {
    id: 1,
    title: 'AirPods Pro blancs',
    description: 'Écouteurs Apple avec boîtier blanc',
    type: ItemType.LOST,
    itemDate: new Date('2026-10-15T12:00:00.000Z'),
    authorId: 1,
    categoryId: 3,
    location: { governorate: 'Tunis', delegation: 'El Menzah' },
  };

  it('gives a high score to a close item in the same category and location', () => {
    const score = calculateMatchScore(base, {
      ...base,
      id: 2,
      authorId: 2,
      type: ItemType.FOUND,
      title: 'Écouteurs AirPods Pro',
      itemDate: new Date('2026-10-16T10:00:00.000Z'),
    });

    expect(score).toBeGreaterThanOrEqual(85);
  });

  it('keeps an unrelated item in a distant location below the threshold', () => {
    const score = calculateMatchScore(base, {
      ...base,
      id: 3,
      authorId: 3,
      type: ItemType.FOUND,
      title: 'Casque audio noir',
      description: 'Casque trouvé dans un parking',
      location: { governorate: 'Sfax', delegation: 'Sfax Ville' },
      itemDate: new Date('2026-10-25T10:00:00.000Z'),
    });

    expect(score).toBeLessThan(60);
  });
});

describe('AutomationService', () => {
  const lostItem = {
    id: 10,
    title: 'AirPods Pro blancs',
    description: 'Écouteurs Apple avec boîtier blanc',
    type: ItemType.LOST,
    itemDate: new Date('2026-10-15T12:00:00.000Z'),
    authorId: 1,
    categoryId: 3,
    location: { governorate: 'Tunis', delegation: 'El Menzah' },
  };
  const foundItem = {
    ...lostItem,
    id: 11,
    authorId: 2,
    type: ItemType.FOUND,
    title: 'Écouteurs AirPods Pro',
  };
  const itemFindMany = jest.fn();
  const itemUpdate = jest.fn();
  const notificationUpsert = jest.fn(async (operation: unknown) => operation);
  const transaction = jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations));
  const service = new AutomationService({
    item: { findMany: itemFindMany, update: itemUpdate },
    notification: { upsert: notificationUpsert },
    $transaction: transaction,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates one deduplicated notification for each owner and marks the item as processed', async () => {
    itemFindMany
      .mockResolvedValueOnce([lostItem])
      .mockResolvedValueOnce([foundItem]);
    itemUpdate.mockResolvedValue({ ...lostItem, automationProcessedAt: new Date() });

    await expect(service.runItemMatching(20, 60)).resolves.toMatchObject({
      processedItems: 1,
      matchCount: 1,
      matches: [{ itemId: 10, candidateItemId: 11 }],
    });

    expect(notificationUpsert).toHaveBeenCalledTimes(2);
    expect(notificationUpsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { dedupeKey: 'match:10:11:user:1' },
    }));
    expect(notificationUpsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { dedupeKey: 'match:10:11:user:2' },
    }));
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(itemUpdate).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { automationProcessedAt: expect.any(Date) },
    });
  });
});
