import { Model, model, fields } from '@erp/domain';

@model({ _name: 'res.groups', _description: 'User Group / Role' })
export class ResGroups extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.text({})
  description!: string;
}
