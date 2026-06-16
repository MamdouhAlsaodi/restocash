import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { HealthModule } from "./modules/health/health.module";
import { SecurityModule } from "./shared/security/security.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    DatabaseModule,
    SecurityModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    HealthModule,
  ],
})
export class AppModule {}
