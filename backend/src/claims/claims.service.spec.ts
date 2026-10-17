import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ClaimStatus, ItemStatus, Role } from '@prisma/client';
import { jest } from '@jest/globals';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { ClaimsService } from './claims.service.js';

describe('ClaimsService', () => {
  const findUnique = jest.fn();
  const findFirst = jest.fn();
  const create = jest.fn();
  const claimFindUnique = jest.fn();
  const notificationCreate = jest.fn();
  const claimUpdateMany = jest.fn();
  const itemUpdateMany = jest.fn();
  const transaction = jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback({
    claim: { updateMany: claimUpdateMany },
    item: { updateMany: itemUpdateMany },
  }));
  const service = new ClaimsService({
    item: { findUnique, updateMany: itemUpdateMany },
    claim: { findFirst, findUnique: claimFindUnique, create, updateMany: claimUpdateMany },
    notification: { create: notificationCreate },
    $transaction: transaction,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([ItemStatus.CLAIMED, ItemStatus.RETURNED, ItemStatus.CLOSED])(
    'rejects claims when an item is %s',
    async (status) => {
      findUnique.mockResolvedValue({ id: 4, authorId: 1, status });

      await expect(service.create(4, 2, { proofText: 'Ownership detail' }))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(findFirst).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    },
  );

  it('denies a non-participant access to a private claim attachment', async () => {
    claimFindUnique.mockResolvedValue({
      attachmentUrl: 'safe-name.pdf',
      claimantId: 20,
      item: { authorId: 10 },
    });

    await expect(service.getAttachment(4, 99, Role.USER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a claim participant or an admin to access the attachment filename', async () => {
    claimFindUnique.mockResolvedValue({
      attachmentUrl: 'safe-name.pdf',
      claimantId: 20,
      item: { authorId: 10 },
    });

    await expect(service.getAttachment(4, 20, Role.USER)).resolves.toBe('safe-name.pdf');
    await expect(service.getAttachment(4, 99, Role.ADMIN)).resolves.toBe('safe-name.pdf');
  });

  it('rejects acceptance when the claim is no longer pending', async () => {
    claimFindUnique.mockResolvedValue({
      id: 8,
      claimantId: 20,
      status: ClaimStatus.REJECTED,
      itemId: 4,
      item: { authorId: 10, status: ItemStatus.ACTIVE },
    });

    await expect(service.accept(8, 10, Role.USER)).rejects.toBeInstanceOf(ConflictException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects acceptance when the item is no longer active', async () => {
    claimFindUnique.mockResolvedValue({
      id: 8,
      claimantId: 20,
      status: ClaimStatus.PENDING,
      itemId: 4,
      item: { authorId: 10, status: ItemStatus.CLAIMED },
    });

    await expect(service.accept(8, 10, Role.USER)).rejects.toBeInstanceOf(ConflictException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('conditionally accepts a pending claim and claims its active item', async () => {
    claimFindUnique.mockResolvedValue({
      id: 8,
      claimantId: 20,
      status: ClaimStatus.PENDING,
      itemId: 4,
      item: { authorId: 10, status: ItemStatus.ACTIVE },
    });
    claimUpdateMany.mockResolvedValue({ count: 1 });
    itemUpdateMany.mockResolvedValue({ count: 1 });

    await expect(service.accept(8, 10, Role.USER)).resolves.toMatchObject({
      id: 8,
      status: ClaimStatus.ACCEPTED,
      itemId: 4,
    });
    expect(claimUpdateMany).toHaveBeenCalledWith({
      where: { id: 8, status: ClaimStatus.PENDING },
      data: { status: ClaimStatus.ACCEPTED },
    });
    expect(itemUpdateMany).toHaveBeenCalledWith({
      where: { id: 4, status: ItemStatus.ACTIVE },
      data: { status: ItemStatus.CLAIMED },
    });
  });
});