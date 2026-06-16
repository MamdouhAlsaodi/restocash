import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { PasswordService } from "../../shared/security/password.service";
import { LoginDto } from "./dto/login.dto";
import { AuthenticatedUser, JwtPayload } from "./interfaces/authenticated-user";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      select: { id: true, name: true, email: true, passwordHash: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordOk = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const publicUser: AuthenticatedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>("JWT_EXPIRES_IN") ?? "24h";
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiresIn as never,
    });

    return { accessToken, user: publicUser };
  }
}
