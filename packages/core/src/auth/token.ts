import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'erp-dev-secret';
const EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: number;
  groups: string[];
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, SECRET);

  if (typeof decoded === 'string' || decoded == null) {
    throw new Error('Invalid token payload');
  }

  const payload = decoded as Record<string, unknown>;

  if (typeof payload.userId !== 'number' || !Array.isArray(payload.groups)) {
    throw new Error('Invalid token payload: missing userId or groups');
  }

  return { userId: payload.userId, groups: payload.groups as string[] };
}
