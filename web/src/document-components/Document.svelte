<script>
  export let documentModel = Map();
  export let currentEditNode = Map();
  export let setEditNodeId = undefined;

  import { Map } from 'immutable';

  import { head, getNext, size, getId } from '@filbert/linked-list';
  import {
    type,
    contentClean,
    NODE_TYPE_P,
    NODE_TYPE_LI,
    NODE_TYPE_PRE,
    NODE_TYPE_H1,
    NODE_TYPE_H2,
    NODE_TYPE_SPACER,
    NODE_TYPE_IMAGE,
    NODE_TYPE_QUOTE,
  } from '@filbert/document';
  import H1 from './H1.svelte';
  import H2 from './H2.svelte';
  import Li from './Li.svelte';
  import P from './P.svelte';
  import Pre from './Pre.svelte';
  import Spacer from './Spacer.svelte';
  import Image from './Image.svelte';
  import Quote from './Quote.svelte';

  // sections that are containers only - no content
  const NODE_TYPE_CONTENT = 'content';
  const NODE_TYPE_CODE = 'code';

  let current = Map();
  let nodesInOrder = [];

  function getParagraphs() {
    if (type(current) !== NODE_TYPE_P) {
      return null;
    }
    const paragraphs = [];
    while (type(current) === NODE_TYPE_P) {
      paragraphs.push(current);
      current = getNext(documentModel, current);
    }
    return paragraphs;
  }

  function getOrderedList() {
    if (type(current) !== NODE_TYPE_LI) {
      return null;
    }
    const listItems = [];
    while (type(current) === NODE_TYPE_LI) {
      listItems.push(current);
      current = getNext(documentModel, current);
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
    while (type(current) === NODE_TYPE_PRE) {
      preNodes.push(current);
      current = getNext(documentModel, current);
    }
    return { type: NODE_TYPE_CODE, nodes: preNodes };
  }

  $: {
    let infiniteLoopCount = 0;
    current = head(documentModel);
    nodesInOrder = [];
    while (current.size > 0) {
      if (infiniteLoopCount++ > 100000) {
        console.error('infinite loop');
        break;
      }
      let shouldAdvanceCurrent = true;
      if (type(current) === NODE_TYPE_P || type(current) === NODE_TYPE_LI) {
        nodesInOrder.push(getContentSection());
        shouldAdvanceCurrent = false;
      } else if (type(current) === NODE_TYPE_PRE) {
        nodesInOrder.push(getCodeSection());
        shouldAdvanceCurrent = false;
      } else {
        nodesInOrder.push(current);
      }
      if (shouldAdvanceCurrent) {
        current = getNext(documentModel, current);
      }
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

<svelte:options immutable />

<div>
  {#each nodesInOrder as node}
    {#if node.type === NODE_TYPE_CONTENT}
      <section class="filbert-section content-section">
        {#each node.nodes as nodeInner}
          {#if Array.isArray(nodeInner)}
            <ol>
              {#each nodeInner as li}
                <Li node="{li}" />
              {/each}
            </ol>
          {:else}
            <P node="{nodeInner}" />
          {/if}
        {/each}
      </section>
    {:else if node.type === NODE_TYPE_CODE}
      <section class="filbert-section code-section">
        {#each node.nodes as pre}
          <Pre node="{pre}" />
        {/each}
      </section>
    {:else if type(node) === NODE_TYPE_H1}
      <H1
        {node}
        shouldShowPlaceholder="{size(documentModel) === 1 && contentClean(node).length === 0}"
      />
    {:else if type(node) === NODE_TYPE_H2}
      <H2 {node} />
    {:else if type(node) === NODE_TYPE_SPACER}
      <Spacer
        {node}
        {setEditNodeId}
        isEditing="{getId(node) === getId(currentEditNode)}"
      />
    {:else if type(node) === NODE_TYPE_IMAGE}
      <Image
        {node}
        hideBorder="{false}"
        {setEditNodeId}
        isEditing="{getId(node) === getId(currentEditNode)}"
      />
    {:else if type(node) === NODE_TYPE_QUOTE}
      <Quote
        {node}
        {setEditNodeId}
        isEditing="{getId(node) === getId(currentEditNode)}"
      />
    {/if}
  {/each}
</div>
