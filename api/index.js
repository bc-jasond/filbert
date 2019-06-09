const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
// const util = require('util');  for util.inspect()

const { getKnex } = require('./mysql');
const { checkPassword } = require('./user');
const { encrypt, decrypt } = require('./cipher');

const app = express();

// opinionated sections - have fixed format, can't have children
const NODE_TYPE_SECTION_CODE = 'codesection';
const NODE_TYPE_SECTION_IMAGE = 'image';
const NODE_TYPE_SECTION_QUOTE = 'quote';
const NODE_TYPE_SECTION_POSTLINK = 'postlink';

// from https://stackoverflow.com/a/105074/1991322
function getId(seen) {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  
  let current;
  do {
    current = s4(); // + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  } while (seen.has(current));
  
  seen.add(current);
  return current;
};

function toMeta(node) {
  const {
    type,
    // for code section
    lines,
    // for image
    width,
    height,
    url, // also for quote
    caption,
    // for quote
    quote,
    author,
    context,
    // for postlink
    to,
  } = node;
  switch (type) {
    case NODE_TYPE_SECTION_CODE:
      return { lines };
    case NODE_TYPE_SECTION_IMAGE:
      return { width, height, url, caption };
    case NODE_TYPE_SECTION_QUOTE:
      return { quote, author, url, context };
    case NODE_TYPE_SECTION_POSTLINK:
      return { to };
    default:
      return {};
  }
}

function flattenNodes(rootChildNodes, post_id) {
  const seen = new Set();
  const flattened = [];
  const queue = [
    {
      id: getId(seen),
      post_id,
      parent_id: null,
      position: 0,
      type: 'root',
      content: null,
      meta: JSON.stringify({}),
      childNodes: rootChildNodes,
    }
  ];
  while (queue.length) {
    const { id, parent_id, position, type, content, meta, childNodes } = queue.shift();
    flattened.push({ id, post_id, parent_id, position, type, content, meta });
    if (!childNodes) continue;
    childNodes.forEach((child, idx) => {
      queue.push({
        id: getId(seen),
        parent_id: id,
        position: idx,
        type: child.type,
        content: child.content || null,
        meta: JSON.stringify(toMeta(child)),
        childNodes: child.childNodes,
      })
    })
  }
  return flattened;
}

const dataFiles = [
  require('./data.BAK/post-hello-world.data.json'),
  require('./data.BAK/about.data.json'),
  require('./data.BAK/post-react-router.data.json'),
  require('./data.BAK/post-nginx-first-config.data.json'),
  require('./data.BAK/post-nginx.data.json'),
  require('./data.BAK/post-display-images.data.json'),
  require('./data.BAK/post-first-model.data.json'),
  require('./data.BAK/post-wildcard-imports-svg.data.json'),
];

async function mang() {
  try {
    const user_id = 1; // TODO: get from Authorization header
    
    for (let i = 0; i < dataFiles.length; i++) {
      const data = dataFiles[i];
      const { canonical, childNodes: rootChildNodes } = data;
      
      const knex = await getKnex();
      
      const [newPostId] = await knex
        .insert({ user_id, canonical }, 'id')
        .into('post');
      
      const flattenedChildNodes = flattenNodes(rootChildNodes, newPostId);
      
      const inserts = await knex
        .insert(flattenedChildNodes)
        .into('content_node');
      
      console.log(inserts);
    }
    
  } catch (err) {
    console.log('mang() error: ', err);
  }
}

// mang();

async function main() {
  try {
    const knex = await getKnex();
    
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
      
      const nodesArray = await knex('content_node')
        .where('post_id', post.id)
        .orderBy(['parent_id', 'position']);
      
      const contentNodes = nodesArray.reduce((acc, node) => {
        if (!acc[node.parent_id]) {
          acc[node.parent_id] = [];
        }
        acc[node.parent_id].push(node);
        return acc;
      }, {})
      
      res.send({ post, contentNodes });
    })
    
    /**
     * authenticated routes
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
      
      const post = await knex
        .insert({ user_id, title, canonical })
        .into('post');
      
      res.send({ post });
    })
    
    /**
     * takes a list of 1 or more content nodes
     */
    app.post('/content', async (req, res) => {
      res.sendStatus(404);
    })
    
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
