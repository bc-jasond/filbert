// CREATE TABLE `user` (
//   `id` int(11) NOT NULL AUTO_INCREMENT,
//   `username` varchar(45) COLLATE utf8mb4_unicode_520_ci NOT NULL,
//   `email` varchar(150) COLLATE utf8mb4_unicode_520_ci NOT NULL,
//   `password` char(60) COLLATE utf8mb4_unicode_520_ci NOT NULL,
//   `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   `deleted` datetime DEFAULT NULL,
//   PRIMARY KEY (`id`),
//   UNIQUE KEY `username_UNIQUE` (`username`) USING BTREE,
//   UNIQUE KEY `email_UNIQUE` (`email`) USING BTREE
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

const bcrypt = require('bcrypt');

module.exports.checkPassword = async function main(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports.getPasswordHash = async function getPasswordHash(password) {
  return bcrypt.hash(password, 10)
}

