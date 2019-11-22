# database
CREATE DATABASE `filbert` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci */;
USE `filbert`;
# tables
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(45) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `password` char(60) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`) USING BTREE,
  UNIQUE KEY `email_UNIQUE` (`email`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
CREATE TABLE `content_node` (
  `post_id` int(11) NOT NULL,
  `id` char(4) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `parent_id` char(4) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `position` int(11) NOT NULL,
  `type` varchar(45) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `meta` json NOT NULL,
  PRIMARY KEY (`post_id`,`id`)
  KEY `type` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
CREATE TABLE `image` (
  `user_id` int(11) NOT NULL,
  `id` char(128) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `encoding` varchar(45) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL,
  `file_data` mediumblob NOT NULL,
  PRIMARY KEY (`user_id`,`id`),
  CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
CREATE TABLE `post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `canonical` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `title` text COLLATE utf8mb4_unicode_520_ci,
  `abstract` text COLLATE utf8mb4_unicode_520_ci,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published` datetime DEFAULT NULL,
  `deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id_fk_idx` (`user_id`),
  CONSTRAINT `user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=196 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

