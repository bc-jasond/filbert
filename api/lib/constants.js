const bucketPrefix = `filbert-${process.env.NODE_ENV || 'dev'}-mysqlbackups`;

module.exports = {
  fileUploadStagingDirectory: '/tmp/filbert-mysql-backups',
  hourlyBucketName: `${bucketPrefix}-hourly`,
  dailyBucketName: `${bucketPrefix}-daily`,
  monthlyBucketName: `${bucketPrefix}-monthly`,
  adhocBucketName: 'filbert-mysql-backups',
  imageBucketName: 'filbert-images',
  objectStorageRegion: 'us-east-1',
  objectStorageApiVersion: '2006-03-01',
  objectStorageBaseUrl: 'us-east-1.linodeobjects.com',
  objectStorageACLPublic: 'public-read',
  objectStorageACLPrivate: 'private',
};
