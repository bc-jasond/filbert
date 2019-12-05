INSERT INTO `dubaniewicz`.`user`
(username,email,password)
VALUES
("jason",
"jasondebo@gmail.com",
"$2b$10$pnlAyQKYxOifRZBErp6LEesSq/iMPCZGjUrDIPLl.u8wgqaq7rCje");

SELECT `id`,
    `username`,
    `email`,
    `password`,
    `created`,
    `deleted`
FROM `dubaniewicz`.`user`;
