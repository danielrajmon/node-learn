import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateOAuthUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      user = this.userRepository.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        isAdmin: false,
      });
      await this.userRepository.save(user);
    } else {
      user.email = profile.email;
      user.name = profile.name;
      user.picture = profile.picture;
      await this.userRepository.save(user);
    }

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        isAdmin: user.isAdmin,
      },
    };
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }
}
