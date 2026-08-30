import * as bcrypt from 'bcrypt';

export async function hashPassword(plainText: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainText, saltRounds);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}
