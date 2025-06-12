import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { supervisor } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { SupervisorLoginDto } from '../dtos/student-auth.dto';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as ms from 'ms';
import { refreshSupervisorTokens } from 'src/database/schema/auth.schema';

@Injectable()
export class AuthSupervisorService {
  private readonly logger = new Logger(AuthSupervisorService.name);
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string) {
    this.logger.log(`Finding user with email address: ${email}`);
    const user = await this.drizzle.db.query.supervisor.findFirst({
      where: eq(supervisor.email, email),
    });

    if (!user) {
      throw new NotFoundException(`User with Email Address ${email} not found`);
    }

    return user;
  }

  async loginSupervisor(supervisorLoginDto: SupervisorLoginDto) {
    this.logger.log(
      `Logging in user with Email Address: ${supervisorLoginDto.email}`,
    );
    const user = await this.findByEmail(supervisorLoginDto.email);
    const tokens = await this.generateSupervisorTokens(
      user.id.toString(),
      user.role,
    );

    return { user, ...tokens };
  }

  async generateSupervisorTokens(userId: string, roles: string) {
    this.logger.log(
      `Generating tokens for user ID: ${userId}, Roles: ${roles}`,
    );
    const payload = { sub: userId, roles };
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.generateSupervisorRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private async generateSupervisorRefreshToken(userId: string) {
    this.logger.log('Generating refresh token for user ID:', userId);
    console.log('Generating refresh token for user:', userId, typeof userId);
    const refreshExpiration = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRATION',
    );
    const payload = { sub: userId };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: refreshExpiration,
    });

    console.log('Generated refresh token:', token);
    await this.drizzle.db.insert(refreshSupervisorTokens).values({
      token,
      userId: parseInt(userId, 10),
      expiresAt: new Date(Date.now() + ms(refreshExpiration)),
    });

    return token;
  }

  async refreshSupervisorAccessToken(refreshToken: string) {
    this.logger.log(
      'Refreshing access token with refresh token:',
      refreshToken,
    );
    const tokenRecord =
      await this.drizzle.db.query.refreshSupervisorTokens.findFirst({
        where: eq(refreshSupervisorTokens.token, refreshToken),
      });

    if (
      !tokenRecord ||
      tokenRecord.revoked ||
      new Date() > tokenRecord.expiresAt
    ) {
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

  async revokeSupervisorRefreshToken(token: string) {
    this.logger.log('Revoking refresh token:', token);
    await this.drizzle.db
      .update(refreshSupervisorTokens)
      .set({ revoked: true })
      .where(eq(refreshSupervisorTokens.token, token));

    this.logger.log('Refresh token revoked successfully:', token);
    return { message: 'Logged out successfully' };
  }
}
