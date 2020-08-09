import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {Character} from '../models';
import {CharacterRepository} from '../repositories';

export class CharacterController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
  ) {}

  @post('/characters', {
    responses: {
      '200': {
        description: 'Character model instance',
        content: {'application/json': {schema: {'x-ts-type': Character}}},
      },
    },
  })
  async create(@requestBody() character: Character): Promise<Character> {
    // //add following lines
    // let characterId = 1;
    // while (await this.characterRepository.exists(characterId)) {
    //   characterId++;
    // }
    // character.id = characterId;
    //add above lines
    return await this.characterRepository.create(character);
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
    await this.characterRepository.deleteById(id);
  }
}
