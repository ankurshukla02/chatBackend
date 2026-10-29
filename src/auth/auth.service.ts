import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { buildSuccessResponse, ApiResponse } from '../common/response.util';
import { throwHttpError } from '../common/error.util';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  register = async (dto: RegisterDto): Promise<ApiResponse<{ user: { id: string; name: string; email: string }; accessToken: string }>> => {
    try {
      const email = dto.email.toLowerCase().trim();
      if (await this.users.exists({ where: { email } })) {
        throw new ConflictException('Email is already registered');
      }

      const user = this.users.create({
        name: dto.name.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
      });

      const saved = await this.users.save(user);
      const payload = {
        user: { id: saved.id, name: saved.name, email: saved.email },
        accessToken: await this.sign(saved),
      };

      return buildSuccessResponse(payload, 'User registered successfully', 201);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException('Email is already registered');
      }

      if (error instanceof ConflictException) {
        throw error;
      }

      throwHttpError(error, 'Unable to register user');
      return Promise.reject(error);
    }
  };

  login = async (dto: LoginDto): Promise<ApiResponse<{ user: { id: string; name: string; email: string }; accessToken: string }>> => {
    try {
      const user = await this.users
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email: dto.email.toLowerCase().trim() })
        .getOne();

      if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        user: { id: user.id, name: user.name, email: user.email },
        accessToken: await this.sign(user),
      };

      return buildSuccessResponse(payload, 'Login successful');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throwHttpError(error, 'Unable to login');
      return Promise.reject(error);
    }
  };

  private sign(user: User) {
    return this.jwt.signAsync({ sub: user.id, email: user.email });
  }
}
