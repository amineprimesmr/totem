import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserRole } from '@totem/database';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    name: string | null;
    candidateId?: string;
    companyId?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<string, { count: number; firstAttemptAt: number; blockedUntil?: number }>();
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly MAX_ATTEMPTS = 10;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const now = Date.now();
    const key = email.toLowerCase().trim();
    const attempt = this.loginAttempts.get(key);
    if (attempt?.blockedUntil && now < attempt.blockedUntil) {
      throw new UnauthorizedException('Trop de tentatives. Réessayez plus tard.');
    }

    const user = await this.validateUser(email, password);
    if (!user) {
      const current = this.loginAttempts.get(key);
      if (!current || now - current.firstAttemptAt > this.WINDOW_MS) {
        this.loginAttempts.set(key, { count: 1, firstAttemptAt: now });
      } else {
        const next = { ...current, count: current.count + 1 };
        if (next.count >= this.MAX_ATTEMPTS) {
          next.blockedUntil = now + this.WINDOW_MS;
        }
        this.loginAttempts.set(key, next);
      }
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    this.loginAttempts.delete(key);
    if (user.role === 'CANDIDATE' || user.role === 'COMPANY') {
      throw new UnauthorizedException('Accès réservé à l\'équipe Totem. Cet outil est interne à l\'école.');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const full = await this.usersService.findOne(user.id);
    return {
      access_token,
      user: {
        id: full.id,
        email: full.email,
        role: full.role,
        name: full.name,
        candidateId: full.candidate?.id,
        companyId: full.company?.id,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
    candidate?: { firstName: string; lastName: string; phone?: string; formation: string; city: string; postalCode?: string; sectors?: string[]; desiredJob?: string[]; contractType?: string; searchRadiusKm?: number };
    company?: { name: string; sector: string; address: string; city: string; postalCode?: string; phone?: string };
  }): Promise<AuthResponse> {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      email: data.email,
      password: hashed,
      name: data.name,
      role: data.role,
      candidate: data.candidate,
      company: data.company,
    });
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const full = await this.usersService.findOne(user.id);
    return {
      access_token,
      user: {
        id: full.id,
        email: full.email,
        role: full.role,
        name: full.name,
        candidateId: full.candidate?.id,
        companyId: full.company?.id,
      },
    };
  }
}
