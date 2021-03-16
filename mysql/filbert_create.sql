# database
CREATE DATABASE `filbert` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci */;
USE `filbert`;
# tables
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(45) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `password` char(60) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` datetime DEFAULT NULL,
  `given_name` varchar(200) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `family_name` varchar(200) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `picture_url` varchar(500) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `iss` varchar(200) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `is_public` tinyint(4) DEFAULT '0',
  `show_stats` tinyint(4) DEFAULT '0',
  `meta` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`) USING BTREE,
  UNIQUE KEY `email_UNIQUE` (`email`) USING BTREE,
  KEY `is_public` (`is_public`),
  KEY `deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
CREATE TABLE `post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `canonical` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `title` text COLLATE utf8mb4_unicode_520_ci,
  `abstract` text COLLATE utf8mb4_unicode_520_ci,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `published` datetime DEFAULT NULL,
  `deleted` datetime DEFAULT NULL,
  `meta` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `canonical_UNIQUE` (`canonical`),
  KEY `user_id_fk_idx` (`user_id`),
  KEY `published` (`published`),
  KEY `deleted` (`deleted`),
  FULLTEXT KEY `title_abstract` (`title`,`abstract`),
  CONSTRAINT `user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
CREATE TABLE `content_node_history` (
  `post_id` int(11) NOT NULL,
  `content_node_history_id` int(11) unsigned NOT NULL,
  `meta` json DEFAULT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted` datetime DEFAULT NULL,
  PRIMARY KEY (`post_id`,`content_node_history_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
