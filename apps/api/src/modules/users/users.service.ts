import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { PasswordService } from "../../shared/security/password.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  /** List all users with their sales count (Admin only). */
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { salesCreated: true } },
      },
    });

    // Strip password hash before returning.
    return users.map(({ passwordHash: _ph, ...rest }) => rest);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    const { passwordHash: _ph, ...rest } = user;
    return rest;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`Email ${dto.email} already in use`);
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const created = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        passwordHash,
      },
    });
    const { passwordHash: _ph, ...rest } = created;
    return rest;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`User ${id} not found`);

    if (dto.email && dto.email !== existing.email) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (dup) throw new ConflictException(`Email ${dto.email} already in use`);
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.password !== undefined && {
        passwordHash: await this.passwordService.hash(dto.password),
      }),
    };

    const updated = await this.prisma.user.update({ where: { id }, data });
    const { passwordHash: _ph, ...rest } = updated;
    return rest;
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`User ${id} not found`);

    // Protect the last admin
    if (existing.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          "Cannot delete the last admin user. Promote another user first.",
        );
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}