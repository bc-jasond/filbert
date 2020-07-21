<script>
  export let node;
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

<li data-type={node.get('type')} name={node.get('id')}>
<!--  <FormattedSelections node={node} />-->
  {node.get('content')}
</li>
