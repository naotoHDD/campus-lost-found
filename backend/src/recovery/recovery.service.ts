import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ClaimStatus, ItemStatus, ItemType, RecoveryStatus, Role } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class RecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async updateMeeting(claimId: number, actorId: number, actorRole: string, dto: { location: string; date: string; time: string }) {
    await this.getAcceptedClaim(claimId, actorId, actorRole);
    const meetingDate = new Date(`${dto.date}T${dto.time}:00`);
    if (Number.isNaN(meetingDate.getTime())) {
      throw new BadRequestException('The meeting date or time is invalid.');
    }

    const recovery = await this.prisma.recovery.upsert({
      where: { claimId },
      update: {
        meetingLocation: dto.location,
        meetingDate,
        verificationCode: String(randomInt(100000, 1000000)),
        finderConfirmed: false,
        claimantConfirmed: false,
        status: RecoveryStatus.SCHEDULED,
      },
      create: {
        claimId,
        meetingLocation: dto.location,
        meetingDate,
        verificationCode: String(randomInt(100000, 1000000)),
        status: RecoveryStatus.SCHEDULED,
      },
    });

    return {
      claimId,
      location: recovery.meetingLocation,
      date: recovery.meetingDate,
      code: recovery.verificationCode,
    };
  }

  async verifyCode(claimId: number, actorId: number, actorRole: string, code: string) {
    await this.getAcceptedClaim(claimId, actorId, actorRole);
    const recovery = await this.prisma.recovery.findUnique({ where: { claimId } });
    if (!recovery) {
      throw new NotFoundException('Recovery record not found');
    }

    if (!recovery.verificationCode) {
      throw new BadRequestException('No verification code has been generated yet.');
    }

    if (recovery.verificationCode !== code) {
      throw new BadRequestException('The verification code is invalid.');
    }

    if (recovery.status !== RecoveryStatus.SCHEDULED && recovery.status !== RecoveryStatus.VERIFIED) {
      throw new BadRequestException('This recovery is not awaiting code verification.');
    }

    if (recovery.status !== RecoveryStatus.VERIFIED) {
      await this.prisma.recovery.update({
        where: { claimId },
        data: { status: RecoveryStatus.VERIFIED },
      });
    }

    return { valid: true, claimId, status: RecoveryStatus.VERIFIED };
  }

  async confirm(claimId: number, actorId: number, actorRole: string, confirmation: 'FINDER' | 'CLAIMANT') {
    const claim = await this.getAcceptedClaim(claimId, actorId, actorRole, true);
    const finderId = claim.item.type === ItemType.FOUND ? claim.item.authorId : claim.claimantId;
    const claimantId = claim.item.type === ItemType.FOUND ? claim.claimantId : claim.item.authorId;
    const expectedActorId = confirmation === 'FINDER' ? finderId : claimantId;

    if (actorRole !== Role.ADMIN && actorId !== expectedActorId) {
      throw new ForbiddenException(`Only the ${confirmation.toLowerCase()} can provide this confirmation.`);
    }

    const recovery = await this.prisma.recovery.findUnique({ where: { claimId } });
    if (!recovery) {
      throw new NotFoundException('Recovery record not found');
    }

    if (recovery.status === RecoveryStatus.COMPLETED) {
      return {
        claimId,
        confirmation,
        finderConfirmed: recovery.finderConfirmed,
        claimantConfirmed: recovery.claimantConfirmed,
        status: RecoveryStatus.COMPLETED,
      };
    }

    if (recovery.status !== RecoveryStatus.VERIFIED) {
      throw new BadRequestException('The recovery code must be verified before confirmation.');
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const updatedRecovery = await transaction.recovery.update({
        where: { claimId },
        data: confirmation === 'FINDER' ? { finderConfirmed: true } : { claimantConfirmed: true },
      });

      if (updatedRecovery.finderConfirmed && updatedRecovery.claimantConfirmed) {
        await transaction.recovery.update({
          where: { claimId },
          data: { status: RecoveryStatus.COMPLETED },
        });
        await transaction.claim.update({
          where: { id: claimId },
          data: { status: ClaimStatus.COMPLETED },
        });
        await transaction.item.update({
          where: { id: claim.itemId },
          data: { status: ItemStatus.RETURNED },
        });
        return { ...updatedRecovery, status: RecoveryStatus.COMPLETED };
      }

      return updatedRecovery;
    });

    return {
      claimId,
      confirmation,
      finderConfirmed: updated.finderConfirmed,
      claimantConfirmed: updated.claimantConfirmed,
      status: updated.status,
    };
  }

  private async getAcceptedClaim(claimId: number, actorId: number, actorRole: string, allowCompleted = false) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (actorRole !== Role.ADMIN && claim.item.authorId !== actorId && claim.claimantId !== actorId) {
      throw new ForbiddenException('Only the item owner, claimant, or an admin can manage recovery.');
    }

    if (claim.status !== ClaimStatus.ACCEPTED && !(allowCompleted && claim.status === ClaimStatus.COMPLETED)) {
      throw new BadRequestException('Recovery is only available for accepted claims.');
    }

    return claim;
  }
}
