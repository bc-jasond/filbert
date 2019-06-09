const bcrypt = require('bcrypt');

module.exports.checkPassword = async function main(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports.getPasswordHash = async function getPasswordHash(password) {
  return bcrypt.hash(password, 10)
}

