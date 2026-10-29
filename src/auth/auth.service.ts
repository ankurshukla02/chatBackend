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
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.users.exists({ where: { email } }))
      throw new ConflictException('Email is already registered');
    const user = this.users.create({
      name: dto.name.trim(),
      email,
      passwordHash: await bcrypt.hash(dto.password, 12),
    });
    try {
      const saved = await this.users.save(user);
      return {
        user: { id: saved.id, name: saved.name, email: saved.email },
        accessToken: await this.sign(saved),
      };
    } catch (error) {
      // The unique index is authoritative under concurrent registration requests.
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }
  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email.toLowerCase().trim() })
      .getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Invalid email or password');
    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken: await this.sign(user),
    };
  }
  private sign(user: User) {
    return this.jwt.signAsync({ sub: user.id, email: user.email });
  }
}
