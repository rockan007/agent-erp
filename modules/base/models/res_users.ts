import { Model, model, fields } from '@erp/domain';

@model({ _name: 'res.users', _description: 'User' })
export class ResUsers extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.char({ required: true })
  login!: string;

  @fields.char({})
  password!: string;

  @fields.char({})
  email!: string;

  @fields.boolean({ default: true })
  active!: boolean;

  @fields.many2many({
    comodel: 'res.groups',
    table: 'res_users_groups_rel',
    column1: 'user_id',
    column2: 'group_id',
  })
  groups!: number[];
}
