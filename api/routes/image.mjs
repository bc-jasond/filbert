import sharp from 'sharp';
import { getChecksum } from '@filbert/cipher';
import { bucketHasKey, uploadImageToBucket } from '../lib/s3.mjs';
import { imageBucketName, objectStorageBaseUrl } from '../lib/constants.mjs';

async function getImageKey(buffer, userId, imgMeta) {
  const checksum = await getChecksum(buffer);
  return `${process.env.NODE_ENV || 'dev'}_${userId}_${checksum}.${
    imgMeta.format
  }`;
}

export async function uploadImage(req, res, next) {
  try {
    const { body, file } = req;

    let fileBuffer = file.buffer;
    const sharpInstance = sharp(file.buffer);
    let imgMeta = await sharpInstance.metadata();
    // TODO: do something with exif data?
    // TODO: maybe support bigger img sizes later on?
    // TODO: check pixel density, convert down to 72PPI
    // TODO: what to do with animated GIFs?
    // TODO: only support jpg, png & gif - support other types as input but convert to jpg
    const isLandscape = imgMeta.width > imgMeta.height;
    if (imgMeta.width > 1200 || imgMeta.height > 1200) {
      fileBuffer = await sharpInstance
        .resize(isLandscape ? { width: 1200 } : { height: 1000 })
        .toBuffer();
      imgMeta = await sharp(fileBuffer).metadata();
    }
    console.log('IMAGE META', imgMeta);
    const imageKey = await getImageKey(file.buffer, body.userId, imgMeta);
    let image;
    let meta = {
      width: `${imgMeta.width}`,
      height: `${imgMeta.height}`,
      size: `${imgMeta.size}`,
      mimeType: file.mimetype,
      encoding: file.encoding,
      url: `https://${imageBucketName}.${objectStorageBaseUrl}/${imageKey}`,
    };
    try {
      image = await bucketHasKey(imageBucketName, imageKey);
      meta = { ...image.Metadata };
    } catch (err) {
      if (!err.code || err.code !== 'NotFound') {
        throw err;
      }
    }
    if (!image) {
      await uploadImageToBucket(
        imageBucketName,
        imageKey,
        fileBuffer,
        meta,
        // TODO: make true only for "public" posts
        //  1) false for private posts
        //  2) "make all images public on publish" procedure
        //  3) have to auth (sign) all requests to images for logged-in user while they edit
        true
      );
    }

    res.status(200).send(meta);
  } catch (err) {
    next(err);
  }
}
