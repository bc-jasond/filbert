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
  p {
    position: relative;
    margin-bottom: 32px;
    word-break: break-word;
  }
</style>

<section class="filbert-section content-section" data-type={NODE_TYPE_QUOTE} name={id}>
  <p
      class:edit-section-border={isEditing}
      class:edit-hover-border={isEditMode}
      on:click="{() => {}}">
    {'💡 '}
    <em class="italic-text">
      {quote && `"${quote}" `}
      <a class="filbert-link" target="_blank" href={url}>
        {author && `-${author}`}
      </a>
      <span class="mini-text">{context && ` ${context}`}</span>
    </em>
  </p>
</section>