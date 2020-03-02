// ESM - remove after ECMAScript Module support is past Experimental node v14 ?
require = require("esm")(module /*, options*/);

const { Map, List } = require("immutable");
const figlet = require("figlet");

const { getKnex, bulkContentNodeUpsert } = require("./mysql");
const SELECTION_LENGTH = "length";
const SELECTION_NEXT = "next";

async function main() {
  try {
    console.info(
      figlet.textSync(
        "Selection model format converter from List() to linked list",
        {
          //font: 'Doh',
        }
      )
    );
    const knex = await getKnex();
    const [contentNodes, columnDefinitions] = await knex.raw(
      `SELECT * FROM filbert.content_node WHERE type IN ('li','p') AND JSON_CONTAINS_PATH(meta, 'one', '$.selections')`
    );

    let updates = Map();
    let shouldSkip = false;
    // updates.push(["34ab", { post_id: newPostId, node: Map() }])
    for (let i = 0; i < contentNodes.length; i++) {
      const currentNode = contentNodes[i];
      const currentSelections = currentNode.meta.selections;
      shouldSkip = false;
      let prev;
      for (let j = 0; j < currentSelections.length; j++) {
        let current = currentSelections[j];
        if (!current) {
          // already in new format
          shouldSkip = true;
        } else {
          current[SELECTION_LENGTH] = current.end - current.start;
          delete current.end;
          delete current.start;
        }
        if (prev) {
          prev[SELECTION_NEXT] = current;
        }
        prev = current;
      }
      if (shouldSkip) {
        continue;
      }
      if (prev) {
        prev[SELECTION_LENGTH] = -1;
        prev[SELECTION_NEXT] = undefined;
      }
      currentNode.meta.selections = currentSelections[0]; //fromJS(currentSelections[0], reviver);
      updates = updates.set(currentNode.id, {
        post_id: currentNode.post_id,
        node: currentNode
      });
    }

    const test = updates
      .map((v, k) =>
        List([
          k,
          {
            post_id: v.post_id,
            node: v.node
          }
        ])
      )
      .toList()
      .toJS();

    try {
      await bulkContentNodeUpsert(test);
    } catch (err) {
      console.error(err);
    }
    console.info("Filbert Conversion Finished 👍");
    process.exit(0);
  } catch (err) {
    console.error("main() error: ", err);
    process.exit(1);
  }
}

main();
