// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module/*, options*/);

const express = require('express');
const cors = require('cors');
// const util = require('util');  for util.inspect()

const {
  getKnex,
  bulkContentNodeUpsert,
  bulkContentNodeDelete,
  getMysqlDatetime,
} = require('./mysql');
const { checkPassword } = require('./user');
const { encrypt, decrypt } = require('./cipher');

async function getNodes(knex, postId) {
  const nodesArray = await knex('content_node')
    .where('post_id', postId)
    .orderBy(['parent_id', 'position']);
  
  // group nodes by parent_id, sorted by position
  return nodesArray.reduce((acc, node) => {
    if (!acc[node.parent_id]) {
      acc[node.parent_id] = [];
    }
    acc[node.parent_id].push(node);
    return acc;
  }, {})
}

async function main() {
  try {
    const knex = await getKnex();
    
    const app = express();
    app.use(express.json());
    app.use(cors(/* TODO: whitelist *.dubaniewi.cz in PRODUCTION */))
    
    /**
     * parse Authorization header, add logged in user to req object
     */
    app.use(async (req, res, next) => {
      try {
        const { headers: { authorization } } = req;
        // decrypt Authorization header
        // assign 'loggedInUser' session to req for all routes
        if (authorization) {
          // TODO: add expiry time
          // TODO: add refresh token & flow
          req.loggedInUser = JSON.parse(decrypt(authorization));
        }
        next();
      } catch (err) {
        console.error('Authorization header Error, continuing anyway...', err);
        next();
      }
    })
    
    app.post('/signin', async (req, res) => {
      try {
        const { username, password } = req.body;
        const [user] = await knex('user')
          .where('username', username);
        
        if (!user) {
          res.status(401).send({ error: 'Invalid credentials' })
          return;
        }
        
        const passwordDoesMatch = await checkPassword(password, user.password);
        
        if (!passwordDoesMatch) {
          res.status(401).send({ error: 'Invalid credentials' })
          return;
        }
        
        res.send({
          token: encrypt(JSON.stringify(user)),
          session: {
            username: user.username,
            userId: user.id,
          },
        });
      } catch (err) {
        console.error('Signin Error: ', err)
        res.status(401).send({})
      }
    })
    
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
          'username',
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
    })
    
    app.get('/post/:canonical', async (req, res) => {
      const { loggedInUser } = req;
      const { canonical } = req.params;
      const [post] = await knex('post')
        .where({ canonical });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const contentNodes = await getNodes(knex, post.id);
      if (loggedInUser) {
        post.canEdit = loggedInUser.id === post.user_id;
        post.canDelete = loggedInUser.id === post.user_id;
        post.canPublish = loggedInUser.id === post.user_id;
      }
      res.send({ post, contentNodes });
    })
    
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
    })
    
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
    })
    
    /**
     * save post fields - like title, canonical & abstract
     */
    app.patch('/post/:id', async (req, res) => {
      const { id } = req.params;
      const { title, canonical, abstract } = req.body;
      const [post] = await knex('post')
        .where({
          user_id: req.loggedInUser.id,
          id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const result = await knex('post')
        .update({ title, canonical, abstract })
        .where({
          user_id: req.loggedInUser.id,
          id,
        })
      res.send({})
    })
    
    /**
     * delete a post
     */
    app.delete('/post/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNotNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id,
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
    })
    
    /**
     * get post for editing
     */
    app.get('/edit/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .where({
          id,
          user_id: req.loggedInUser.id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      const contentNodes = await getNodes(knex, post.id);
      res.send({ post, contentNodes });
    })
    
    /**
     * takes a list of 1 or more content nodes to update and/or delete for a post
     */
    app.post('/content', async (req, res) => {
      try {
        const updates = req.body.filter(change => change[1].action === 'update');
        const deletes = req.body.filter(change => change[1].action === 'delete');
        // TODO: put in transaction
        // TODO: validate updates, trim invalid selections, orphaned nodes, etc.
        const updateResult = await bulkContentNodeUpsert(updates);
        const deleteResult = await bulkContentNodeDelete(deletes);
        res.send({ updateResult, deleteResult });
      } catch (err) {
        console.error('POST /content Error: ', err);
        res.status(500).send({})
      }
    })
    
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
          'username',
        )
        .innerJoin('user', 'post.user_id', 'user.id')
        .whereNull('published')
        .andWhere('post.user_id', req.loggedInUser.id)
        .orderBy('post.created', 'desc')
        .limit(250);
      
      res.send(posts);
    })
    
    /**
     * publish a draft - this is a one-time operation
     */
    app.post('/publish/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id,
        });
      if (!post) {
        res.status(404).send({});
        return;
      }
      if (!post.canonical) {
        res.status(400).send({ message: "Error: Can't publish a draft with no canonical URL" });
        return;
      }
      await knex('post')
        .update({ published: getMysqlDatetime() })
        .where({
          user_id: req.loggedInUser.id,
          id,
        })
      res.send({});
    })
    
    /**
     * delete a draft (and content nodes) for logged in user
     */
    app.delete('/draft/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          user_id: req.loggedInUser.id,
          id,
        });
      
      if (!post) {
        res.status(404).send({});
        return;
      }
      /**
       * DANGER ZONE!!!
       */
      await knex('content_node')
        .where('post_id', id)
        .del();
      await knex('post')
        .where('id', id)
        .del();
      
      res.status(204).send({});
    })
    
    app.listen(3001)
    
  } catch (err) {
    console.error('main() error: ', err);
  }
}

main();
