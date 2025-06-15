import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { admin, refreshAdminTokens } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as ms from 'ms';
import { AdminLoginDto } from '../dtos/student-auth.dto';

@Injectable()
export class AuthAdminService {
  private readonly logger = new Logger(AuthAdminService.name);
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string) {
    this.logger.log(`Finding user with email address: ${email}`);
    const user = await this.drizzle.db.query.admin.findFirst({
      where: eq(admin.email, email),
    });

    if (!user) {
      throw new NotFoundException(`User with Email Address ${email} not found`);
    }

    return user;
  }

  async loginAdmin(adminLoginDto: AdminLoginDto) {
    this.logger.log(`Logging in user with Email Address: ${adminLoginDto.email}`);
    const user = await this.findByEmail(adminLoginDto.email);
    const tokens = await this.generateAdminTokens(user.id.toString(), user.role);

    return { user, ...tokens };
  }

  async generateAdminTokens(userId: string, roles: string) {
    this.logger.log(`Generating tokens for user ID: ${userId}, Roles: ${roles}`);
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    const payload = { sub: userId, roles: rolesArray };
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.generateAdminRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private async generateAdminRefreshToken(userId: string) {
    this.logger.log('Generating refresh token for user ID:', userId);
    console.log('Generating refresh token for user:', userId, typeof userId);
    const refreshExpiration = this.configService.getOrThrow('JWT_REFRESH_EXPIRATION');
    const payload = { sub: userId };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: refreshExpiration,
    });

    console.log('Generated refresh token:', token);
    await this.drizzle.db.insert(refreshAdminTokens).values({
      token,
      userId: parseInt(userId, 10),
      expiresAt: new Date(Date.now() + ms(refreshExpiration)),
    });

    return token;
  }

  async refreshAdminAccessToken(refreshToken: string) {
    this.logger.log('Refreshing access token with refresh token:', refreshToken);
    const tokenRecord = await this.drizzle.db.query.refreshAdminTokens.findFirst({
      where: eq(refreshAdminTokens.token, refreshToken),
    });

    if (!tokenRecord || tokenRecord.revoked || new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const decodedToken: any = this.jwtService.decode(refreshToken);
    const payload = { sub: decodedToken?.sub };

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.tokenService.generateAccessToken(payload);
    return { accessToken };
  }

  async revokeAdminRefreshToken(token: string) {
    this.logger.log('Revoking refresh token:', token);
    await this.drizzle.db.update(refreshAdminTokens).set({ revoked: true }).where(eq(refreshAdminTokens.token, token));

    this.logger.log('Refresh token revoked successfully:', token);
    return { message: 'Logged out successfully' };
  }
}
