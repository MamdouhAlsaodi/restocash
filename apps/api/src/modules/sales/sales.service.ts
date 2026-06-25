import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SaleStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CheckoutDto } from "./dto/checkout.dto";
import { CancelSaleDto } from "./dto/cancel-sale.dto";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch a single sale with items + cashier info for the Reports drill-down.
   */
  async findById(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }
    return sale;
  }

  async checkout(dto: CheckoutDto, createdByUserId: string) {
    const aggregatedItems = this.aggregateItems(dto.items);
    const productIds = aggregatedItems.map((item) => item.productId);

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
          isActive: true,
        },
      });

      const productsById = new Map(products.map((product) => [product.id, product]));
      const missingProductIds = productIds.filter((productId) => !productsById.has(productId));

      if (missingProductIds.length > 0) {
        throw new BadRequestException({
          message: "Some products are missing or inactive",
          productIds: missingProductIds,
        });
      }

      let totalAmount = new Prisma.Decimal(0);
      const saleItems = aggregatedItems.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new BadRequestException("Product not found");
        }

        const subtotal = product.price.mul(item.quantity);
        totalAmount = totalAmount.plus(subtotal);

        return {
          productId: product.id,
          productNameSnapshot: product.name,
          unitPriceSnapshot: product.price,
          quantity: item.quantity,
          subtotal,
        };
      });

      return tx.sale.create({
        data: {
          saleNumber: this.createSaleNumber(),
          totalAmount,
          paymentMethod: dto.paymentMethod,
          createdByUserId,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });
  }

  /**
   * Cancel a sale.
   * - Sets status to CANCELLED
   * - Records the cancellation reason and timestamp
   * - Returns the cancelled sale with items
   *
   * Idempotent: cancelling an already-cancelled sale returns the existing cancellation.
   */
  async cancel(saleId: string, dto: CancelSaleDto, cancelledByUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        select: { id: true, status: true, cancelledAt: true, cancelReason: true },
      });

      if (!sale) {
        throw new NotFoundException(`Sale ${saleId} not found`);
      }

      if (sale.status === SaleStatus.CANCELLED) {
        // Idempotent: return current state
        return tx.sale.findUnique({
          where: { id: saleId },
          include: { items: true },
        });
      }

      if (sale.status !== SaleStatus.COMPLETED) {
        throw new BadRequestException(
          `Cannot cancel sale in status ${sale.status}`,
        );
      }

      return tx.sale.update({
        where: { id: saleId },
        data: {
          status: SaleStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: dto.reason,
        },
        include: { items: true },
      });
    });
  }

  private aggregateItems(items: CheckoutDto["items"]) {
    const quantitiesByProduct = new Map<string, number>();

    for (const item of items) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    return Array.from(quantitiesByProduct.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }

  private createSaleNumber() {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RC-${timestamp}-${suffix}`;
  }
}
