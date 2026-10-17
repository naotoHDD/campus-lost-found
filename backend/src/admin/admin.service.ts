import { Injectable } from '@nestjs/common';
import { ClaimStatus, ItemStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [totalUsers, totalItems, lostItems, foundItems, activeItems, claimedItems, returnedItems, closedItems, pendingClaims, acceptedClaims, rejectedClaims] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.item.count(),
      this.prisma.item.count({ where: { type: 'LOST' } }),
      this.prisma.item.count({ where: { type: 'FOUND' } }),
      this.prisma.item.count({ where: { status: ItemStatus.ACTIVE } }),
      this.prisma.item.count({ where: { status: ItemStatus.CLAIMED } }),
      this.prisma.item.count({ where: { status: ItemStatus.RETURNED } }),
      this.prisma.item.count({ where: { status: ItemStatus.CLOSED } }),
      this.prisma.claim.count({ where: { status: ClaimStatus.PENDING } }),
      this.prisma.claim.count({ where: { status: ClaimStatus.ACCEPTED } }),
      this.prisma.claim.count({ where: { status: ClaimStatus.REJECTED } }),
    ]);

    return {
      totalUsers,
      totalItems,
      lostItems,
      foundItems,
      activeItems,
      claimedItems,
      returnedItems,
      closedItems,
      pendingClaims,
      acceptedClaims,
      rejectedClaims,
    };
  }

  async items() {
    return this.prisma.item.findMany({
      include: { category: true, location: true, author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async claims() {
    const claims = await this.prisma.claim.findMany({
      include: {
        item: { select: { id: true, title: true } },
        claimant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return claims.map((claim) => ({
      ...claim,
      attachmentUrl: claim.attachmentUrl ? `/api/claims/${claim.id}/attachment` : undefined,
    }));
  }
}
