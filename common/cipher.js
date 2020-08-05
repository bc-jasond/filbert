const { performance } = require('perf_hooks');
const crypto = require('crypto');
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv(
    'aes-256-cbc',
    new Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('base64') + ':' + encrypted.toString('base64');
}

export function decrypt(text) {
  let textParts = text.split(':');
  let iv = new Buffer.from(textParts.shift(), 'base64');
  let encryptedText = new Buffer.from(textParts.join(':'), 'base64');
  let decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    new Buffer.from(ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function getChecksum(buffer) {
  const startTime = performance.now();
  console.log(`starting sha256 on Buffer of size ${buffer.length} bytes...`);
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  const hexDigest = hash.digest('hex');
  console.log(
    `finished sha256 hash. Took ${
      (performance.now() - startTime) / 1000
    } seconds.\n`
  );
  return hexDigest;
}
