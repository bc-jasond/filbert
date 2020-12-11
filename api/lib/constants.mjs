const bucketPrefix = `filbert-${process.env.NODE_ENV || 'dev'}-mysqlbackups`;

export const fileUploadStagingDirectory = '/tmp/filbert-mysql-backups';
export const hourlyBucketName = `${bucketPrefix}-hourly`;
export const dailyBucketName = `${bucketPrefix}-daily`;
export const monthlyBucketName = `${bucketPrefix}-monthly`;
export const adhocBucketName = 'filbert-mysql-backups';
export const imageBucketName = 'filbert-images';
export const objectStorageRegion = 'us-east-1';
export const objectStorageApiVersion = '2006-03-01';
export const objectStorageBaseUrl = 'us-east-1.linodeobjects.com';
export const objectStorageACLPublic = 'public-read';
export const objectStorageACLPrivate = 'private';
