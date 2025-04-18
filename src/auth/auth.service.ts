import { Injectable, UnauthorizedException } from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"
import type { ConfigService } from "@nestjs/config"
import type { UsersService } from "../users/users.service"
import type { RegisterDto } from "./dto/register.dto"

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email)
      const isPasswordValid = await user.validatePassword(password)

      if (isPasswordValid) {
        const { password, refreshToken, ...result } = user
        return result
      }

      return null
    } catch (error) {
      return null
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwtSecret"),
        expiresIn: "7d",
      }),
    ])

    await this.usersService.setRefreshToken(user.id, refreshToken)

    return {
      accessToken,
      refreshToken,
    }
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto)
    const { password, refreshToken, ...result } = user
    return result
  }

  async refreshToken(userId: string, refreshToken: string) {
    try {
      const user = await this.usersService.findOne(userId)

      if (!user.refreshToken) {
        throw new UnauthorizedException("Refresh token not found")
      }

      const isRefreshTokenValid = user.refreshToken === refreshToken

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException("Invalid refresh token")
      }

      const payload = { email: user.email, sub: user.id, role: user.role }

      return {
        accessToken: this.jwtService.sign(payload),
      }
    } catch (error) {
      throw new UnauthorizedException("Invalid token")
    }
  }

  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null)
    return { message: "Logout successful" }
  }
}
