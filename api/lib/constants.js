const bucketPrefix = `filbert-${process.env.NODE_ENV || "dev"}-mysqlbackups`;

module.exports = {
  fileUploadStagingDirectory: "/tmp/filbert-mysql-backups",
  hourlyBucketName: `${bucketPrefix}-hourly`,
  dailyBucketName: `${bucketPrefix}-daily`,
  adhocBucketName: "filbert-mysql-backups"
};
