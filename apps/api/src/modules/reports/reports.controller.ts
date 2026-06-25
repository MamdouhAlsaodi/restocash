import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ReportsService } from "./reports.service";

/**
 * Daily reports endpoint.
 * Accessible by ADMIN, SUPER_ADMIN, and CASHIER (everyone in the
 * restaurant needs to see the daily numbers).
 */
@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.CASHIER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("daily")
  daily(@Query("date") date: string) {
    return this.reportsService.daily(date);
  }
}