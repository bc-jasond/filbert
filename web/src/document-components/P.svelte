<script>
  export let node;

  import { NODE_TYPE_P } from '@filbert/document';
  import FormattedText from './NodeSelectionsFormatted.svelte';
</script>

<style>
  p {
    position: relative;
    margin-bottom: 32px;
    word-break: break-word;
  }
</style>

<svelte:options immutable />
<p data-type="{NODE_TYPE_P}" name="{node.get('id')}">
  <FormattedText {node} />
</p>
