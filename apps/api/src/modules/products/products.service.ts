import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(options: { categoryId?: string; includeInactive?: boolean }) {
    return this.prisma.product.findMany({
      where: {
        ...(options.categoryId ? { categoryId: options.categoryId } : {}),
        ...(options.includeInactive ? {} : { isActive: true }),
      },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);

    return this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        price: new Prisma.Decimal(dto.price),
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { category: true },
    });
  }

  private async ensureExists(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }
  }
}
