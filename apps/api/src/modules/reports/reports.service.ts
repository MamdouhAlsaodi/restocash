import { BadRequestException, Injectable } from "@nestjs/common";
import { PaymentMethod, Prisma, SaleStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

type DailyReportTotals = Record<PaymentMethod, number>;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async daily(date: string) {
    const { start, end } = this.parseDateRange(date);

    const sales = await this.prisma.sale.findMany({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        saleNumber: true,
        totalAmount: true,
        paymentMethod: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const byPaymentMethod = this.emptyTotals();
    let total = new Prisma.Decimal(0);

    for (const sale of sales) {
      total = total.plus(sale.totalAmount);
      byPaymentMethod[sale.paymentMethod] = this.toMoney(
        new Prisma.Decimal(byPaymentMethod[sale.paymentMethod]).plus(sale.totalAmount),
      );
    }

    return {
      date,
      count: sales.length,
      total: this.toMoney(total),
      byPaymentMethod,
      sales: sales.map((sale) => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        paymentMethod: sale.paymentMethod,
        totalAmount: this.toMoney(sale.totalAmount),
        createdAt: sale.createdAt,
      })),
    };
  }

  private parseDateRange(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("date must use YYYY-MM-DD format");
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException("Invalid date");
    }

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
  }

  private emptyTotals(): DailyReportTotals {
    return {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.PIX]: 0,
      [PaymentMethod.CARD_DEBIT]: 0,
      [PaymentMethod.CARD_CREDIT]: 0,
    };
  }

  private toMoney(value: Prisma.Decimal) {
    return Number(value.toFixed(2));
  }
}
