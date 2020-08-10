import {authenticate} from '@loopback/authentication';
import {Filter, repository} from '@loopback/repository';
import {
  get,
  getFilterSchemaFor,
  HttpErrors,
  param,
  post,
  requestBody,
} from '@loopback/rest';
import {PermissionKey} from '../authorization/permission-key';
import {Character} from '../models';
import {CharacterRepository} from '../repositories';

export class AdminController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
  ) {}

  @post('/admin', {
    responses: {
      '200': {
        description: 'create admin',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  async create(
    @param.query.string('admin_code') admin_code: string,
    @requestBody() character: Character,
  ): Promise<Character> {
    if (admin_code != '901029') {
      throw new HttpErrors.Forbidden('WRONG_ADMIN_CODE');
    }

    character.permissions = [
      PermissionKey.ViewOwnUser,
      PermissionKey.CreateUser,
      PermissionKey.UpdateOwnUser,
      PermissionKey.DeleteOwnUser,
      PermissionKey.UpdateAnyUser,
      PermissionKey.ViewAnyUser,
      PermissionKey.DeleteAnyUser,
    ];
    if (await this.characterRepository.exists(character.email)) {
      throw new HttpErrors.BadRequest(`This email already exists`);
    } else {
      const savedCharacter = await this.characterRepository.create(character);
      delete savedCharacter.password;
      return savedCharacter;
    }
  }

  @get('/admin/characters', {
    responses: {
      '200': {
        description: 'Array of Character model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': Character}},
          },
        },
      },
    },
  })
  @authenticate('jwt', {required: [PermissionKey.ViewAnyUser]})
  async find(
    @param.query.object('filter', getFilterSchemaFor(Character))
    filter?: Filter,
  ): Promise<Character[]> {
    return await this.characterRepository.find(filter);
  }
}
