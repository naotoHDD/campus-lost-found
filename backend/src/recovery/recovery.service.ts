import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ClaimStatus,
  ItemStatus,
  ItemType,
  RecoveryStatus,
  Role,
} from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../common/prisma/prisma.service.js';

const CODE_VALIDITY_MS = 30 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

@Injectable()
export class RecoveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecovery(claimId: number, actorId: number, actorRole: string) {
    const claim = await this.getAcceptedClaim(
      claimId,
      actorId,
      actorRole,
      true,
    );
    const recovery = await this.prisma.recovery.findUnique({
      where: { claimId },
    });

    return this.toRecoveryView(claim, recovery, actorId, actorRole);
  }

  async updateMeeting(
    claimId: number,
    actorId: number,
    actorRole: string,
    dto: { location: string; date: string; time: string },
  ) {
    const claim = await this.getAcceptedClaim(claimId, actorId, actorRole);
    const meetingDate = this.parseTunisiaMeeting(dto.date, dto.time);
    const verificationCode = String(randomInt(100000, 1000000));
    const verificationCodeExpiresAt = new Date(Date.now() + CODE_VALIDITY_MS);

    const recovery = await this.prisma.recovery.upsert({
      where: { claimId },
      update: {
        meetingLocation: dto.location,
        meetingDate,
        verificationCode,
        verificationCodeExpiresAt,
        verificationAttempts: 0,
        codeVerifiedAt: null,
        finderConfirmed: false,
        claimantConfirmed: false,
        status: RecoveryStatus.SCHEDULED,
      },
      create: {
        claimId,
        meetingLocation: dto.location,
        meetingDate,
        verificationCode,
        verificationCodeExpiresAt,
        verificationAttempts: 0,
        codeVerifiedAt: null,
        status: RecoveryStatus.SCHEDULED,
      },
    });

    return this.toRecoveryView(claim, recovery, actorId, actorRole);
  }

  async verifyCode(
    claimId: number,
    actorId: number,
    actorRole: string,
    code: string,
  ) {
    const claim = await this.getAcceptedClaim(claimId, actorId, actorRole);
    const { finderId } = this.participantIds(claim);
    if (actorRole !== Role.ADMIN && actorId !== finderId) {
      throw new ForbiddenException(
        'Only the finder can verify the recovery code.',
      );
    }

    const recovery = await this.prisma.recovery.findUnique({
      where: { claimId },
    });
    if (!recovery) {
      throw new NotFoundException('Recovery record not found');
    }

    if (recovery.status === RecoveryStatus.VERIFIED) {
      return { valid: true, claimId, status: RecoveryStatus.VERIFIED };
    }

    if (recovery.status !== RecoveryStatus.SCHEDULED) {
      throw new BadRequestException(
        'This recovery is not awaiting code verification.',
      );
    }

    if (!recovery.verificationCode) {
      throw new BadRequestException(
        'No verification code has been generated yet.',
      );
    }

    const expiresAt = recovery.verificationCodeExpiresAt
      ? new Date(recovery.verificationCodeExpiresAt)
      : null;
    if (
      !expiresAt ||
      !Number.isFinite(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException(
        'The verification code has expired. Schedule the meeting again to generate a new code.',
      );
    }

    const attempts = recovery.verificationAttempts ?? 0;
    if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
      throw new HttpException(
        'Too many verification attempts. Schedule the meeting again to generate a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (recovery.verificationCode !== code) {
      const nextAttempts = attempts + 1;
      await this.prisma.recovery.update({
        where: { claimId },
        data: { verificationAttempts: { increment: 1 } },
      });

      if (nextAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        throw new HttpException(
          'Too many verification attempts. Schedule the meeting again to generate a new code.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadRequestException(
        `The verification code is invalid. ${MAX_VERIFICATION_ATTEMPTS - nextAttempts} attempt(s) remaining.`,
      );
    }

    await this.prisma.recovery.update({
      where: { claimId },
      data: {
        status: RecoveryStatus.VERIFIED,
        verificationCode: null,
        codeVerifiedAt: new Date(),
      },
    });

    return { valid: true, claimId, status: RecoveryStatus.VERIFIED };
  }

  async confirm(
    claimId: number,
    actorId: number,
    actorRole: string,
    confirmation: 'FINDER' | 'CLAIMANT',
  ) {
    const claim = await this.getAcceptedClaim(
      claimId,
      actorId,
      actorRole,
      true,
    );
    const { finderId, claimantId } = this.participantIds(claim);
    const expectedActorId = confirmation === 'FINDER' ? finderId : claimantId;

    if (actorRole !== Role.ADMIN && actorId !== expectedActorId) {
      throw new ForbiddenException(
        `Only the ${confirmation.toLowerCase()} can provide this confirmation.`,
      );
    }

    const recovery = await this.prisma.recovery.findUnique({
      where: { claimId },
    });
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
      throw new BadRequestException(
        'The recovery code must be verified before confirmation.',
      );
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const updatedRecovery = await transaction.recovery.update({
        where: { claimId },
        data:
          confirmation === 'FINDER'
            ? { finderConfirmed: true }
            : { claimantConfirmed: true },
      });

      if (
        updatedRecovery.finderConfirmed &&
        updatedRecovery.claimantConfirmed
      ) {
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

  private participantIds(claim: any) {
    return {
      finderId:
        claim.item.type === ItemType.FOUND
          ? claim.item.authorId
          : claim.claimantId,
      claimantId:
        claim.item.type === ItemType.FOUND
          ? claim.claimantId
          : claim.item.authorId,
    };
  }

  private parseTunisiaMeeting(date: string, time: string) {
    const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const timeParts = /^(\d{2}):(\d{2})$/.exec(time);
    if (!dateParts || !timeParts) {
      throw new BadRequestException('The meeting date or time is invalid.');
    }

    const [, yearText, monthText, dayText] = dateParts;
    const [, hourText, minuteText] = timeParts;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);
    const calendarDate = new Date(Date.UTC(year, month - 1, day));

    if (
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day ||
      hour > 23 ||
      minute > 59
    ) {
      throw new BadRequestException('The meeting date or time is invalid.');
    }

    // Tunisia uses UTC+01:00 year-round. Persisting an explicit offset keeps
    // the selected local time stable even when the container itself runs in UTC.
    return new Date(`${date}T${time}:00+01:00`);
  }

  private toRecoveryView(
    claim: any,
    recovery: any,
    actorId: number,
    actorRole: string,
  ) {
    const { finderId, claimantId } = this.participantIds(claim);
    const participantRole =
      actorRole === Role.ADMIN
        ? 'ADMIN'
        : actorId === finderId
          ? 'FINDER'
          : 'CLAIMANT';
    const canViewCode = actorRole === Role.ADMIN || actorId === claimantId;
    const rawExpiry = recovery?.verificationCodeExpiresAt;
    const expiry = rawExpiry ? new Date(rawExpiry) : null;
    const codeExpired = Boolean(
      recovery?.verificationCode &&
      (!expiry ||
        !Number.isFinite(expiry.getTime()) ||
        expiry.getTime() <= Date.now()),
    );
    const hasVerificationCode = Boolean(
      recovery?.verificationCode &&
      recovery?.status === RecoveryStatus.SCHEDULED &&
      !codeExpired,
    );
    const verificationAttempts = recovery?.verificationAttempts ?? 0;

    return {
      claimId: claim.id,
      claimStatus: claim.status,
      item: {
        id: claim.item.id,
        title: claim.item.title,
        type: claim.item.type,
        status: claim.item.status,
      },
      participantRole,
      status: recovery?.status ?? RecoveryStatus.PENDING,
      meetingLocation: recovery?.meetingLocation ?? null,
      meetingDate:
        recovery?.meetingDate?.toISOString?.() ?? recovery?.meetingDate ?? null,
      verificationCode:
        canViewCode && hasVerificationCode
          ? (recovery?.verificationCode ?? null)
          : undefined,
      hasVerificationCode,
      verificationCodeExpiresAt:
        expiry && Number.isFinite(expiry.getTime())
          ? expiry.toISOString()
          : null,
      codeExpired,
      attemptsRemaining: hasVerificationCode
        ? Math.max(0, MAX_VERIFICATION_ATTEMPTS - verificationAttempts)
        : 0,
      codeVerifiedAt:
        recovery?.codeVerifiedAt?.toISOString?.() ??
        recovery?.codeVerifiedAt ??
        null,
      finderConfirmed: recovery?.finderConfirmed ?? false,
      claimantConfirmed: recovery?.claimantConfirmed ?? false,
    };
  }

  private async getAcceptedClaim(
    claimId: number,
    actorId: number,
    actorRole: string,
    allowCompleted = false,
  ) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (
      actorRole !== Role.ADMIN &&
      claim.item.authorId !== actorId &&
      claim.claimantId !== actorId
    ) {
      throw new ForbiddenException(
        'Only the item owner, claimant, or an admin can manage recovery.',
      );
    }

    if (
      claim.status !== ClaimStatus.ACCEPTED &&
      !(allowCompleted && claim.status === ClaimStatus.COMPLETED)
    ) {
      throw new BadRequestException(
        'Recovery is only available for accepted claims.',
      );
    }

    return claim;
  }
}
