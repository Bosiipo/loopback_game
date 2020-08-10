import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  Getter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {MyAuthBindings} from '../authorization/keys';
import {PermissionKey} from '../authorization/permission-key';
import {JWTService} from '../authorization/services/JWT.service';
import {
  Credential,
  CredentialsRequestBody,
  MyUserProfile,
  UserProfileSchema,
  UserRequestBody,
} from '../authorization/types';
import {Character} from '../models';
import {CharacterRepository} from '../repositories';

export class CharacterController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
    @inject(MyAuthBindings.TOKEN_SERVICE)
    public jwtService: JWTService,
    @inject.getter(AuthenticationBindings.CURRENT_USER)
    public getCurrentUser: Getter<MyUserProfile>,
  ) {}

  @post('/characters', {
    responses: {
      '200': {
        description: 'Character model instance',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  async create(
    @requestBody(UserRequestBody) character: Character,
  ): Promise<Character> {
    character.permissions = [
      PermissionKey.ViewOwnUser,
      PermissionKey.CreateUser,
      PermissionKey.UpdateOwnUser,
      PermissionKey.DeleteOwnUser,
    ];
    if (await this.characterRepository.exists(character.email)) {
      throw new HttpErrors.BadRequest(`This email already exists`);
    } else {
      const savedCharacter = await this.characterRepository.create(character);
      delete savedCharacter.password;
      return savedCharacter;
    }
  }

  @post('/characters/login', {
    responses: {
      '200': {
        description: 'Token',
        content: {},
      },
    },
  })
  async login(
    @requestBody(CredentialsRequestBody) credential: Credential,
  ): Promise<{token: string}> {
    const token = await this.jwtService.getToken(credential);
    return {token};
  }

  @get('/characters/me', {
    responses: {
      '200': {
        description: 'The current user profile',
        content: {
          'application/json': {
            schema: UserProfileSchema,
          },
        },
      },
    },
  })
  @authenticate('jwt', {required: [PermissionKey.ViewOwnUser]})
  async printCurrentUser(): Promise<MyUserProfile> {
    return await this.getCurrentUser();
  }

  @get('/characters/count', {
    responses: {
      '200': {
        description: 'Character model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Character) where?: Where<Character>,
  ): Promise<Count> {
    return this.characterRepository.count(where);
  }

  @get('/characters', {
    responses: {
      '200': {
        description: 'Array of Character model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Character, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Character) filter?: Filter<Character>,
  ): Promise<Character[]> {
    return this.characterRepository.find(filter);
  }

  @patch('/characters', {
    responses: {
      '200': {
        description: 'Character PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Character, {partial: true}),
        },
      },
    })
    character: Character,
    @param.where(Character) where?: Where<Character>,
  ): Promise<Count> {
    return this.characterRepository.updateAll(character, where);
  }

  @get('/characters/{id}', {
    responses: {
      '200': {
        description: 'Character model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Character, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Character, {exclude: 'where'})
    filter?: FilterExcludingWhere<Character>,
  ): Promise<Character> {
    return this.characterRepository.findById(id, filter);
  }

  @patch('/characters/{id}', {
    responses: {
      '204': {
        description: 'Character PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Character, {partial: true}),
        },
      },
    })
    character: Character,
  ): Promise<void> {
    await this.characterRepository.updateById(id, character);
  }

  @put('/characters/{id}', {
    responses: {
      '204': {
        description: 'Character PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() character: Character,
  ): Promise<void> {
    await this.characterRepository.replaceById(id, character);
  }

  @del('/characters/{id}', {
    responses: {
      '204': {
        description: 'Character DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    // Delete weapon armor and skill
    await this.characterRepository.weapon(id).delete();
    await this.characterRepository.armor(id).delete();
    await this.characterRepository.skill(id).delete();

    // Delete character itself
    await this.characterRepository.deleteById(id);
  }

  // ADMIN!!!
}
