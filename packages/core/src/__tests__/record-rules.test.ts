import { describe, it, expect, beforeEach } from 'vitest';
import { RecordRuleRegistry } from '../security/record-rules';

describe('RecordRuleRegistry', () => {
  let rr: RecordRuleRegistry;

  beforeEach(() => {
    rr = new RecordRuleRegistry();
    rr.register([
      {
        name: 'own_orders',
        model: 'sale.order',
        group: 'sales_user',
        domain: [['user_id', '=', '$uid']],
        perm: { read: true, write: true, create: true, unlink: false },
      },
    ]);
  });

  it('should return domain for matching operation', () => {
    const domains = rr.getDomain('sale.order', 'read', ['sales_user'], 42);
    expect(domains).toHaveLength(1);
    expect(domains[0]![0]![2]).toBe(42); // $uid replaced
  });

  it('should return empty for non-matching group', () => {
    const domains = rr.getDomain(
      'sale.order',
      'read',
      ['other_group'],
      42,
    );
    expect(domains).toHaveLength(0);
  });

  it('should return empty for denied operation', () => {
    const domains = rr.getDomain(
      'sale.order',
      'unlink',
      ['sales_user'],
      42,
    );
    expect(domains).toHaveLength(0);
  });
});
