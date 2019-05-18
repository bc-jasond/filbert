// CREATE TABLE `post` (
//   `id` int(11) NOT NULL AUTO_INCREMENT,
//   `user_id` int(11) NOT NULL,
//   `data` json DEFAULT NULL,
//   `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   `deleted` datetime DEFAULT NULL,
//   `published` datetime DEFAULT NULL,
//   PRIMARY KEY (`id`),
//   KEY `FK_user_id_idx` (`user_id`),
//   CONSTRAINT `FK_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
