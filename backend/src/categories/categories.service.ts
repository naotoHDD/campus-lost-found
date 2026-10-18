import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findByName(name: string) {
    return this.prisma.category.findUnique({ where: { name } });
  }

  findById(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async upsertByName(name: string) {
    const normalized = name.trim();
    const existing = await this.findByName(normalized);
    if (existing) {
      return existing;
    }

    return this.prisma.category.create({
      data: {
        name: normalized,
        slug: normalized.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  create(name: string) {
    const normalized = name.trim();
    return this.prisma.category.create({
      data: {
        name: normalized,
        slug: normalized.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  async update(id: number, name: string) {
    const normalized = name.trim();
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const duplicate = await this.prisma.category.findUnique({
      where: { name: normalized },
      select: { id: true },
    });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('A category with this name already exists.');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: normalized,
        slug: normalized.toLowerCase().replace(/\s+/g, '-'),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category
      .delete({ where: { id } })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2003'
        ) {
          throw new ConflictException(
            'Categories referenced by items cannot be deleted.',
          );
        }
        throw error;
      });
  }

  count() {
    return this.prisma.category.count();
  }
}
