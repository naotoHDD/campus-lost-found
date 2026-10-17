import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

const TUNISIAN_GOVERNORATES = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa',
  'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia',
  'La Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid',
  'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  listGovernorates() {
    return TUNISIAN_GOVERNORATES;
  }

  list() {
    return this.prisma.location.findMany({
      orderBy: { governorate: 'asc' },
    });
  }

  findOrCreate(dto: {
    governorate: string;
    delegation: string;
    locality?: string | null;
    addressText?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    return this.prisma.location.upsert({
      where: {
        governorate_delegation_locality_addressText: {
          governorate: dto.governorate,
          delegation: dto.delegation,
          locality: dto.locality ?? null,
          addressText: dto.addressText ?? null,
        } as any,
      },
      update: {
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      },
      create: {
        governorate: dto.governorate,
        delegation: dto.delegation,
        locality: dto.locality ?? null,
        addressText: dto.addressText ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      } as any,
    });
  }

  count() {
    return this.prisma.location.count();
  }

  async update(id: number, dto: {
    governorate?: string;
    delegation?: string;
    locality?: string | null;
    addressText?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) {
    const existing = await this.prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    return this.prisma.location.update({
      where: { id },
      data: {
        governorate: dto.governorate,
        delegation: dto.delegation,
        locality: dto.locality,
        addressText: dto.addressText,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A location with these details already exists.');
      }
      throw error;
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.location.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException('Location not found');
    }

    return this.prisma.location.delete({ where: { id } }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Locations referenced by items cannot be deleted.');
      }
      throw error;
    });
  }
}
