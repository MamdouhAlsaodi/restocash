import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsString, Min, MinLength, ValidateNested } from "class-validator";
import { PaymentMethod } from "@prisma/client";

export class CheckoutItemDto {
  @IsString()
  @MinLength(1)
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
