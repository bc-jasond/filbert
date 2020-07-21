<script>
  export let nodesById = Map();

  import { Map } from 'immutable';
  import {
    NODE_TYPE_H1,
    NODE_TYPE_H2,
    NODE_TYPE_IMAGE,
    NODE_TYPE_LI,
    NODE_TYPE_P,
    NODE_TYPE_PRE,
    NODE_TYPE_QUOTE,
    NODE_TYPE_ROOT,
    NODE_TYPE_SPACER,
    NODE_TYPE_CONTENT,
    NODE_TYPE_CODE,
    NODE_TYPE_OL,
  } from '../common/constants';
  import { cleanText, getFirstNode } from '../common/utils'
  import H1 from './H1.svelte';
  import H2 from './H2.svelte';
  import Li from './Li.svelte';
  import P from './P.svelte';
  import Pre from './Pre.svelte';
  import Spacer from './Spacer.svelte';
  import Image from './Image.svelte';
  import Quote from './Quote.svelte';

  let current = getFirstNode(nodesById);

  function next() {
    current = nodesById.get(current.get('next_sibling_id')) || Map();
  }

  function getParagraphs() {
    if (current.get('type') !== NODE_TYPE_P) {
      return null;
    }
    const paragraphs = [];
    while (current.get('type') === NODE_TYPE_P) {
      paragraphs.push(current);
      next();
    }
    return paragraphs;
  }

  function getOrderedList() {
    if (current.get('type') !== NODE_TYPE_LI) {
      return null;
    }
    const listItems = [];
    while (current.get('type') === NODE_TYPE_LI) {
      listItems.push(current);
      next();
    }
    return listItems;
  }

  function getContentSection() {
    const contentNodes = [];
    let p;
    let li;
    do {
      p = getParagraphs();
      li = getOrderedList();
      if (p) {
        contentNodes.push(...p);
      }
      if (li) {
        contentNodes.push(li);
      }
    } while (p || li);
    return { type: NODE_TYPE_CONTENT, nodes: contentNodes };
  }

  function getCodeSection() {
    const preNodes = [];
    while (current.get('type') === NODE_TYPE_PRE) {
      preNodes.push(current)
      next();
    }
    return { type: NODE_TYPE_CODE, nodes: preNodes };
  }

  let nodesInOrder = [];
  while (current.get('id')) {
    let shouldAdvanceCurrent = true;
    if ([NODE_TYPE_P, NODE_TYPE_LI].includes(current.get('type'))) {
      nodesInOrder.push(getContentSection());
      shouldAdvanceCurrent = false;
    } else if ([NODE_TYPE_PRE].includes(current.get('type'))) {
      nodesInOrder.push(getCodeSection());
      shouldAdvanceCurrent = false;
    } else {
      nodesInOrder.push(current);
    }
    if (shouldAdvanceCurrent) {
      next();
    }
  }
</script>

<style>
  div {
    margin-bottom: 96px;
  }

  .code-section {
    margin-bottom: 52px;
    font-family: var(--code-font-family), monospace;
    font-size: 16px;
    font-weight: var(--code-font-weight);
    max-height: 350px;
    letter-spacing: var(--code-letter-spacing);
    word-spacing: -0.2em;
    line-height: var(--code-line-height);
    background: var(--background-color-secondary);
    padding: 20px;
    overflow: auto;
    counter-reset: code;
  }

  ol {
    margin-bottom: 38px;
    counter-reset: post;
    padding: 0;
    list-style: none none;
    word-break: break-word;
    visibility: visible;
  }
</style>

<div>
  {#each nodesInOrder as node}
    {#if !Map.isMap(node) && node.type === NODE_TYPE_CONTENT}
      <section class="filbert-section content-section">
        {#each node.nodes as nodeInner}
          {#if !Map.isMap(nodeInner)}
            <ol>
              {#each nodeInner as li}
                <Li node={li} />
              {/each}
            </ol>
          {:else}
            <P node={nodeInner} />
          {/if}
        {/each}
      </section>
    {:else if !Map.isMap(node) && node.type === NODE_TYPE_CODE}
      <section class="filbert-section code-section">
        {#each node.nodes as pre}
          <Pre node={pre} />
        {/each}
      </section>
    {:else if node.get('type') === NODE_TYPE_H1}
      <H1 {node} shouldShowPlaceholder={nodesById.size === 1 &&
        cleanText(node.get('content', '')).length === 0} />
    {:else if node.get('type') === NODE_TYPE_H2}
      <H2 {node} />
    {:else if node.get('type') === NODE_TYPE_SPACER}
      <Spacer {node} />
    {:else if node.get('type') === NODE_TYPE_IMAGE}
      <Image {node} />
    {:else if node.get('type') === NODE_TYPE_QUOTE}
      <Quote {node} />
    {/if}
  {/each}
</div>