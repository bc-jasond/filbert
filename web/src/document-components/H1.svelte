<script>
  import { Map } from 'immutable';

  import { LINKED_LIST_NODE_ID } from '@filbert/linked-list';
  import { NODE_TYPE_H1, NODE_CONTENT } from '@filbert/document';
  import { cleanTextOrZeroLengthPlaceholder } from '@filbert/util';

  export let node = Map();
  export let shouldShowPlaceholder = false;
</script>

<style>
  h1 {
    font-family: var(--h1-font-family), serif;
    font-size: var(--h1-font-size);
    font-weight: var(--h1-font-weight);
    line-height: var(--h1-line-height);
    letter-spacing: var(--h1-letter-spacing);
    margin-bottom: 24px;
    color: var(--title-color-primary);
  }

  .has-placeholder::before {
    content: 'Write a title and hit enter...';
    position: absolute;
    color: var(--filbert-mediumGrey);
  }
</style>

<svelte:options immutable />
{#if node.size}
  <h1
    data-type="{NODE_TYPE_H1}"
    name="{node.get(LINKED_LIST_NODE_ID)}"
    class="filbert-section"
    class:has-placeholder="{shouldShowPlaceholder}"
  >
    {cleanTextOrZeroLengthPlaceholder(node.get(NODE_CONTENT))}
  </h1>
{:else}
  <h1 class="filbert-section">
    <slot />
  </h1>
{/if}
