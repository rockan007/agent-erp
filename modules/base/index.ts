import { ResPartner } from './models/res_partner';
import { ResUsers } from './models/res_users';
import { partnerForm } from './views/res_partner.form';
import { partnerTree } from './views/res_partner.tree';
import { partnerSearch } from './views/res_partner.search';
import { baseMenus } from './views/menus';
import { PartnerController } from './controllers/partner_controller';
import { baseAcl } from './security/acl';

export const models = [ResPartner, ResUsers];
export const views = [partnerForm, partnerTree, partnerSearch];
export const menus = baseMenus;
export const controllers = [PartnerController];
export const security = baseAcl;
