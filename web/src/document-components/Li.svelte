<script>
  export let node = Map();

  import { Map } from 'immutable';

  import { LINKED_LIST_NODE_ID } from '@filbert/linked-list';
  import { NODE_TYPE_LI } from '@filbert/document';
  import FormattedText from './NodeSelectionsFormatted.svelte';
</script>

<style>
  li {
    margin-left: 30px;
    margin-bottom: 14px;
  }

  li::before {
    box-sizing: border-box;
    padding-right: 12px;
    counter-increment: post;
    content: counter(post) '.';
    position: absolute;
    display: inline-block;
    width: 78px;
    margin-left: -78px;
    text-align: right;
  }
</style>

<svelte:options immutable />
<li data-type="{NODE_TYPE_LI}" name="{node.get(LINKED_LIST_NODE_ID)}">
  <FormattedText {node} />
</li>
