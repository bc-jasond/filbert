const sharp = require("sharp");
const { getChecksum } = require("../lib/cipher");
const { getKnex } = require("../lib/mysql");

async function getImageById(req, res) {
  const { id } = req.params;
  const knex = await getKnex();
  const [image] = await knex("image").where({ id });
  if (!image) {
    res.status(404).send({});
    return;
  }
  res.contentType(image.mime_type);
  res.send(image.file_data);
}

async function uploadImage(req, res) {
  try {
    const { body, file } = req;
    // TODO: this whole approach to deduping files isn't worth it, it adds complexity and edge cases
    //  we really need to lock the whole table and do all these operations in a transaction
    //  a simpler alternative would be to use a guid, and not dedupe at all. Then just use a cronjob every so often to delete images whose ids aren't in content_node
    // get hash from whole file
    const checksum = await getChecksum(file.buffer);
    // TODO: use transaction
    // see if the image already exists, deduped by user, not globally
    const existingImageWhereClause = {
      user_id: parseInt(body.userId, 10),
      id: checksum
    };
    const knex = await getKnex();
    const [existingImage] = await knex("image")
      .select("id", "width", "height")
      .where(existingImageWhereClause);
    // if image already exists, just increment counter and return meta
    if (existingImage) {
      res.status(200).send({
        imageId: existingImage.id,
        width: existingImage.width,
        height: existingImage.height
      });
      return;
    }
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
    console.log("IMAGE META", imgMeta);
    await knex("image").insert({
      user_id: parseInt(body.userId, 10),
      id: checksum,
      mime_type: file.mimetype,
      file_data: fileBuffer,
      encoding: file.encoding,
      width: imgMeta.width,
      height: imgMeta.height
    });
    res.status(201).send({
      imageId: checksum,
      width: imgMeta.width,
      height: imgMeta.height
    });
  } catch (err) {
    delete req.file; // free this up ASAP!
    console.error("POST /image Error: ", err);
    res.status(500).send({});
  }
}

async function deleteImage(req, res) {
  const { id } = req.params;
  // TODO: transaction, select for update
  const imageWhereClause = {
    id,
    user_id: req.loggedInUser.id
  };
  const knex = await getKnex();
  const [image] = await knex("image")
    .select("id")
    .where(imageWhereClause);
  if (!image) {
    res.status(404).send({});
    return;
  }

  // TODO: slow query warning!  But, also just move this to a cron job
  //  1) run once a day, put all image ids that aren't referenced in a content_node meta into a image_delete_staging table with the date.  remove image ids from table that have been used again
  //  2) delete all ids with times older than X days, clear these entries from image_delete_staging
  const numTimesUsed = await knex("content_node")
    .where("type", "image")
    .andWhere("meta", "like", `%${id}%`);

  if (numTimesUsed.length < 2) {
    // delete image!
    await knex("image")
      .where(imageWhereClause)
      .del();
  }
  res.status(204).send({});
}

module.exports = {
  getImageById,
  uploadImage,
  deleteImage
};
