<script>
  export let documentModel = new DocumentModel();
  export let currentEditNode = new DocumentModelNode();
  export let setEditNodeId = undefined;

  import { DocumentModel, DocumentModelNode } from '@filbert/document';
  import { cleanText } from '@filbert/util';
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

  let current;
  let nodesInOrder;

  function getParagraphs() {
    if (!current?.isParagraph) {
      return null;
    }
    const paragraphs = [];
    while (current?.isParagraph) {
      paragraphs.push(current);
      current = documentModel.getNext(current);
    }
    return paragraphs;
  }

  function getOrderedList() {
    if (!current?.isListItem) {
      return null;
    }
    const listItems = [];
    while (current?.isListItem) {
      listItems.push(current);
      current = documentModel.getNext(current);
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
    while (current?.isCode) {
      preNodes.push(current);
      current = documentModel.getNext(current);
    }
    return { type: NODE_TYPE_CODE, nodes: preNodes };
  }

  $: {
    let infiniteLoopCount = 0;
    current = documentModel.head;
    nodesInOrder = [];
    while (current) {
      if (infiniteLoopCount++ > 100000) {
        console.error('infinite loop');
        break;
      }
      let shouldAdvanceCurrent = true;
      if (current.isParagraph || current.isListItem) {
        nodesInOrder.push(getContentSection());
        shouldAdvanceCurrent = false;
      } else if (current.isCode) {
        nodesInOrder.push(getCodeSection());
        shouldAdvanceCurrent = false;
      } else {
        nodesInOrder.push(current);
      }
      if (shouldAdvanceCurrent) {
        current = documentModel.getNext(current);
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
          {#if nodeInner.isParagraph}
            <P node="{nodeInner.values}" />
          {:else}
            <ol>
              {#each nodeInner as li}
                <Li node="{li.values}" />
              {/each}
            </ol>
          {/if}
        {/each}
      </section>
    {:else if node.type === NODE_TYPE_CODE}
      <section class="filbert-section code-section">
        {#each node.nodes as pre}
          <Pre node="{pre.values}" />
        {/each}
      </section>
    {:else if node.isHeading}
      <H1
        node="{node.values}"
        shouldShowPlaceholder="{documentModel.size === 1 && cleanText(node.content).length === 0}"
      />
    {:else if node.isSubHeading}
      <H2 node="{node.values}" />
    {:else if node.isSpacer}
      <Spacer
        node="{node.values}"
        {setEditNodeId}
        isEditing="{node.id === currentEditNode.id}"
      />
    {:else if node.isImage}
      <Image
        node="{node.values}"
        hideBorder="{false}"
        {setEditNodeId}
        isEditing="{node.id === currentEditNode.id}"
      />
    {:else if node.isQuote}
      <Quote
        node="{node.values}"
        {setEditNodeId}
        isEditing="{node.id === currentEditNode.id}"
      />
    {/if}
  {/each}
</div>
