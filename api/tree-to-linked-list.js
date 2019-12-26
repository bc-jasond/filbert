// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require('esm')(module /*, options*/);

const { fromJS, Map, List } = require('immutable');
const figlet = require('figlet');

const { getKnex, getNodes, bulkContentNodeUpsert } = require('./mysql');

const { getMapWithId } = require('../frontend/src/common/utils');

async function main(ids) {
  try {
    console.info(
      figlet.textSync('document model format converter', {
        //font: 'Doh',
      })
    );
    const knex = await getKnex();
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const [post] = await knex('post').where({
        id
      });
      if (!post) {
        console.log('bad post id', id);
        return;
      }
      // NOTE: uses old nodesByParentId ordered by position
      const contentNodes = await getNodes(knex, post.id);
      // create new post
      //const newPostId = 999;
      const [newPostId] = await knex
        .insert({ user_id: 1, title: post.title, canonical: 'some-url-here' })
        .into('post');

      let updates = Map();
      // updates.push(["34ab", { post_id: newPostId, node: Map() }])
      const nodesByParentId = fromJS(JSON.parse(JSON.stringify(contentNodes)));
      const rootId = nodesByParentId
        .get('null')
        .first()
        .get('id');
      let last;

      // DFS to get the proper top-down ordering
      function inner(nodeId) {
        const nodes = nodesByParentId.get(nodeId);
        nodes.forEach(node => {
          node = node
            .delete('parent_id')
            .delete('position')
            .set('post_id', newPostId);
          if (nodesByParentId.get(node.get('id'))) {
            inner(node.get('id'));
            return;
          }
          if (node.get('type') === 'codesection') {
            const lines = node.getIn(['meta', 'lines'], List());
            lines.forEach(line => {
              const newNode = getMapWithId({
                content: line,
                type: 'pre',
                post_id: newPostId
              });
              if (last) {
                updates = updates.set(
                  last.get('id'),
                  last.set('next_sibling_id', newNode.get('id'))
                );
              }
              updates = updates.set(newNode.get('id'), newNode);
              last = newNode;
            });
            return;
          }
          if (last) {
            updates = updates.set(
              last.get('id'),
              last.set('next_sibling_id', node.get('id'))
            );
          }
          updates = updates.set(node.get('id'), node.set('post_id', newPostId));
          last = node;
        });
      }

      inner(rootId);
      try {
        await bulkContentNodeUpsert(
          updates
            .map((v, k) =>
              List([
                k,
                {
                  post_id: newPostId,
                  node: v.toJS()
                }
              ])
            )
            .toList()
            .toJS()
        );
      } catch (err) {
        console.error(err);
      }
    }
    console.info('Filbert Conversion Finished 👍');
    process.exit(0);
  } catch (err) {
    console.error('main() error: ', err);
    process.exit(1);
  }
}

main([1, 2, 3, 4, 5, 6, 7, 8, 160]);
