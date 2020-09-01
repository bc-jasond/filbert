<script>
  export let node;

  import { NODE_TYPE_SPACER } from '../common/constants';

  // TODO use a store()
  let isEditing = false;
  let isEditMode = false;
</script>

<style>
  section::after {
    content: '✎﹏﹏﹏﹏﹏﹏﹏﹏﹏';
    text-align: center;
    display: block;
    margin: 0 auto;
    width: 266px;
  }
</style>

<section
  class="filbert-section"
  class:edit-section-border="{isEditing}"
  class:edit-hover-border="{isEditMode}"
  data-type="{NODE_TYPE_SPACER}"
  name="{node.get('id')}"
  on:click="{() => {}}"
></section>
