<script>
  export let node = Map();
  export let noMargin = false;

  import { Map } from 'immutable';
  import { LINKED_LIST_NODE_ID } from '@filbert/linked-list';
  import { NODE_TYPE_H2, NODE_CONTENT } from '@filbert/document';
  import { cleanTextOrZeroLengthPlaceholder } from '@filbert/util';
</script>

<style>
  h2 {
    color: var(--title-color-primary);
    margin-top: 30px;
    margin-bottom: 8px;
    font-family: var(--h2-font-family), sans-serif;
    font-size: var(--h2-font-size);
    font-weight: var(--h2-font-weight);
    line-height: var(--h2-line-height);
    letter-spacing: var(--h2-letter-spacing);
  }
</style>

<svelte:options immutable />
{#if node.size}
  <h2
    data-type="{NODE_TYPE_H2}"
    name="{node.get(LINKED_LIST_NODE_ID)}"
    class:filbert-section="{!noMargin}"
  >
    {cleanTextOrZeroLengthPlaceholder(node.get(NODE_CONTENT))}
  </h2>
{:else}
  <h2 class:filbert-section="{!noMargin}">
    <slot />
  </h2>
{/if}
