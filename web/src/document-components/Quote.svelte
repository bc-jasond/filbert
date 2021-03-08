<script>
  export let node = Map();
  export let isEditing = false;
  export let setEditNodeId = undefined;

  import { Map } from 'immutable';

  import { getId, meta } from '@filbert/linked-list';
  import { NODE_TYPE_QUOTE } from '@filbert/document';

  $: isEditMode = !!setEditNodeId;

  $: id = getId(node);
  $: quote = meta(node).get('quote', '');
  $: url = meta(node).get('url', '');
  $: author = meta(node).get('author', '');
  $: context = meta(node).get('context', '');
</script>

<style>
  .wrapper {
    border: 4px solid transparent;
    min-height: 64px;
    position: relative;
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

<svelte:options immutable />
<section
  class="filbert-section content-section"
  data-type="{NODE_TYPE_QUOTE}"
  name="{id}"
>
  <div
    class="wrapper"
    class:edit-section-border="{isEditing}"
    class:edit-hover-border="{isEditMode}"
    on:click="{() => setEditNodeId?.(id)}"
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
