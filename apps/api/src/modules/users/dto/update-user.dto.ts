import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** Optional — admin can change role between ADMIN and CASHIER. */
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /** Optional — when set, the password is rotated. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}