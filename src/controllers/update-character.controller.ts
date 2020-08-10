import {Filter, repository} from '@loopback/repository';
import {del, get, param, patch, requestBody} from '@loopback/rest';
import {Armor, Character, Skill, Weapon} from '../models';
import {
  ArmorRepository,
  CharacterRepository,
  SkillRepository,
  WeaponRepository,
} from '../repositories';

export class UpdateCharacterController {
  constructor(
    @repository(CharacterRepository)
    public characterRepository: CharacterRepository,
    @repository(WeaponRepository)
    public weaponRepository: WeaponRepository,
    @repository(ArmorRepository)
    public armorRepository: ArmorRepository,
    @repository(SkillRepository)
    public skillRepository: SkillRepository,
  ) {}

  @patch('/updatecharacter/{id}/weapon', {
    responses: {
      '200': {
        description: 'Update weapon',
        content: {
          'application/json': {
            schema: Weapon,
          },
        },
      },
    },
  })
  async updateWeapon(
    @param.path.string('id') id: string,
    @requestBody() weapon: Weapon,
  ): Promise<Weapon> {
    // Equip new weapon
    let char: Character = await this.characterRepository.findById(id);
    char.attack! += weapon.attack;
    char.defence! += weapon.defence;

    // unequip old weapon
    let filter: Filter = {where: {characterId: id}};
    // Does the weaponRepository have any weapon that belongs to this character?? ==> id
    if ((await this.weaponRepository.find(filter))[0] != undefined) {
      // If so ==> Go down low!
      // id specifies the weapon that belongs to that particular character
      // id used below:::: await this.characterRepository.weapon(id).get()::::
      // references ==> public weapon: HasOneRepositoryFactory<Weapon, typeof Character.prototype.id>;
      // in character.repository.ts that grabs the "Weapon" whose characterId matches the primary key of
      // that particular "character" instance

      let oldWeapon: Weapon = await this.characterRepository.weapon(id).get();
      char.attack! -= oldWeapon.attack;
      char.defence! -= oldWeapon.defence;
      await this.characterRepository.weapon(id).delete();
    }
    // Update the new character details
    await this.characterRepository.updateById(id, char);
    // Save the new weapon relationship to the character model
    return await this.characterRepository.weapon(id).create(weapon);
  }

  @patch('/updatecharacter/{id}/armor', {
    responses: {
      '200': {
        description: 'Update armor',
        content: {
          'application/json': {
            schema: Armor,
          },
        },
      },
    },
  })
  async updateArmor(
    @param.path.string('id') id: string,
    @requestBody() armor: Armor,
  ): Promise<Armor> {
    // Find character first,
    // Update his attack and defence to that of the armor from requestBody
    // Find if there's an old armor: Unattach it and delete it if it exists
    // Finally, update character model in db
    // Then save new character-armor relationship
    let char: Character = await this.characterRepository.findById(id);
    char.attack! += armor.attack;
    char.defence! += armor.defence;

    let filter: Filter = {where: {characterId: id}};
    if ((await this.armorRepository.find(filter))[0] != undefined) {
      char.attack! -= armor.attack;
      char.defence! -= armor.defence;
      await this.characterRepository.armor(id).delete();
    }
    await this.characterRepository.updateById(id, char);
    return await this.characterRepository.armor(id).create(armor);
  }

  @patch('/updatecharacter/{id}/skill', {
    responses: {
      '200': {
        description: 'Update Skill',
        content: {
          'application/json': {
            schema: Skill,
          },
        },
      },
    },
  })
  async updateSkill(
    @param.path.string('id') id: string,
    @requestBody() skill: Skill,
  ): Promise<Skill> {
    await this.characterRepository.skill(id).delete();
    return this.characterRepository.skill(id).create(skill);
  }

  @del('/updatecharacter/{id}/weapon', {
    responses: {
      '204': {
        description: 'DELETE weapon',
      },
    },
  })
  async deleteWeapon(@param.path.string('id') id: string): Promise<void> {
    let filter: Filter = {where: {characterId: id}};
    if ((await this.weaponRepository.find(filter))[0] != undefined) {
      let oldWeapon: Weapon = await this.characterRepository.weapon(id).get();
      let char: Character = await this.characterRepository.findById(id);
      char.attack! -= oldWeapon.attack!;
      char.defence! -= oldWeapon.defence!;
      await this.characterRepository.weapon(id).delete();
      await this.characterRepository.updateById(id, char);
    }
  }

  @del('/updatecharacter/{id}/armor', {
    responses: {
      '204': {
        description: 'DELETE armor',
      },
    },
  })
  async deleteArmor(@param.path.string('id') id: string): Promise<void> {
    let filter: Filter = {where: {characterId: id}};
    if ((await this.armorRepository.find(filter))[0] != undefined) {
      let oldArmor: Armor = await this.characterRepository.armor(id).get();
      let char: Character = await this.characterRepository.findById(id);
      char.attack! -= oldArmor.attack!;
      char.defence! -= oldArmor.defence!;
      await this.characterRepository.armor(id).delete();
      await this.characterRepository.updateById(id, char);
    }
  }

  @del('/updatecharacter/{id}/skill', {
    responses: {
      '204': {
        description: 'DELETE skill',
      },
    },
  })
  async deleteSkill(@param.path.string('id') id: string): Promise<void> {
    await this.characterRepository.skill(id).delete();
  }

  @patch('/updatecharacter/{id}/levelup', {
    responses: {
      '200': {
        description: 'level up',
        content: {
          'application/json': {
            schema: Character,
          },
        },
      },
    },
  })
  async levelUp(@param.path.string('id') id: string): Promise<Character> {
    let char: Character = await this.characterRepository.findById(id);
    let levels: number = 0;
    while (char.currentExp! >= char.nextLevelExp!) {
      levels++;
      char.currentExp! -= char.nextLevelExp!;
      char.nextLevelExp! += 100;
    }
    char.level! += levels;
    char.maxHealth! += 10 * levels;
    char.currentHealth! = char.maxHealth!;
    char.maxMana! += 5 * levels;
    char.currentMana! = char.maxMana!;
    char.attack! += 3 * levels;
    char.defence! += levels;
    await this.characterRepository!.updateById(id, char);
    return char;
  }

  @get('/updatecharacter/{id}', {
    responses: {
      '200': {
        description: 'armor, weapon, and skill info',
        content: {},
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<any[]> {
    let res: any[] = ['no weapon', 'no armor', 'no skill'];

    let filter: Filter = {where: {characterId: id}};
    if ((await this.weaponRepository.find(filter))[0] != undefined) {
      res[0] = await this.characterRepository.weapon(id).get();
    }
    if ((await this.armorRepository.find(filter))[0] != undefined) {
      res[1] = await this.characterRepository.armor(id).get();
    }
    if ((await this.skillRepository.find(filter))[0] != undefined) {
      res[2] = await this.characterRepository.skill(id).get();
    }
    return res;
  }
}
