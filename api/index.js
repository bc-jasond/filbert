// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module/*, options*/);
const {
  NODE_TYPE_LI, NODE_TYPE_P,
  NODE_TYPE_SECTION_H1, NODE_TYPE_SECTION_H2,
  NODE_TYPE_ROOT,
  NODE_TYPE_A, NODE_TYPE_BOLD,
  NODE_TYPE_CODE,
  NODE_TYPE_ITALIC, NODE_TYPE_LINK,
  NODE_TYPE_SITEINFO,
  NODE_TYPE_STRIKE, NODE_TYPE_TEXT,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_BOLD,
  SELECTION_LINK_URL,
} = require('../frontend/src/common/constants');
const {
  Selection,
} = require('../frontend/src/pages/edit/edit-selection-helpers');

const {fromJS, Map, List } = require('immutable');

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

async function mang() {
  const id = 8;
  const knex = await getKnex();
  const [{ user_id, title, canonical, abstract }] = await knex('post')
    .where('id', id);
  
  const [newPostId] = await knex
    .insert({ user_id, title, canonical, abstract })
    .into('post');
  
  const contentNodes = await knex('content_node')
    .where('post_id', id)
    .orderBy(['parent_id', 'position']);
  
  // keyed off of parent_id
  const formattingNodes = {};
  // nodes with Selection()
  const pAndLiNodes = {};
  // all other nodes, sections, etc.
  const sectionAndParentNodes = [];
  // first loop
  //   - add formatting & legacy text nodes to an object keyed on 'parent_id' for later Selection() processing
  for (let i = 0; i < contentNodes.length; i++) {
    const node = fromJS({ ...contentNodes[i] });
    if ([
      NODE_TYPE_A,
      NODE_TYPE_CODE,
      NODE_TYPE_SITEINFO,
      NODE_TYPE_ITALIC,
      NODE_TYPE_STRIKE,
      NODE_TYPE_BOLD,
      NODE_TYPE_LINK,
      NODE_TYPE_TEXT
    ].includes(node.get('type'))) {
      if (!formattingNodes[node.get('parent_id')]) {
        formattingNodes[node.get('parent_id')] = [];
      }
      formattingNodes[node.get('parent_id')][node.get('position')] = node;
      continue;
    }
    
    if ([NODE_TYPE_P, NODE_TYPE_LI].includes(node.get('type'))) {
      pAndLiNodes[node.get('id')] = node;
      continue;
    }
    
    sectionAndParentNodes.push(node);
  }
  // next loop - add sections and parent nodes (everything but P and LI) to document, add text content where no Selection() is necessary
  for (let i = 0; i < sectionAndParentNodes.length; i++) {
    const node = sectionAndParentNodes[i];
    const nodeInsertValues = { ...node.toJS(), post_id: newPostId };
    nodeInsertValues.content = nodeInsertValues.content || '';
    if (formattingNodes[node.get('id')] && formattingNodes[node.get('id')].length === 1 && formattingNodes[node.get('id')][0].get('type') === NODE_TYPE_TEXT) {
      nodeInsertValues.content = formattingNodes[node.get('id')][0].get('content');
      delete formattingNodes[node.get('id')];
    }
    nodeInsertValues.meta = JSON.stringify(nodeInsertValues.meta);
    await knex('content_node')
      .insert(nodeInsertValues)
  }
  
  // next loop - for P and LI create Selection() records where necessary
  for (let nodeWithSelectionId in pAndLiNodes) {
    let parent = pAndLiNodes[nodeWithSelectionId];
    const siblings = formattingNodes[nodeWithSelectionId];
    let currentMeta = parent.get('meta');
    let currentSelections = currentMeta.get('selections', List());
    let currentSelection = new Selection();
    let currentEndOffset = 0;
    for (let i = 0; i < siblings.length; i++) {
      let current = siblings[i];
      if (
        current.get('type') === NODE_TYPE_TEXT
        // text node is only child of P or LI
        && siblings.length === 1
      ) {
        // just add TEXT node content to parent node - no Selection() mapping needed
        parent = parent.set('content', current.get('content'));
        // already updated this node
        continue;
      }
      // Selection() needed
      while (current.get('type') !== NODE_TYPE_TEXT) {
        switch (current.get('type')) {
          case NODE_TYPE_SITEINFO:
            currentSelection = currentSelection.set(SELECTION_ACTION_SITEINFO, true);
            break;
          case NODE_TYPE_A:
            currentSelection = currentSelection
              .set(SELECTION_ACTION_LINK, true)
              .set(SELECTION_LINK_URL, current.get('content'));
            break;
          case NODE_TYPE_ITALIC:
            currentSelection = currentSelection.set(SELECTION_ACTION_ITALIC, true);
            break;
          case NODE_TYPE_STRIKE:
            currentSelection = currentSelection.set(SELECTION_ACTION_STRIKETHROUGH, true);
            break;
          case NODE_TYPE_CODE:
            currentSelection = currentSelection.set(SELECTION_ACTION_CODE, true);
            break;
          case NODE_TYPE_BOLD:
            currentSelection = currentSelection.set(SELECTION_ACTION_BOLD, true);
        }
        const currentChildren = formattingNodes[current.get('id')];
        // assuming 1 child here...
        if (currentChildren) {
          current = currentChildren.shift();
        } else {
          // CODE used to have 'content' too!, need to let the loop happen for formatting but, then break;
          break;
        }
      }
      const parentContent = parent.get('content') || '';
      const currentContent = current.get('content') || '';
      currentEndOffset = currentEndOffset += currentContent.length;
      currentSelection = currentSelection.set('end', currentEndOffset);
      currentSelections = currentSelections.push(currentSelection);
      parent = parent
        .set('content', `${parentContent}${currentContent}`)
        .set('meta', currentMeta.set('selections', currentSelections))
      currentSelection = new Selection({start: currentEndOffset});
    }
  
    const insertValues = { ...parent.toJS(), post_id: newPostId };
    insertValues.meta = JSON.stringify(insertValues.meta);
    await knex('content_node')
      .insert(insertValues);
  }
  console.log('KTHXBYE')
}

mang();

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
        console.error('Signin Error: ', err)
        res.send({}).status(401)
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
        res.send({}).status(404);
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
        console.error('Authorization header Error', err);
        res.send({}).status(401)
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
        res.send({}).status(404);
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
        res.send({}).status(500);
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
    
    /**
     * delete a draft (and content nodes) for logged in user
     */
    app.delete('/draft/:id', async (req, res) => {
      const { id } = req.params;
      const [post] = await knex('post')
        .whereNull('published')
        .andWhere({
          'user_id': req.loggedInUser.id,
          id,
        });
      
      if (!post) {
        res.send({}).status(404);
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
      
      res.send({}).status(204);
    })
    
    app.listen(3001)
    
  } catch (err) {
    console.error('main() error: ', err);
  }
}

//main()
