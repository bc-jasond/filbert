<script>
  export let node;

  import { NODE_TYPE_P } from '../common/constants';
  import FormattedText from './format-components/NodeSelectionsFormatted.svelte';
</script>

<style>
  p {
    position: relative;
    margin-bottom: 32px;
    word-break: break-word;
  }
</style>

<p data-type={NODE_TYPE_P} name={node.get('id')}>
  <FormattedText {node} />
</p>
