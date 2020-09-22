<script context="module">
  import { getApiClientInstance } from '../../common/api-client';
  import { getMapWithId } from '../../common/utils';
  import { NEW_POST_URL_ID, NODE_TYPE_H1 } from '../../common/constants';

  export async function preload({ path, params, query }, session) {
    if (params.post === NEW_POST_URL_ID) {
      const placeHolderTitle = getMapWithId({ type: NODE_TYPE_H1 }).toJS();
      return {
        post: { id: NEW_POST_URL_ID },
        nodesById: { [placeHolderTitle.id]: placeHolderTitle },
        selectionOffsets: { startNodeId: placeHolderTitle.id },
      };
    }

    const {
      error,
      data: { post, contentNodes: nodesById, selectionOffsets = {} } = {},
    } = await getApiClientInstance(this.fetch).get(`/edit/${params.post}`);

    if (error) {
      this.error(error);
      return;
    }

    return {
      post,
      nodesById,
      selectionOffsets,
    };
  }
</script>

<script>
  import { apiPost } from 'filbert/src/common/fetch';

  export let post;
  export let nodesById;
  export let selectionOffsets = {};

  // onMount start
  let caretIsOnEdgeOfParagraphText;
  let getFirstHeadingContent;
  let getHighlightedSelectionOffsets;
  let getImageFileFormData;
  let getNodeById;
  let getRange;
  let isControlKey;
  let isValidDomSelection;
  let removeAllRanges;
  let replaceRange;
  let setCaret;

  let postMap;
  let documentModel;
  let historyManager;
  let nodesByIdMapInternal = Map();
  // onMount end

  let insertMenuNode = Map();
  let insertMenuTopOffset = 0;
  let insertMenuLeftOffset = 0;
  let editSectionNode = Map();
  let shouldShowEditSectionMenu = false;
  let editSectionMetaFormTopOffset = 0;
  let formatSelectionNode = Map();
  let formatSelectionModel = Selection();
  let formatSelectionModelIdx = -1;
  let batchSaveIntervalId;
  let pasteHistoryState;
  let cutHistoryState;

  import { fromJS, Map } from 'immutable';
  import { goto } from '@sapper/app';
  import { tick, onMount } from 'svelte';

  import {
    KEYCODE_BACKSPACE,
    KEYCODE_DOWN_ARROW,
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_LEFT_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_UP_ARROW,
    KEYCODE_V,
    KEYCODE_X,
    KEYCODE_Z,
    NODE_TYPE_IMAGE,
    NODE_TYPE_P,
    NODE_TYPE_QUOTE,
    NODE_TYPE_SPACER,
    PAGE_NAME_EDIT,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
  } from '../../common/constants';
  import {
    reviver,
    getCanonicalFromTitle,
    Selection,
    stopAndPrevent,
  } from '../../common/utils';
  import Document from '../../document-components/Document.svelte';
  import DocumentModel, {
    getFirstNode,
  } from '../../editor-components/document-model';
  import HistoryManager, {
    getLastExecuteIdFromHistory,
  } from '../../editor-components/history-manager';

  import {
    doDelete,
    doDeleteMetaType,
    doMerge,
  } from '../../editor-components/editor-commands/delete';
  import {
    syncFromDom,
    syncToDom,
  } from '../../editor-components/editor-commands/dom-sync';
  import { doPaste } from '../../editor-components/editor-commands/paste';
  import { doSplit } from '../../editor-components/editor-commands/split';

  import {
    getSelectionAtIdx,
    getSelectionByContentOffset,
    replaceSelection,
  } from '../../editor-components/selection-helpers';
  import { doFormatSelection } from '../../editor-components/editor-commands/format-selection';

  //import InsertSectionMenu from './insert-section-menu';
  import EditImageMenu from '../../editor-components/EditImageMenu.svelte';
  //import EditQuoteForm from './edit-quote-form';
  //import FormatSelectionMenu from './format-selection-menu';

  onMount(async () => {
    ({
      caretIsOnEdgeOfParagraphText,
      getFirstHeadingContent,
      getHighlightedSelectionOffsets,
      getImageFileFormData,
      getNodeById,
      getRange,
      isControlKey,
      isValidDomSelection,
      removeAllRanges,
      replaceRange,
      setCaret,
    } = await import('../../common/dom'));

    $: {
      postMap = fromJS(post);
      documentModel = DocumentModel(post.id, nodesById);
      historyManager = HistoryManager(post.id, getApiClientInstance());
      nodesByIdMapInternal = documentModel.getNodes();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  async function createNewPost() {
    const title = getFirstHeadingContent();
    // get canonical - chop title, add hash
    const canonical = getCanonicalFromTitle(title);
    // POST to /post
    const { error, data: { postId } = {} } = await getApiClientInstance().post(
      '/post',
      {
        title,
        canonical,
        // default 'sync post to content' settings ON
        meta: {
          syncTitleAndAbstract: true,
          syncTopPhoto: true,
        },
      }
    );
    // TODO: handle error?
    if (error) {
      console.error(error);
      return;
    }
    // copy placeholder history
    const pendingHistory = historyManager.getLocalHistoryLog();
    // re-instantiate HistoryManager with pendingHistory for saveAndClearLocalHistoryLog()
    historyManager = HistoryManager(postId, pendingHistory);
    // will save current document state from history
    await historyManager.saveAndClearLocalHistoryLog();
    // huh, aren't we on /edit? - this is for going from /edit/new -> /edit/123...
    await goto(`/edit/${postId}`);
  }

  async function commitUpdates(selectionOffsets) {
    const { startNodeId, caretStart, caretEnd } = selectionOffsets;
    // TODO: optimistically saving updated nodes with no error handling - look ma, no errors!

    // roll with state changes TODO: handle errors - roll back?

    nodesByIdMapInternal = documentModel.getNodes();
    insertMenuNode = Map();

    // on insert,set editSectionNode if not already set.
    if (startNodeId && documentModel.isMetaType(startNodeId)) {
      editSectionNode = documentModel.getNode(startNodeId);
    }
    // no more caret work necessary for Meta nodes
    if (
      documentModel.isMetaType(startNodeId) ||
      // OR if we're typing a url in the formatSelection menu
      formatSelectionModel.get(SELECTION_ACTION_LINK)
    ) {
      return;
    }

    await tick();
    // if a menu isn't open, re-place the caret
    if (!caretEnd || caretStart === caretEnd) {
      setCaret(selectionOffsets);
    } else {
      replaceRange(selectionOffsets);
    }
    //manageInsertMenu({}, selectionOffsets);
    //manageFormatSelectionMenu({}, selectionOffsets);
  }

  function closeAllEditContentMenus() {
    formatSelectionNode = Map();
    (editSectionNode = Map()), (shouldShowEditSectionMenu = false);
  }

  async function handleBackspace(evt, selectionOffsets) {
    // if the caret is collapsed, only let the "backspace" key through...
    // otherwise, if there are any other key strokes that aren't control keys - delete the selection!
    if (
      evt.keyCode !== KEYCODE_BACKSPACE ||
      // don't delete the section while editing its fields :) !
      shouldShowEditSectionMenu ||
      // invalid selection
      !isValidDomSelection(selectionOffsets)
    ) {
      return;
    }

    stopAndPrevent(evt);

    const { startNodeId, endNodeId, caretStart, caretEnd } = selectionOffsets;

    const historyState = [];
    let executeSelectionOffsets = selectionOffsets;

    // is this a MetaType node?
    if (documentModel.isMetaType(startNodeId)) {
      const {
        historyState: historyStateDeleteMetaType,
        executeSelectionOffsets: executeSelectionOffsetsDeleteMetaType,
      } = doDeleteMetaType(documentModel, selectionOffsets);
      historyState.push(...historyStateDeleteMetaType);
      executeSelectionOffsets = executeSelectionOffsetsDeleteMetaType;

      historyManager.appendToHistoryLog({
        executeSelectionOffsets,
        unexecuteSelectionOffsets: selectionOffsets,
        historyState,
      });
      await commitUpdates(executeSelectionOffsets);
      return;
    }

    const hasContentToDelete = endNodeId || caretStart > 0 || caretEnd;

    // is there any content to delete?
    if (hasContentToDelete) {
      const {
        historyState: historyStateDelete,
        executeSelectionOffsets: executeSelectionOffsetsDelete,
      } = doDelete(documentModel, selectionOffsets);
      historyState.push(...historyStateDelete);
      executeSelectionOffsets = executeSelectionOffsetsDelete;
    }

    // if doDelete() returns a different startNodeId, a merge is required
    // TODO: verify highlight + cut or delete has the right behavior
    const needsMergeWithOtherNode =
      executeSelectionOffsets.startNodeId !== startNodeId ||
      (!caretStart && !caretEnd);

    if (needsMergeWithOtherNode) {
      const {
        executeSelectionOffsets: executeSelectionOffsetsMerge,
        historyState: historyStateMerge,
      } = doMerge(documentModel, executeSelectionOffsets);
      historyState.push(...historyStateMerge);
      executeSelectionOffsets = executeSelectionOffsetsMerge;
    }

    // since this handler catches keystrokes *before* DOM updates, deleting one char will look like a diff length of 0
    const didDeleteContentInOneNode = !endNodeId && hasContentToDelete;

    if (didDeleteContentInOneNode) {
      historyManager.appendToHistoryLogWhenNCharsAreDifferent({
        executeSelectionOffsets,
        unexecuteSelectionOffsets: selectionOffsets,
        historyState,
        comparisonPath: ['content'],
      });
    } else {
      historyManager.appendToHistoryLog({
        executeSelectionOffsets,
        unexecuteSelectionOffsets: selectionOffsets,
        historyState,
      });
    }

    // clear the selected format node when deleting the highlighted selection
    // NOTE: must wait for state to have been set or setCaret will check stale values
    closeAllEditContentMenus();
    await commitUpdates(executeSelectionOffsets);
  }

  async function handleEnter(evt, selectionOffsets) {
    if (
      evt.keyCode !== KEYCODE_ENTER ||
      // ignore if there's a selected MetaType node's menu is open
      shouldShowEditSectionMenu ||
      // invalid dom selection
      !isValidDomSelection(selectionOffsets)
    ) {
      return;
    }

    stopAndPrevent(evt);

    // perform editor commands
    const { executeSelectionOffsets, historyState } = doSplit(
      documentModel,
      selectionOffsets
    );
    // create history log entry
    historyManager.appendToHistoryLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      historyState,
    });
    // special case for creating a new document on "Enter"
    if (!postMap.get('id') || postMap.get('id') === NEW_POST_URL_ID) {
      await createNewPost();
      return;
    }
    closeAllEditContentMenus();
    await commitUpdates(executeSelectionOffsets);
  }

  async function handleSyncToDom(evt, selectionOffsets) {
    // don't send updates for control keys
    if (
      isControlKey(evt.keyCode) ||
      // stopped by another handler like Backspace or Enter
      evt.defaultPrevented ||
      // contentEditable is not the srcTarget
      evt.target.id !== 'filbert-edit-container' ||
      // ignore "paste" - propagation hasn't been stopped because it would cancel the respective "paste", "cut" events
      pasteHistoryState ||
      // ignore "cut"
      cutHistoryState ||
      // invalid selection
      !isValidDomSelection(selectionOffsets)
    ) {
      return;
    }
    stopAndPrevent(evt);

    if (editSectionNode.get('id')) {
      return;
    }
    const historyState = [];
    // select-and-type ?? delete selection first
    if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
      const { historyState: historyStateDelete } = doDelete(
        documentModel,
        selectionOffsets
      );
      historyState.push(...historyStateDelete);
    }
    // sync keystroke to DOM
    const {
      historyState: historyStateSync,
      executeSelectionOffsets,
    } = syncToDom(documentModel, selectionOffsets, evt);
    historyState.push(...historyStateSync);

    // assumes content update (of one char) on a single node, only create an entry every so often
    if (historyState.length === 1) {
      historyManager.appendToHistoryLogWhenNCharsAreDifferent({
        unexecuteSelectionOffsets: selectionOffsets,
        executeSelectionOffsets,
        historyState,
        comparisonPath: ['content'],
      });
    } else {
      // we did more than a simple content update to one node, save an entry
      historyManager.flushPendingHistoryLogEntry();
      historyManager.appendToHistoryLog({
        unexecuteSelectionOffsets: selectionOffsets,
        executeSelectionOffsets,
        historyState,
      });
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent??? 😞 so we place it back with JS...
    closeAllEditContentMenus();
    await commitUpdates(executeSelectionOffsets);
  }

  function getSelectionOffsetsOrEditSectionNode() {
    if (editSectionNode.size > 0) {
      return {
        startNodeId: editSectionNode.get('id'),
        caretStart: 0,
        caretEnd: 0,
      };
    }
    // TODO: style MetaType nodes that have been selected so user can tell
    return getHighlightedSelectionOffsets();
  }

  async function handleKeyDown(evt) {
    // redo
    if (
      evt.keyCode === KEYCODE_Z &&
      evt.shiftKey &&
      (evt.metaKey || evt.ctrlKey)
    ) {
      //this.redo();
      stopAndPrevent(evt);
      return;
    }
    // undo
    if (evt.keyCode === KEYCODE_Z && (evt.metaKey || evt.ctrlKey)) {
      //this.undo();
      stopAndPrevent(evt);
      return;
    }
    // ignore shift and option - don't override hard-refresh!
    if ((evt.metaKey || evt.ctrlKey) && evt.shiftKey) {
      return;
    }
    if (
      // ignore control or modifier keys
      // unless related to a supported destructive operation like: "cut" or "paste"
      (evt.metaKey || evt.ctrlKey || isControlKey(evt.keyCode)) &&
      // allowed (whitelisted) keys
      ![
        // to open / close section edit menu
        KEYCODE_ENTER,
        // to close section edit menu
        KEYCODE_ESC,
        KEYCODE_UP_ARROW,
        KEYCODE_LEFT_ARROW,
        KEYCODE_DOWN_ARROW,
        KEYCODE_RIGHT_ARROW,
      ].includes(evt.keyCode) &&
      // allow "cut"
      !((evt.metaKey || evt.ctrlKey) && evt.keyCode === KEYCODE_X) &&
      // allow "paste"
      !((evt.metaKey || evt.ctrlKey) && evt.keyCode === KEYCODE_V) &&
      // allow holding down shift
      !evt.shiftKey
    ) {
      return;
    }

    console.debug('KEYDOWN', evt);
    let selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    // TODO this.handleDel(evt); // currently, no support for the 'Del' key
    await handleBackspace(evt, selectionOffsets);
    await handleEnter(evt, selectionOffsets);
    //await this.handlePaste(evt, selectionOffsets);
    //await this.handleCut(evt, selectionOffsets);
    await handleSyncToDom(evt, selectionOffsets);
    //await this.handleArrows(evt, selectionOffsets);
    // refresh caret after possible setState() mutations above
    //selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    //await this.handleEditSectionMenu(evt);
    //await this.manageInsertMenu(evt, selectionOffsets);
    //await this.manageFormatSelectionMenu(evt, selectionOffsets);
  }

  function sectionEdit() {}
</script>

<style>
  div {
    outline: none;
  }
</style>

{#if nodesByIdMapInternal.size}
  <div id="filbert-edit-container" contenteditable>
    <Document
      nodesById="{nodesByIdMapInternal}"
      currentEditNode="{editSectionNode}"
      setEditNodeId="{sectionEdit}"
    />
  </div>
{/if}
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
