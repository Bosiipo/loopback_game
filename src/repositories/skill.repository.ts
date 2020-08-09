import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {CharacterRepository} from '.';
import {MongoDataSource} from '../datasources';
import {Character, Skill, SkillRelations} from '../models';

export class SkillRepository extends DefaultCrudRepository<
  Skill,
  typeof Skill.prototype.id,
  SkillRelations
> {
  public readonly character: BelongsToAccessor<
    Character,
    typeof Skill.prototype.id
  >;
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter('CharacterRepository')
    protected characterRepositoryGetter: Getter<CharacterRepository>,
  ) {
    super(Skill, dataSource);
    this.character = this.createBelongsToAccessorFor(
      'character',
      characterRepositoryGetter,
    );
  }
}
