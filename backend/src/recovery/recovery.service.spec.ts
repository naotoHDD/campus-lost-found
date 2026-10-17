import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ClaimStatus, ItemType, RecoveryStatus, Role } from '@prisma/client';
import { jest } from '@jest/globals';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { RecoveryService } from './recovery.service.js';

describe('RecoveryService', () => {
  const claimFindUnique = jest.fn();
  const recoveryFindUnique = jest.fn();
  const recoveryUpsert = jest.fn();
  const recoveryUpdate = jest.fn();
  const transactionClaimUpdate = jest.fn();
  const transactionItemUpdate = jest.fn();
  const transaction = jest.fn(async (callback: (tx: any) => Promise<unknown>) => callback({
    recovery: { update: recoveryUpdate },
    claim: { update: transactionClaimUpdate },
    item: { update: transactionItemUpdate },
  }));
  const service = new RecoveryService({
    claim: { findUnique: claimFindUnique },
    recovery: {
      findUnique: recoveryFindUnique,
      upsert: recoveryUpsert,
      update: recoveryUpdate,
    },
    $transaction: transaction,
  } as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function acceptedClaim(type: ItemType = ItemType.FOUND) {
    return {
      id: 8,
      itemId: 4,
      claimantId: 20,
      status: ClaimStatus.ACCEPTED,
      item: { authorId: 10, type },
    };
  }

  it('rejects recovery access from a non-participant', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim());

    await expect(service.updateMeeting(8, 99, Role.USER, {
      location: 'Library',
      date: '2026-10-05',
      time: '15:00',
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(recoveryUpsert).not.toHaveBeenCalled();
  });

  it('allows recovery only after a claim is accepted', async () => {
    claimFindUnique.mockResolvedValue({ ...acceptedClaim(), status: ClaimStatus.PENDING });

    await expect(service.updateMeeting(8, 10, Role.USER, {
      location: 'Library',
      date: '2026-10-05',
      time: '15:00',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(recoveryUpsert).not.toHaveBeenCalled();
  });

  it('schedules a meeting with a six-digit verification code', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim());
    recoveryUpsert.mockResolvedValue({
      meetingLocation: 'Library',
      meetingDate: new Date('2026-10-05T15:00:00'),
      verificationCode: '123456',
    });

    const result = await service.updateMeeting(8, 10, Role.USER, {
      location: 'Library',
      date: '2026-10-05',
      time: '15:00',
    });

    expect(recoveryUpsert.mock.calls[0]?.[0].create).toMatchObject({ status: RecoveryStatus.SCHEDULED });
    expect(recoveryUpsert.mock.calls[0]?.[0].create.verificationCode).toMatch(/^\d{6}$/);
    expect(result.code).toBe('123456');
  });

  it('marks a scheduled recovery verified after a valid code', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim());
    recoveryFindUnique.mockResolvedValue({
      verificationCode: '123456',
      status: RecoveryStatus.SCHEDULED,
    });
    recoveryUpdate.mockResolvedValue({ status: RecoveryStatus.VERIFIED });

    await expect(service.verifyCode(8, 10, Role.USER, '123456')).resolves.toMatchObject({
      valid: true,
      status: RecoveryStatus.VERIFIED,
    });
    expect(recoveryUpdate).toHaveBeenCalledWith({
      where: { claimId: 8 },
      data: { status: RecoveryStatus.VERIFIED },
    });
  });

  it('requires code verification before participant confirmation', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim());
    recoveryFindUnique.mockResolvedValue({ status: RecoveryStatus.SCHEDULED });

    await expect(service.confirm(8, 10, Role.USER, 'FINDER')).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('allows only the finder to submit the finder confirmation for FOUND items', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim(ItemType.FOUND));
    recoveryFindUnique.mockResolvedValue({
      claimId: 8,
      status: RecoveryStatus.VERIFIED,
      finderConfirmed: false,
      claimantConfirmed: false,
    });
    recoveryUpdate.mockResolvedValue({
      finderConfirmed: true,
      claimantConfirmed: false,
      status: RecoveryStatus.VERIFIED,
    });

    await expect(service.confirm(8, 20, Role.USER, 'FINDER'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(recoveryUpdate).not.toHaveBeenCalled();

    await service.confirm(8, 10, Role.USER, 'FINDER');
    expect(recoveryUpdate).toHaveBeenCalledWith({
      where: { claimId: 8 },
      data: { finderConfirmed: true },
    });
  });

  it('maps the claimant to the finder role for LOST items', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim(ItemType.LOST));
    recoveryFindUnique.mockResolvedValue({
      claimId: 8,
      status: RecoveryStatus.VERIFIED,
      finderConfirmed: false,
      claimantConfirmed: false,
    });
    recoveryUpdate.mockResolvedValue({
      finderConfirmed: true,
      claimantConfirmed: false,
      status: RecoveryStatus.VERIFIED,
    });

    await service.confirm(8, 20, Role.USER, 'FINDER');

    expect(recoveryUpdate).toHaveBeenCalledWith({
      where: { claimId: 8 },
      data: { finderConfirmed: true },
    });
  });

  it('completes the claim and returns the item after both participants confirm', async () => {
    claimFindUnique.mockResolvedValue(acceptedClaim());
    recoveryFindUnique.mockResolvedValue({
      claimId: 8,
      status: RecoveryStatus.VERIFIED,
      finderConfirmed: true,
      claimantConfirmed: false,
    });
    recoveryUpdate.mockResolvedValue({
      finderConfirmed: true,
      claimantConfirmed: true,
      status: RecoveryStatus.VERIFIED,
    });

    const result = await service.confirm(8, 20, Role.USER, 'CLAIMANT');

    expect(result.status).toBe(RecoveryStatus.COMPLETED);
    expect(transactionClaimUpdate).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { status: ClaimStatus.COMPLETED },
    });
    expect(transactionItemUpdate).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { status: 'RETURNED' },
    });
  });
});
