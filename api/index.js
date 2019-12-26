// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module /*, options*/);

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const figlet = require('figlet');
const storage = multer.memoryStorage();
const upload = multer({
  storage, // TODO: store in memory as Buffer - bad idea?
  //dest: './uploads/', // store in filesystem
  limits: {
    // busboy option
    fileSize: 16777216 // 16MB in bytes max size for mysql MEDIUMBLOB
  }
});
const sharp = require('sharp');
// const util = require('util');  for util.inspect()
const { OAuth2Client } = require('google-auth-library');

const {
  getKnex,
  getNodesFlat,
  bulkContentNodeUpsert,
  bulkContentNodeDelete,
  getMysqlDatetime
} = require('./mysql');
const { checkPassword } = require('./user');
const { encrypt, decrypt, getChecksum } = require('./cipher');

async function main() {
  try {
    console.info(
      figlet.textSync('filbert', {
        //font: 'Doh',
      })
    );
    const knex = await getKnex();

    const app = express();
    app.use(express.json());
    app.use(cors(/* TODO: whitelist *.filbert.xyz in PRODUCTION */));

    /**
     * parse Authorization header, add logged in user to req object
     *
     * TODO: implement refresh_token hybrid frontend/server-side flow
     *  https://developers.google.com/identity/sign-in/web/server-side-flow
     */
    app.use(async (req, res, next) => {
      try {
        const {
          headers: { authorization }
        } = req;
        // decrypt Authorization header
        // assign 'loggedInUser' session to req for all routes
        // TODO: json encoded string 'null'?
        if (authorization && authorization != 'null') {
          console.info(
            'Authorization Header: ',
            authorization,
            typeof authorization
          );
          const decryptedToken = JSON.parse(decrypt(authorization));
          const nowInSeconds = Math.floor(Date.now() / 1000);
          if (decryptedToken.exp - nowInSeconds <= 5 * 60 /* 5 minutes */) {
            // token expired if within 5 minutes of the 'exp' time
            res.status(401).send({ error: 'expired token' });
            return;
          }
          req.loggedInUser = decryptedToken;
        }
        next();
      } catch (err) {
        console.error('Authorization header Error, continuing anyway...', err);
        next();
      }
    });

    function sendSession(res, user) {
      res.send({
        token: encrypt(JSON.stringify(user)),
        session: {
          username: user.username,
          userId: user.id,
          givenName: user.given_name,
          familyName: user.family_name,
          pictureUrl: user.picture_url,
          iss: user.iss
        }
      });
    }

    app.post('/signin', async (req, res) => {
      try {
        const { username, password } = req.body;
        const [user] = await knex('user').where('username', username);

        if (!user) {
          res.status(401).send({ error: 'Invalid credentials' });
          return;
        }

        const passwordDoesMatch = await checkPassword(password, user.password);

        if (!passwordDoesMatch) {
          res.status(401).send({ error: 'Invalid credentials' });
          return;
        }

        sendSession(res, user);
      } catch (err) {
        console.error('Signin Error: ', err);
        res.status(401).send({});
      }
    });

    app.post('/signin-google', async (req, res) => {
      try {
        const { googleUser, filbertUsername } = req.body;
        const client = new OAuth2Client(
          process.env.GOOGLE_API_FILBERT_CLIENT_ID
        );
        const ticket = await client.verifyIdToken({
          idToken: googleUser.idToken,
          audience: process.env.GOOGLE_API_FILBERT_CLIENT_ID
        });
        // LoginTicket api/node_modules/google-auth-library/build/src/auth/loginticket.d.ts
        const {
          email,
          given_name,
          family_name,
          picture,
          iss,
          exp
        } = ticket.getPayload();

        let [user] = await knex('user').where('email', email);

        if (user) {
          sendSession(res, { ...user, exp });
          return;
        }

        if (!user && !filbertUsername) {
          // this is a signup, prompt for a username
          res.send({ signupIsIncomplete: true });
          return;
        }

        // we're back and user entered username, try to create a new user record and signin
        const [userId] = await knex
          .insert({
            email,
            username: filbertUsername,
            given_name,
            family_name,
            picture_url: picture,
            iss
          })
          .into('user');

        [user] = await knex('user').where('id', userId);

        sendSession(res, { ...user, exp });
      } catch (err) {
        console.error('Signin Error: ', err);
        res.status(401).send({});
      }
    });

    /**
     * username is taken?
     */
    app.get('/username-is-available/:username', async (req, res) => {
      const {
        params: { username }
      } = req;
      if (!username) {
        res.send(false);
        return;
      }
      if (username.length < 4 || username.length > 42) {
        res.send(false);
        return;
      }
      const [user] = await knex('user')
        .select('id')
        .where('username', username);
      res.send(!user);
    });

    app.get('/post', async (req, res) => {
      const { loggedInUser } = req;
      const posts = await knex('post')
        .select(
          'post.id',
          'user_id',
          'canonical',
          'title',
          'abstract',
          'post.created',
          'updated',
          'published',
          'post.deleted',
          'username'
        )
        .innerJoin('user', 'post.user_id', 'user.id')
        .whereNotNull('published')
        .orderBy('published', 'desc')
        .limit(250);

      if (!loggedInUser) {
        res.send(posts);
        return;
      }

      res.send(
        posts.map(post => {
          post.canEdit = loggedInUser.id === post.user_id;
          post.canDelete = loggedInUser.id === post.user_id;
          post.canPublish = loggedInUser.id === post.user_id;
          return post;
        })
      );
    });

    app.get('/post/:canonical', async (req, res) => {
      const { loggedInUser } = req;
      const { canonical } = req.params;
      const [post] = await knex('post').where({ canonical });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const contentNodes = await getNodesFlat(knex, post.id);
      if (loggedInUser) {
        post.canEdit = loggedInUser.id === post.user_id;
        post.canDelete = loggedInUser.id === post.user_id;
        post.canPublish = loggedInUser.id === post.user_id;
      }
      res.send({ post, contentNodes });
    });

    app.get('/image/:id', async (req, res) => {
      const { id } = req.params;
      const [image] = await knex('image').where({ id });
      if (!image) {
        res.status(404).send({});
        return;
      }
      res.contentType(image.mime_type);
      res.send(image.file_data);
    });

    /**
     * authenticated routes - all routes defined after this middleware require a logged in user
     */
    app.use(async (req, res, next) => {
      if (!req.loggedInUser) {
        console.error('No User Found', req.method, req.url, req.headers);
        res.status(401).send({});
        return;
      }
      next();
    });

    /**
     * creates a new draft for logged in user
     */
    app.post('/post', async (req, res) => {
      const user_id = req.loggedInUser.id;
      const { title, canonical } = req.body;
      const [postId] = await knex
        .insert({ user_id, title, canonical })
        .into('post');
      res.send({ postId });
    });

    /**
     * save post fields - like title, canonical & abstract
     */
    app.patch('/post/:id', async (req, res) => {
      const { id } = req.params;
      const { title, canonical, abstract } = req.body;
      const [post] = await knex('post').where({
        user_id: req.loggedInUser.id,
        id
      });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const result = await knex('post')
        .update({ title, canonical, abstract })
        .where({
          user_id: req.loggedInUser.id,
          id
        });
      res.send({});
    });

    /**
     * delete a post
     */
    app.delete('/post/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNotNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      /**
       * DANGER ZONE!!!
       */
      await knex('content_node')
        .where('post_id', post.id)
        .del();
      await knex('post')
        .where('id', post.id)
        .del();
      res.status(204).send({});
    });

    /**
     * get post for editing
     */
    app.get('/edit/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post').where({
        id,
        user_id: req.loggedInUser.id
      });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const contentNodes = await getNodesFlat(knex, post.id);
      res.send({ post, contentNodes });
    });

    /**
     * takes a list of 1 or more content nodes to update and/or delete for a post
     */
    app.post('/content', async (req, res) => {
      try {
        const updates = req.body.filter(
          change => change[1].action === 'update'
        );
        const deletes = req.body.filter(
          change => change[1].action === 'delete'
        );
        // TODO: put in transaction
        // TODO: validate updates, trim invalid selections, orphaned nodes, etc.
        const updateResult = await bulkContentNodeUpsert(updates);
        const deleteResult = await bulkContentNodeDelete(deletes);
        res.send({ updateResult, deleteResult });
      } catch (err) {
        console.error('POST /content Error: ', err);
        res.status(500).send({});
      }
    });

    /**
     * upload image!
     */
    app.post('/image', upload.single('fileData'), async (req, res) => {
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
        const [existingImage] = await knex('image')
          .select('id', 'width', 'height')
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
        await knex('image').insert({
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
        console.error('POST /image Error: ', err);
        res.status(500).send({});
      }
    });

    app.delete('/image/:id', async (req, res) => {
      const { id } = req.params;
      // TODO: transaction, select for update
      const imageWhereClause = {
        id,
        user_id: req.loggedInUser.id
      };
      const [image] = await knex('image')
        .select('id')
        .where(imageWhereClause);
      if (!image) {
        res.status(404).send({});
        return;
      }

      // TODO: slow query warning!  But, also just move this to a cron job
      //  1) run once a day, put all image ids that aren't referenced in a content_node meta into a image_delete_staging table with the date.  remove image ids from table that have been used again
      //  2) delete all ids with times older than X days, clear these entries from image_delete_staging
      const numTimesUsed = await knex('content_node')
        .where('type', 'image')
        .andWhere('meta', 'like', `%${id}%`);

      if (numTimesUsed.length < 2) {
        // delete image!
        await knex('image')
          .where(imageWhereClause)
          .del();
      }
      res.status(204).send({});
    });

    /**
     * list drafts for logged in user
     */
    app.get('/draft', async (req, res) => {
      const posts = await knex('post')
        .select(
          'post.id',
          'user_id',
          'canonical',
          'title',
          'abstract',
          'post.created',
          'updated',
          'published',
          'post.deleted',
          'username'
        )
        .innerJoin('user', 'post.user_id', 'user.id')
        .whereNull('published')
        .andWhere('post.user_id', req.loggedInUser.id)
        .orderBy('post.created', 'desc')
        .limit(250);

      res.send(posts);
    });

    /**
     * publish a draft - this is a one-time operation
     */
    app.post('/publish/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      if (!post.canonical) {
        res.status(400).send({
          message: "Error: Can't publish a draft with no canonical URL"
        });
        return;
      }
      await knex('post')
        .update({ published: getMysqlDatetime() })
        .where({
          user_id: req.loggedInUser.id,
          id
        });
      res.send({});
    });

    /**
     * delete a draft (and content nodes) for logged in user
     */
    app.delete('/draft/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id
        });

      if (!post) {
        res.status(404).send({});
        return;
      }
      /**
       * DANGER ZONE!!!
       */
      // TODO: transaction
      await knex('content_node')
        .where('post_id', id)
        .del();
      await knex('post')
        .where('id', id)
        .del();

      res.status(204).send({});
    });

    app.listen(3001);
    console.info('Filbert API Started 👍');
  } catch (err) {
    console.error('main() error: ', err);
  }
}

main();
