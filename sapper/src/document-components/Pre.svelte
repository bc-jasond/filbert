<script>
  export let node;

  import { NODE_TYPE_PRE } from '../common/constants';
  import { cleanTextOrZeroLengthPlaceholder } from '../common/utils';
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

<pre data-type={NODE_TYPE_PRE} name={node.get('id')}>
  {cleanTextOrZeroLengthPlaceholder(node.get('content'))}
</pre>
