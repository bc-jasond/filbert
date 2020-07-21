<script>
  export let node;

  import { NODE_TYPE_P } from '../common/constants';
  // import FormattedSelections from './formatted-selections';
</script>

<style>
  p {
    position: relative;
    margin-bottom: 32px;
    word-break: break-word;
  }
</style>

<p data-type={NODE_TYPE_P} name={node.get('id')}>
  <!--<FormattedSelections node={node} />-->
  {node.get('content')}
</p>
