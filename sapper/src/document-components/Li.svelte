<script>
  export let node;

  import { NODE_TYPE_LI } from '../common/constants';
  import FormattedText from './format-components/NodeSelectionsFormatted.svelte';
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

<li data-type="{NODE_TYPE_LI}" name="{node.get('id')}">
  <FormattedText {node} />
</li>
