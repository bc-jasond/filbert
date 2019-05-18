const crypto = require('crypto');

class Safe {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    // Needs to be 16 character long
    // TODO: this iv can be generated on every call to encrypt() and prepended to the cipher with a colon
    this.iv = '3Jiuihn6bsdF9iD8';
    // Needs to be 32 character long
    this.key = 'fGfctjV37dbStFfaXd672kKb8WbmAgee';
  }

  async encrypt(data) {
    try {
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.key,
        this.iv,
      );
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return encrypted.toString('utf8');
    } catch (err) {
      throw err;
    }
  }

  async decrypt(encrypted) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        this.iv,
      );
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(JSON.stringify(decrypted.toString()));
    } catch (err) {
      throw err;
    }
  }
}

module.exports.Safe = Safe;
