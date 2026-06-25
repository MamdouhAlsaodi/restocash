import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedUser } from "../auth/interfaces/authenticated-user";
import { CancelSaleDto } from "./dto/cancel-sale.dto";
import { CheckoutDto } from "./dto/checkout.dto";
import { SalesService } from "./sales.service";

@Controller("sales")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post("checkout")
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  checkout(@Body() dto: CheckoutDto, @CurrentUser() user: AuthenticatedUser) {
    return this.salesService.checkout(dto, user.id);
  }

  /**
   * Fetch a single sale with full items + cashier info.
   * Used by the Reports screen to drill into a sale.
   */
  @Get(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CASHIER)
  byId(@Param("id") id: string) {
    return this.salesService.findById(id);
  }

  /**
   * Cancel a sale (Admin only).
   * Requires a reason. Idempotent — cancelling an already-cancelled sale
   * returns the existing record.
   */
  @Post(":id/cancel")
  @Roles(UserRole.ADMIN)
  cancel(
    @Param("id") id: string,
    @Body() dto: CancelSaleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesService.cancel(id, dto, user.id);
  }
}
