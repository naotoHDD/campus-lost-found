import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ItemStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CategoriesService } from '../categories/categories.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { ItemQueryDto } from './dto/item-query.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { LocationsService } from '../locations/locations.service.js';

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
    private readonly locationsService: LocationsService,
  ) {}

  async count() {
    return this.prisma.item.count();
  }

  async list(
    filters: ItemQueryDto,
    visibility: { ownerId?: number; includePreciseLocation?: boolean } = {},
  ) {
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 6);
    const skip = (page - 1) * limit;
    const where: Prisma.ItemWhereInput = {};

    if (visibility.ownerId !== undefined) {
      where.authorId = visibility.ownerId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { is: { addressText: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = { is: { name: { contains: filters.category, mode: 'insensitive' } } };
    }

    const locationFilter: Prisma.LocationWhereInput = {};
    if (filters.governorate) {
      locationFilter.governorate = { contains: filters.governorate, mode: 'insensitive' };
    }

    if (filters.delegation) {
      locationFilter.delegation = { contains: filters.delegation, mode: 'insensitive' };
    }

    if (Object.keys(locationFilter).length > 0) {
      where.location = { is: locationFilter };
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: filters.sort === 'oldest' ? 'asc' : 'desc' },
        include: {
          category: true,
          location: true,
          author: { select: { id: true, name: true } },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items.map((item) => this.toPublicItem(item, visibility)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        author: { select: { id: true, name: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return this.toPublicItem(item);
  }

  async create(data: CreateItemDto, userId: number, imagePath?: string) {
    const category = await this.categoriesService.upsertByName(data.category);
    const location = await this.locationsService.findOrCreate({
      governorate: data.governorate,
      delegation: data.delegation,
      locality: data.locality,
      addressText: data.addressText,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    const item = await this.prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: ItemStatus.ACTIVE,
        itemDate: new Date(data.itemDate),
        imageUrl: imagePath ? `/api/files/${imagePath}` : null,
        verificationDetails: data.verificationDetails ?? null,
        verificationQuestion: data.verificationQuestion ?? null,
        author: { connect: { id: userId } },
        category: { connect: { id: category.id } },
        location: { connect: { id: location.id } },
      },
      include: {
        category: true,
        location: true,
        author: { select: { id: true, name: true } },
      },
    });

    return this.toPublicItem(item, { includePreciseLocation: true });
  }

  async update(id: number, userId: number, dto: UpdateItemDto, imagePath?: string, isAdmin = false) {
    const existing = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    if (!isAdmin && existing.authorId !== userId) {
      throw new ForbiddenException('You can only update your own items.');
    }

    if (!isAdmin && dto.status !== undefined && dto.status !== ItemStatus.CLOSED) {
      throw new ForbiddenException('Owners may only close their own active items.');
    }

    if (!isAdmin && dto.status === ItemStatus.CLOSED && existing.status !== ItemStatus.ACTIVE) {
      throw new BadRequestException('Only active items can be closed.');
    }

    const category = dto.category ? await this.categoriesService.upsertByName(dto.category) : existing.categoryId;
    const currentItem = dto.governorate || dto.delegation || dto.locality || dto.addressText || dto.latitude !== undefined || dto.longitude !== undefined
      ? await this.prisma.item.findUnique({ where: { id }, include: { location: true } })
      : null;

    const location = currentItem ? await this.locationsService.findOrCreate({
      governorate: dto.governorate ?? currentItem.location.governorate,
      delegation: dto.delegation ?? currentItem.location.delegation,
      locality: dto.locality ?? currentItem.location.locality ?? null,
      addressText: dto.addressText ?? currentItem.location.addressText ?? null,
      latitude: dto.latitude ?? (currentItem.location.latitude != null ? Number(currentItem.location.latitude) : null),
      longitude: dto.longitude ?? (currentItem.location.longitude != null ? Number(currentItem.location.longitude) : null),
    }) : undefined;

    const updated = await this.prisma.item.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status,
        itemDate: dto.itemDate ? new Date(dto.itemDate) : undefined,
        imageUrl: imagePath ? `/api/files/${imagePath}` : undefined,
        verificationDetails: dto.verificationDetails,
        verificationQuestion: dto.verificationQuestion,
        category: dto.category ? { connect: { id: typeof category === 'number' ? category : category.id } } : undefined,
        location: location ? { connect: { id: location.id } } : undefined,
      },
      include: {
        category: true,
        location: true,
        author: { select: { id: true, name: true } },
      },
    });

    return this.toPublicItem(updated, { includePreciseLocation: true });
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const existing = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    if (!isAdmin && existing.authorId !== userId) {
      throw new ForbiddenException('You cannot delete someone else\'s item.');
    }

    await this.prisma.item.delete({ where: { id } });
    return { success: true };
  }

  private toPublicItem(item: any, visibility: { includePreciseLocation?: boolean } = {}) {
    const latitude = item.location.latitude != null ? Number(item.location.latitude) : undefined;
    const longitude = item.location.longitude != null ? Number(item.location.longitude) : undefined;

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      status: item.status,
      imageUrl: item.imageUrl ?? undefined,
      category: {
        id: item.category.id,
        name: item.category.name,
      },
      governorate: item.location.governorate,
      delegation: item.location.delegation,
      locality: visibility.includePreciseLocation ? item.location.locality ?? undefined : undefined,
      addressText: visibility.includePreciseLocation ? item.location.addressText ?? undefined : undefined,
      latitude: visibility.includePreciseLocation ? latitude : latitude !== undefined ? Number(latitude.toFixed(2)) : undefined,
      longitude: visibility.includePreciseLocation ? longitude : longitude !== undefined ? Number(longitude.toFixed(2)) : undefined,
      itemDate: item.itemDate ? new Date(item.itemDate).toISOString() : undefined,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
      author: item.author
        ? {
            id: item.author.id,
            name: item.author.name,
          }
        : undefined,
    };
  }
}
