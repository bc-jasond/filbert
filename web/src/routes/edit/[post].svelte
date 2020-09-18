<script context="module">
  import { getApiClientInstance } from '../../common/api-client';
  import { loading } from '../../stores';

  export async function preload({ path, params, query }, session) {
    loading.set(true);

    const {
      error,
      data: {
        post,
        contentNodes: nodesById,
        selectionOffsets: { startNodeId, caretStart } = {},
      },
    } = await getApiClientInstance(this.fetch).get(`/edit/${params.post}`);

    if (error) {
      this.error(error);
      return;
    }

    return {
      post,
      nodesById,
    };
  }
</script>

<script>
  import { reviver } from '../../common/utils';

  export let nodesById;
  export let post;

  $: postMap = fromJS(post);
  $: nodesByIdMap = fromJS(nodesById, reviver);

  import { fromJS, Map } from 'immutable';

  import Document from '../../document-components/Document.svelte';

  let currentEditSection = Map();
  function setCurrentEditSection() {}
</script>

<style>
  div {
    outline: none;
  }
</style>

<div id="filbert-edit-container" contenteditable>
  <Document
    nodesById="{nodesByIdMap}"
    currentEditNode="{currentEditSection}"
    setEditNodeId="{setCurrentEditSection}"
  />
</div>
<!--{insertMenuNode.get('id') && (-->
<!--    <InsertSectionMenu-->
<!--    insertNodeId={insertMenuNode.get('id')}-->
<!--    insertMenuTopOffset={insertMenuTopOffset}-->
<!--    insertMenuLeftOffset={insertMenuLeftOffset}-->
<!--    insertSection={this.insertSection}-->
<!--    />-->
<!--    )}-->
<!--{editSectionNode.get('type') === NODE_TYPE_IMAGE &&-->
<!--shouldShowEditSectionMenu && (-->
<!--    <EditImageForm-->
<!--    offsetTop={editSectionMetaFormTopOffset}-->
<!--    post={post}-->
<!--    nodeModel={editSectionNode}-->
<!--    update={this.updateEditSectionNode}-->
<!--    />-->
<!--    )}-->
<!--{editSectionNode.get('type') === NODE_TYPE_QUOTE &&-->
<!--shouldShowEditSectionMenu && (-->
<!--    <EditQuoteForm-->
<!--    offsetTop={editSectionMetaFormTopOffset}-->
<!--    nodeModel={editSectionNode}-->
<!--    update={this.updateEditSectionNode}-->
<!--    />-->
<!--    )}-->
<!--{formatSelectionNode.get('id') && (-->
<!--    <FormatSelectionMenu-->
<!--    offsetTop={formatSelectionMenuTopOffset}-->
<!--    offsetLeft={formatSelectionMenuLeftOffset}-->
<!--    nodeModel={formatSelectionNode}-->
<!--    selectionModel={formatSelectionModel}-->
<!--    selectionAction={this.handleSelectionAction}-->
<!--    updateLinkUrl={this.updateLinkUrl}-->
<!--    closeMenu={this.closeFormatSelectionMenu}-->
<!--    />-->
<!--    )}-->
