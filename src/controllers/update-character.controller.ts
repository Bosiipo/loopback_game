import {Filter, repository} from '@loopback/repository';
import {param, patch, requestBody} from '@loopback/rest';
import {Armor, Character, Weapon} from '../models';
// import {Armor, Weapon, Skill} from '../models';
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
    let char: Character = this.characterRepository.findById(id);
    char.attack! += armor.attack;
    char.defence! += armor.defence;

    let filter: Filter = {where: {characterId: id}};
    if ((await this.armorRepository.find(filter))[0] !== undefined) {
      char.attack! -= armor.attack;
      char.defence! -= armor.defence;
      await this.characterRepository.armor(id).delete();
    }
    await await this.characterRepository.updateById(id, char);
    return await this.characterRepository.armor(id).create(armor);
  }
}
