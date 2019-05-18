const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
// const util = require('util');  for util.inspect()

const { getKnex } = require('./mysql');
const { checkPassword } = require('./user');
const { Safe } = require('./cipher');

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
  require('./post-hello-world.data'),
  require('./about.data'),
  require('./post-react-router.data'),
  require('./post-nginx-first-config.data'),
  require('./post-nginx.data'),
  require('./post-display-images.data'),
  require('./post-first-model.data'),
  require('./post-wildcard-imports-svg.data'),
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
  
    app.post('/login', async (req, res) => {
      const { username, password } = req.body;
      
      const [user] = await knex('user')
        .where('username', username);
      
      const passwordDoesMatch = await checkPassword(password, user.password);
      
      if (!passwordDoesMatch) {
        res.status(401).send({ error: 'Invalid credentials' })
        return;
      }
      
      const safe = new Safe();
      
      res.send({ token: await safe.encrypt(user) });
    })
    
    /**
     * authenticated routes
     */
    app.use((req, res, next) => {
      // TODO: check auth token!
      next();
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
    
    app.listen(3001)
    
  } catch (err) {
    console.log('main() error: ', err);
  }
}

main()
