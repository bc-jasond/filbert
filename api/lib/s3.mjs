import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import {
  objectStorageRegion,
  objectStorageApiVersion,
  objectStorageBaseUrl,
  objectStorageACLPublic,
  objectStorageACLPrivate,
  fileUploadStagingDirectory,
} from './constants.mjs';

const s3Client = new AWS.S3({
  region: objectStorageRegion,
  endpoint: objectStorageBaseUrl,
  apiVersion: objectStorageApiVersion,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY,
  }),
});

export const listBuckets = promisify(s3Client.listBuckets).bind(s3Client);
export const headBucket = promisify(s3Client.headBucket).bind(s3Client);
export const createBucket = promisify(s3Client.createBucket).bind(s3Client);
export const upload = promisify(s3Client.upload).bind(s3Client);
export const listObjects = promisify(s3Client.listObjectsV2).bind(s3Client);
export const getObject = promisify(s3Client.getObject).bind(s3Client);
export const headObject = promisify(s3Client.headObject).bind(s3Client);
export const deleteObjects = promisify(s3Client.deleteObjects).bind(s3Client);
export const copyObject = promisify(s3Client.copyObject).bind(s3Client);

/**
 * creates a bucket if it doesn't exist
 */
export async function assertBucket(name) {
  try {
    await headBucket({ Bucket: name });
    return true;
  } catch (err) {
    // check err.statusCode === 404
  }
  // bucket doesn't exist - create it
  return createBucket({ Bucket: name });
}

export async function downloadFileFromBucket(bucket, filename) {
  const { Body } = await getObject({ Bucket: bucket, Key: filename });
  return new Promise((resolve, reject) =>
    fs.writeFile(
      path.join(fileUploadStagingDirectory, filename),
      Body,
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(path.join(fileUploadStagingDirectory, filename));
      }
    )
  );
}

export async function uploadFileToBucket(bucket, fileNameWithAbsolutePath) {
  const fileStream = fs.createReadStream(fileNameWithAbsolutePath);
  fileStream.on('error', (err) => {
    console.log('uploadFileToBucket - File Error', err);
  });
  // call S3 to retrieve upload file to specified bucket
  return upload({
    Bucket: bucket,
    Body: fileStream,
    Key: path.basename(fileNameWithAbsolutePath),
  });
}

export async function uploadImageToBucket(
  bucket,
  key,
  buffer,
  metadata,
  isPublic = false
) {
  return upload({
    Bucket: bucket,
    Body: buffer,
    Key: key,
    Metadata: metadata,
    ACL: isPublic ? objectStorageACLPublic : objectStorageACLPrivate,
  });
}

export async function listKeysForBucket(
  bucket,
  { sortOrder } = { sortOrder: 'desc' }
) {
  const response = await listObjects({ Bucket: bucket });
  const comparisonFn =
    sortOrder === 'desc'
      ? (a, b) => (a > b ? -1 : 1)
      : (a, b) => (a > b ? 1 : -1);

  if (response.IsTruncated) {
    console.warn(
      'listKeysForBucket',
      'local options: ',
      options,
      'response ',
      response
    );
  }
  return response.Contents.map(({ Key }) => Key).sort(comparisonFn);
}

export async function bucketHasKey(bucket, key) {
  return headObject({ Bucket: bucket, Key: key });
}

export async function copyKeyFromBucketToBucket(bucketSrc, bucketDest, key) {
  return copyObject({
    Bucket: bucketDest,
    CopySource: `/${bucketSrc}/${key}`,
    Key: key,
  });
}

export async function deleteKeysForBucket(bucket, keys) {
  const formattedKeys = keys.map((k) => ({ Key: k }));
  const params = {
    Bucket: bucket,
    Delete: {
      Objects: formattedKeys,
      Quiet: false,
    },
  };
  return deleteObjects(params);
}

/*
async function test() {
  try {
    const { Buckets } = await listBuckets();
    console.log('Buckets: ', Buckets);
    const bucketName = 'filbert-dev-mysqlbackups-hourly';
    await assertBucket(bucketName);
    const sampleFile = '/Users/jd/dev/filbert/api/cron/daily/2020-01-02_115309.sql'
    // const uploadResponse = await uploadFileToBucket(bucketName, sampleFile);
    let objects = await listKeysForBucket(bucketName);
    const deleted = await deleteKeysForBucket(bucketName, objects);
    objects = await listKeysForBucket(bucketName);
    console.log(objects);
  } catch (err) {
    console.error('main() error: ', err);
    process.exitCode = 1;
  }
}

//test();
//process.exitCode = 0;
 */
