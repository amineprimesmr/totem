import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Connexion' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('register')
  @ApiOperation({ summary: 'Inscription désactivée (staff-only)' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    throw new ForbiddenException('Inscription publique désactivée. Création des comptes via administration Totem.');
  }
}
