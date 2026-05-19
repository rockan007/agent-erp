export type MaskPattern = 'phone' | 'email' | 'id_card';

const maskers: Record<MaskPattern, (value: string) => string> = {
  phone: (v) => {
    if (v.length < 7) return v;
    return `${v.slice(0, 3)  }****${  v.slice(-4)}`;
  },
  email: (v) => {
    const [local, domain] = v.split('@');
    if (!domain) return v;
    const masked =
      local!.length > 2
        ? `${local![0]  }***${  local![local!.length - 1]}`
        : local!;
    return `${masked  }@${  domain}`;
  },
  id_card: (v) => {
    if (v.length < 8) return v;
    return `${v.slice(0, 4)  }**********${  v.slice(-4)}`;
  },
};

export function maskValue(value: string, pattern: MaskPattern): string {
  const masker = maskers[pattern];
  return masker ? masker(value) : value;
}

export function maskRecord(
  record: Record<string, unknown>,
  maskedFields: Record<string, MaskPattern>,
): Record<string, unknown> {
  const result = { ...record };
  for (const [field, pattern] of Object.entries(maskedFields)) {
    if (typeof result[field] === 'string') {
      result[field] = maskValue(result[field] as string, pattern);
    }
  }
  return result;
}
