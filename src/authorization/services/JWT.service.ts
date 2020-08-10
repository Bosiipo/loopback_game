import {TokenService} from '@loopback/authentication';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {toJSON} from '@loopback/testlab';
import * as _ from 'lodash';
import {promisify} from 'util';
import {CharacterRepository} from '../../repositories';
import {TokenServiceConstants} from '../keys';
import {Credential, MyUserProfile} from '../types';

const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

export class JWTService implements TokenService {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
  ) {}

  async verifyToken(token: string): Promise<MyUserProfile> {
    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token : 'token' is null`,
      );
    }

    const decryptedToken = await verifyAsync(
      token,
      TokenServiceConstants.TOKEN_SECRET_VALUE,
    );
    let userProfile = _.pick(decryptedToken, [
      'id',
      'email',
      'name',
      `permissions`,
    ]);
    return userProfile;
  }

  async generateToken(userProfile: MyUserProfile): Promise<string> {
    const token = await signAsync(
      userProfile,
      TokenServiceConstants.TOKEN_SECRET_VALUE,
      {
        expiresIn: TokenServiceConstants.TOKEN_EXPIRES_IN_VALUE,
      },
    );

    return token;
  }

  async getToken(credential: Credential): Promise<string> {
    const foundUser = await this.characterRepository.findOne({
      where: {email: credential.email},
    });
    if (!foundUser) {
      throw new HttpErrors['NotFound'](
        `User with email ${credential.email} not found.`,
      );
    }

    if (credential.password != foundUser.password) {
      throw new HttpErrors.Unauthorized('The credentials are not correct.');
    }
    const currentUser: MyUserProfile = _.pick(toJSON(foundUser), [
      'email',
      'name',
      'permissions',
    ]) as MyUserProfile;
    const token = await this.generateToken(currentUser);
    return token;
  }
}
