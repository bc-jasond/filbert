<script>
  export let node;

  import { NODE_TYPE_QUOTE } from '../common/constants';

  let isEditing;
  let isEditMode;

  const id = node.get('id');
  const quote = node.getIn(['meta', 'quote'], '');
  const url = node.getIn(['meta', 'url'], '');
  const author = node.getIn(['meta', 'author'], '');
  const context = node.getIn(['meta', 'context'], '');
</script>

<style>
  .wrapper {
    position: relative;
    margin-bottom: 32px;
    word-break: break-word;
    clear: left;
  }
  .drop-cap {
    font-size: 48px;
    line-height: 60px;
    float: left;
    position: relative;
  }
  .quote-context-container {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
  }
  a {
    background-position: 0 calc(1em + 5px);
  }
</style>

<section
  class="filbert-section content-section"
  data-type="{NODE_TYPE_QUOTE}"
  name="{id}"
>
  <div
    class="wrapper"
    class:edit-section-border="{isEditing}"
    class:edit-hover-border="{isEditMode}"
    on:click="{() => {}}"
  >
    <span class="drop-cap">{'💡'}</span>
    <em class="italic-text">{quote && `"${quote}"`}</em>
    <div class="quote-context-container">
      <a class="filbert-link" target="_blank" href="{url}">
        {author && `-${author}`}
      </a>
      <span class="mini-text">{context && ` ${context}`}</span>
    </div>
  </div>
</section>
