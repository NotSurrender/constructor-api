import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { decode } from 'jsonwebtoken';

export const UserId = createParamDecorator(
  (key: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing required Authorization header');
    }

    const decodedTokenData = decode(authHeader.substring(7));

    if (typeof decodedTokenData !== 'object') {
      throw new UnauthorizedException('Error during decoding token');
    }

    return decodedTokenData.id;
  },
);
