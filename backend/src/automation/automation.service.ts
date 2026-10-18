import { Injectable } from '@nestjs/common';
import { ItemStatus, ItemType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

type MatchableItem = {
  id: number;
  title: string;
  description: string;
  type: ItemType;
  itemDate: Date;
  authorId: number;
  categoryId: number;
  location: {
    governorate: string;
    delegation: string;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const STOP_WORDS = new Set(['avec', 'dans', 'pour', 'une', 'des', 'les', 'sur', 'objet', 'perdu', 'trouve']);

function normalizedTokens(value: string): Set<string> {
  const tokens = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  return new Set(tokens);
}

function tokenSimilarity(left: string, right: string): number {
  const leftTokens = normalizedTokens(left);
  const rightTokens = normalizedTokens(right);

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;

  return intersection / union;
}

export function calculateMatchScore(item: MatchableItem, candidate: MatchableItem): number {
  let score = item.categoryId === candidate.categoryId ? 35 : 0;

  if (item.location.governorate.toLowerCase() === candidate.location.governorate.toLowerCase()) {
    score += 20;
  }

  if (item.location.delegation.toLowerCase() === candidate.location.delegation.toLowerCase()) {
    score += 15;
  }

  const dayDifference = Math.abs(item.itemDate.getTime() - candidate.itemDate.getTime()) / DAY_MS;
  if (dayDifference <= 1) score += 15;
  else if (dayDifference <= 3) score += 12;
  else if (dayDifference <= 7) score += 8;
  else if (dayDifference <= 14) score += 4;

  const textSimilarity = tokenSimilarity(
    `${item.title} ${item.description}`,
    `${candidate.title} ${candidate.description}`,
  );
  score += Math.round(textSimilarity * 15);

  return Math.min(100, score);
}

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async runItemMatching(limit = 20, minimumScore = 60) {
    const pendingItems = await this.prisma.item.findMany({
      where: {
        status: ItemStatus.ACTIVE,
        automationProcessedAt: null,
      },
      include: {
        location: { select: { governorate: true, delegation: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    const matches: Array<{ itemId: number; candidateItemId: number; score: number }> = [];

    for (const item of pendingItems) {
      const dateFrom = new Date(item.itemDate.getTime() - 30 * DAY_MS);
      const dateTo = new Date(item.itemDate.getTime() + 30 * DAY_MS);
      const oppositeType = item.type === ItemType.LOST ? ItemType.FOUND : ItemType.LOST;

      const candidates = await this.prisma.item.findMany({
        where: {
          id: { not: item.id },
          authorId: { not: item.authorId },
          type: oppositeType,
          status: ItemStatus.ACTIVE,
          categoryId: item.categoryId,
          itemDate: { gte: dateFrom, lte: dateTo },
        },
        include: {
          location: { select: { governorate: true, delegation: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      for (const candidate of candidates) {
        const score = calculateMatchScore(item, candidate);

        if (score < minimumScore) {
          continue;
        }

        matches.push({ itemId: item.id, candidateItemId: candidate.id, score });
        const pairKey = [item.id, candidate.id].sort((left, right) => left - right).join(':');

        await this.prisma.$transaction([
          this.prisma.notification.upsert({
            where: { dedupeKey: `match:${pairKey}:user:${item.authorId}` },
            update: {},
            create: {
              userId: item.authorId,
              dedupeKey: `match:${pairKey}:user:${item.authorId}`,
              title: 'Correspondance possible',
              message: `L'annonce « ${candidate.title} » pourrait correspondre à « ${item.title} » (${score} %).`,
            },
          }),
          this.prisma.notification.upsert({
            where: { dedupeKey: `match:${pairKey}:user:${candidate.authorId}` },
            update: {},
            create: {
              userId: candidate.authorId,
              dedupeKey: `match:${pairKey}:user:${candidate.authorId}`,
              title: 'Correspondance possible',
              message: `L'annonce « ${item.title} » pourrait correspondre à « ${candidate.title} » (${score} %).`,
            },
          }),
        ]);
      }

      await this.prisma.item.update({
        where: { id: item.id },
        data: { automationProcessedAt: new Date() },
      });
    }

    return {
      processedItems: pendingItems.length,
      matchCount: matches.length,
      matches,
    };
  }
}
