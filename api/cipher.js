const crypto = require('crypto');
const ENCRYPTION_KEY = '941c6c9eba97c0bfb50c3d678ba81f9d'; // TODO: process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('base64') + ':' + encrypted.toString('base64');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = new Buffer.from(textParts.shift(), 'base64');
  let encryptedText = new Buffer.from(textParts.join(':'), 'base64');
  let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { decrypt, encrypt };
