import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimStatus, ItemStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class ClaimsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    itemId: number,
    userId: number,
    dto: { proofText: string; answer: string },
    fileName?: string,
  ) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.status !== ItemStatus.ACTIVE) {
      throw new BadRequestException(
        'This item is no longer available for claims.',
      );
    }

    if (item.authorId === userId) {
      throw new BadRequestException('You cannot claim your own item.');
    }

    const existing = await this.prisma.claim.findFirst({
      where: {
        itemId,
        claimantId: userId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'You already submitted a claim for this item.',
      );
    }

    let claim;
    try {
      claim = await this.prisma.claim.create({
        data: {
          itemId,
          claimantId: userId,
          proofText: dto.proofText,
          answer: dto.answer,
          attachmentUrl: fileName ?? null,
          status: ClaimStatus.PENDING,
        },
        include: {
          item: { select: { id: true, title: true } },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You already submitted a claim for this item.',
        );
      }
      throw error;
    }

    await this.prisma.notification.create({
      data: {
        userId: item.authorId,
        title: 'Nouvelle réclamation',
        message: `Une personne a réclamé « ${item.title} ».`,
      },
    });

    return this.toPublicClaim(claim);
  }

  async myClaims(userId: number) {
    const claims = await this.prisma.claim.findMany({
      where: { claimantId: userId },
      include: {
        item: { select: { id: true, title: true, type: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return claims.map((claim) => this.toPublicClaim(claim));
  }

  async receivedClaims(userId: number) {
    const claims = await this.prisma.claim.findMany({
      where: { item: { authorId: userId } },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            verificationQuestion: true,
          },
        },
        claimant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return claims.map((claim) => ({
      ...this.toPublicClaim(claim),
      answer: claim.answer,
      claimant: claim.claimant,
    }));
  }

  async getAttachment(claimId: number, actorId: number, actorRole: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim || !claim.attachmentUrl) {
      throw new NotFoundException('Claim attachment not found');
    }

    if (
      actorRole !== Role.ADMIN &&
      claim.claimantId !== actorId &&
      claim.item.authorId !== actorId
    ) {
      throw new ForbiddenException(
        'Only the claim participants or an admin can access this attachment.',
      );
    }

    return claim.attachmentUrl;
  }

  async accept(claimId: number, actorId: number, actorRole: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (actorRole !== Role.ADMIN && claim.item.authorId !== actorId) {
      throw new ForbiddenException(
        'Only the item owner or an admin can accept a claim.',
      );
    }

    if (claim.claimantId === actorId) {
      throw new ForbiddenException('A claimant cannot accept their own claim.');
    }

    if (
      claim.status !== ClaimStatus.PENDING ||
      claim.item.status !== ItemStatus.ACTIVE
    ) {
      throw new ConflictException(
        'Only pending claims for active items can be accepted.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const claimUpdate = await transaction.claim.updateMany({
        where: { id: claimId, status: ClaimStatus.PENDING },
        data: { status: ClaimStatus.ACCEPTED },
      });
      if (claimUpdate.count !== 1) {
        throw new ConflictException('This claim has already been reviewed.');
      }

      const itemUpdate = await transaction.item.updateMany({
        where: { id: claim.itemId, status: ItemStatus.ACTIVE },
        data: { status: ItemStatus.CLAIMED },
      });
      if (itemUpdate.count !== 1) {
        throw new ConflictException('This item is no longer active.');
      }

      await transaction.claim.updateMany({
        where: {
          itemId: claim.itemId,
          id: { not: claimId },
          status: ClaimStatus.PENDING,
        },
        data: { status: ClaimStatus.REJECTED },
      });
    });

    await this.prisma.notification.create({
      data: {
        userId: claim.claimantId,
        title: 'Réclamation acceptée',
        message: `Votre réclamation pour « ${claim.item.title} » a été acceptée.`,
      },
    });

    return { id: claimId, status: ClaimStatus.ACCEPTED, itemId: claim.itemId };
  }

  async reject(claimId: number, actorId: number, actorRole: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    if (actorRole !== Role.ADMIN && claim.item.authorId !== actorId) {
      throw new ForbiddenException(
        'Only the item owner or an admin can reject a claim.',
      );
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new ConflictException('Only pending claims can be rejected.');
    }

    const updated = await this.prisma.claim.updateMany({
      where: { id: claimId, status: ClaimStatus.PENDING },
      data: { status: ClaimStatus.REJECTED },
    });
    if (updated.count !== 1) {
      throw new ConflictException('This claim has already been reviewed.');
    }

    await this.prisma.notification.create({
      data: {
        userId: claim.claimantId,
        title: 'Réclamation refusée',
        message: `Votre réclamation pour « ${claim.item.title} » a été refusée.`,
      },
    });

    return { id: claimId, status: ClaimStatus.REJECTED, itemId: claim.itemId };
  }

  async stats() {
    const [pending, accepted, rejected] = await Promise.all([
      this.prisma.claim.count({ where: { status: ClaimStatus.PENDING } }),
      this.prisma.claim.count({ where: { status: ClaimStatus.ACCEPTED } }),
      this.prisma.claim.count({ where: { status: ClaimStatus.REJECTED } }),
    ]);

    return { pending, accepted, rejected };
  }

  private toPublicClaim(claim: any) {
    return {
      id: claim.id,
      item: {
        id: claim.item.id,
        title: claim.item.title,
        type: claim.item.type,
        status: claim.item.status,
        verificationQuestion: claim.item.verificationQuestion,
      },
      status: claim.status,
      proofText: claim.proofText,
      attachmentUrl: claim.attachmentUrl
        ? `/api/claims/${claim.id}/attachment`
        : undefined,
      createdAt: claim.createdAt
        ? new Date(claim.createdAt).toISOString()
        : undefined,
    };
  }
}
