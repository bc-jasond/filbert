import bcrypt from 'bcrypt';

export async function checkPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function getPasswordHash(password) {
  return bcrypt.hash(password, 10);
}
