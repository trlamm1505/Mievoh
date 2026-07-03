import { Injectable } from '@nestjs/common';
import { ACCESS_TOKEN_SECRET } from '../../common/constant/app.constant';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TokenService {
  // tạo token without password
  createTokens(user: any) {
    const { password, ...userWithoutPassword } = user;
    const accessToken = jwt.sign(
      userWithoutPassword,
      ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: '1d',
      },
    );
    return {
      accessToken: accessToken,
    };
  }
  // verify token
  verifyAccessToken(accessToken: string, options?: jwt.VerifyOptions) {
    const decode = jwt.verify(
      accessToken,
      ACCESS_TOKEN_SECRET as string,
      options,
    );
    return decode;
  }
}
