const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
// const util = require('util');  for util.inspect()

const {
  getKnex,
  bulkContentNodeUpsert,
  bulkContentNodeDelete,
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
        console.log('Signin Error: ', err)
        res.sendStatus(401)
      }
    })
    
    app.get('/post', async (req, res) => {
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
        .orderBy('published', 'desc');
      
      res.send(posts);
    })
    
    app.get('/post/:id', async (req, res) => {
      const { id } = req.params;
      
      const [post] = await knex('post')
        .where('canonical', id);
      
      if (!post) {
        res.sendStatus(404);
        return;
      }
      
      const contentNodes = await getNodes(knex, post.id);
      
      res.send({ post, contentNodes });
    })
    
    /**
     * authenticated routes - all routes defined after this middleware will assume a logged in user
     */
    app.use(async (req, res, next) => {
      try {
        const { headers: { authorization } } = req;
        // decrypt Authorization header
        // assign 'loggedInUser' session to req for all authenticated routes
        req.loggedInUser = JSON.parse(decrypt(authorization));
        // return 401 on failure
        next();
      } catch (err) {
        console.log('Authorization header Error', err);
        res.sendStatus(401)
      }
    })
    
    /**
     * creates a new post for logged in user
     */
    app.post('/post', async (req, res) => {
      const user_id = req.loggedInUser.id;
      const { title, canonical } = req.body;
      
      const knex = await getKnex();
      
      const [postId] = await knex
        .insert({ user_id, title, canonical })
        .into('post');
      
      res.send({ postId });
    })
  
    /**
     * get post for editing
     */
    app.get('/edit/:id', async (req, res) => {
      const { id } = req.params;
    
      const [post] = await knex('post')
        .where({
          'id': id,
          'user_id': req.loggedInUser.id,
        });
    
      if (!post) {
        res.sendStatus(404);
        return;
      }
    
      const contentNodes = await getNodes(knex, post.id);
    
      res.send({ post, contentNodes });
    })
    
    /**
     * takes a list of 1 or more content nodes
     */
    app.post('/content', async (req, res) => {
      try {
        const updates = req.body.filter(change => change.action === 'update').map(change => change.node);
        const deletes = req.body.filter(change => change.action === 'delete').map(change => change.node);
        const updateResult = await bulkContentNodeUpsert(updates);
        const deleteResult = await bulkContentNodeDelete(deletes);
        res.send({updateResult, deleteResult});
      } catch (err) {
        console.log('POST /content Error: ', err);
        res.sendStatus(500);
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
        .orderBy('post.created', 'desc');
      
      res.send(posts);
    })
    
    app.listen(3001)
    
  } catch (err) {
    console.log('main() error: ', err);
  }
}

main()
