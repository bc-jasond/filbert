<script>
  export let node = Map();

  import { Map } from 'immutable';

  import { LINKED_LIST_NODE_ID } from '@filbert/linked-list';
  import { NODE_TYPE_PRE, NODE_CONTENT } from '@filbert/document';
  import { cleanTextOrZeroLengthPlaceholder } from '@filbert/util';
</script>

<style>
  pre {
    font: inherit;
    margin: 0;
    color: var(--text-color-secondary);
  }

  pre::before {
    display: inline-block;
    width: 35px;
    color: var(--background-color-primary);
    counter-increment: code;
    content: counter(code);
  }
</style>

<svelte:options immutable />
<pre data-type="{NODE_TYPE_PRE}" name="{node.get(LINKED_LIST_NODE_ID)}">
  {cleanTextOrZeroLengthPlaceholder(node.get(NODE_CONTENT))}
</pre>
