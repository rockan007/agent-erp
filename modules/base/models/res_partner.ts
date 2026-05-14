import { Model, model, fields, api } from '@erp/domain';

@model({ _name: 'res.partner', _description: 'Partner (Customer/Supplier)' })
export class ResPartner extends Model {
  @fields.char({ required: true })
  name!: string;

  @fields.selection([
    ['company', 'Company'],
    ['individual', 'Individual'],
  ], { default: 'company' })
  company_type!: string;

  @fields.char({})
  email!: string;

  @fields.char({ mask: 'phone' })
  phone!: string;

  @fields.char({})
  website!: string;

  @fields.text({})
  comment!: string;

  @fields.boolean({ default: true })
  active!: boolean;

  @fields.char({})
  vat!: string;

  @fields.many2one({ comodel: 'res.users' })
  user_id!: number;

  @api.constrains({ message: 'Email must be valid' })
  _check_email(): void {
    // Constraint logic placeholder
  }
}
