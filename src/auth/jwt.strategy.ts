import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/entities/user.entities';
import { json } from 'stream/consumers';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload) {
    const { userId, user_id } = payload;
    const id = userId == undefined ? user_id : userId;
    if(id == undefined) {
        throw new UnauthorizedException();
    }

    const user: User = await this.userRepository.findOneBy({
      user_id: id,
    });

    if (user == null) {
      throw new UnauthorizedException();
    }
    
    return user;
  }
}
