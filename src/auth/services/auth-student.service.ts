import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DrizzleService } from 'src/database/drizzle.service';
import { students } from 'src/database/schema';
import { eq } from 'drizzle-orm';
import { StudentLoginDto } from '../dtos/student-auth.dto';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as ms from 'ms';
import { refreshStudentTokens } from 'src/database/schema/auth.schema';

@Injectable()
export class AuthStudentService {
  private readonly logger = new Logger(AuthStudentService.name);
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findById(matricNumber: string) {
    this.logger.log(`Finding user with Matric Number: ${matricNumber}`);
    const user = await this.drizzle.db.query.students.findFirst({
      where: eq(students.matricNumber, matricNumber),
    });

    if (!user) {
      throw new NotFoundException(`User with Matric Number ${matricNumber} not found`);
    }

    return user;
  }

  async login(studentLoginDto: StudentLoginDto) {
    this.logger.log(`Logging in user with Matric Number: ${studentLoginDto.matricNumber}`);
    const user = await this.findById(studentLoginDto.matricNumber);
    const tokens = await this.generateTokens(user.id.toString(), user.role);

    return { user, ...tokens };
  }

  async generateTokens(userId: string, roles: string) {
    this.logger.log(`Generating tokens for user ID: ${userId}, Roles: ${roles}`);
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    const payload = { sub: userId, roles: rolesArray };
    const accessToken = await this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string) {
    this.logger.log('Generating refresh token for user ID:', userId);
    console.log('Generating refresh token for user:', userId, typeof userId);
    const refreshExpiration = this.configService.getOrThrow('JWT_REFRESH_EXPIRATION');
    const payload = { sub: userId };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: refreshExpiration,
    });

    console.log('Generated refresh token:', token);
    await this.drizzle.db.insert(refreshStudentTokens).values({
      token,
      userId: parseInt(userId, 10),
      expiresAt: new Date(Date.now() + ms(refreshExpiration)),
    });

    return token;
  }

  async refreshAccessToken(refreshToken: string) {
    this.logger.log('Refreshing access token with refresh token:', refreshToken);
    const tokenRecord = await this.drizzle.db.query.refreshStudentTokens.findFirst({
      where: eq(refreshStudentTokens.token, refreshToken),
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

  async revokeRefreshToken(token: string) {
    this.logger.log('Revoking refresh token:', token);
    await this.drizzle.db.update(refreshStudentTokens).set({ revoked: true }).where(eq(refreshStudentTokens.token, token));

    this.logger.log('Refresh token revoked successfully:', token);
    return { message: 'Logged out successfully' };
  }
}
