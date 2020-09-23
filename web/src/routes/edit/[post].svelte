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
  let shouldSkipKeyUp;

  import { fromJS, Map } from 'immutable';
  import { goto } from '@sapper/app';
  import { tick, onMount } from 'svelte';

  import {
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

  import { handleBackspace } from '../../editor-components/event-handlers/backspace';
  import { handleEnter } from '../../editor-components/event-handlers/enter';

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
      tick().then(() => {
        setCaret(selectionOffsets);
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    //window.addEventListener('resize', manageInsertMenu);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('input', handleInput);
    //window.addEventListener('paste', handlePaste);
    //window.addEventListener('cut', handleCut);
    window.addEventListener('mouseup', handleMouseUp);
    batchSaveIntervalId = setInterval(batchSave, 3000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      //window.removeEventListener('resize', manageInsertMenu);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('input', handleInput);
      //window.removeEventListener('paste', handlePaste);
      //window.removeEventListener('cut', handleCut);
      window.removeEventListener('mouseup', handleMouseUp);
      clearInterval(batchSaveIntervalId);
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

  async function batchSave() {
    const { updatedPost } = await historyManager.saveAndClearLocalHistoryLog();
    if (updatedPost) {
      // trigger reactivity defined in onMount()
      // the last cursor position and current history position are among things that could have changed
      post = updatedPost;
    }
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
    editSectionNode = Map();
    shouldShowEditSectionMenu = false;
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
      //redo();
      stopAndPrevent(evt);
      return;
    }
    // undo
    if (evt.keyCode === KEYCODE_Z && (evt.metaKey || evt.ctrlKey)) {
      //undo();
      stopAndPrevent(evt);
      return;
    }
    // create new post?
    // special case for creating a new document on "Enter"
    if (
      evt.keyCode === KEYCODE_ENTER &&
      (!postMap.get('id') || postMap.get('id') === NEW_POST_URL_ID)
    ) {
      stopAndPrevent(evt);
      await createNewPost();
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
    // ignore invalid DOM selection
    if (!isValidDomSelection(selectionOffsets)) {
      return;
    }
    // TODO handleDel(evt); // currently, no support for the 'Del' key
    if (
      // TODO: unregister this handler when showing the edit section menu...
      //  don't delete the section while editing its fields :) !
      !shouldShowEditSectionMenu
    ) {
      await handleBackspace({
        evt,
        selectionOffsets,
        documentModel,
        historyManager,
        commitUpdates,
      });
      await handleEnter({
        evt,
        selectionOffsets,
        documentModel,
        historyManager,
        commitUpdates,
      });
    }
    //await handlePaste(evt, selectionOffsets);
    //await handleCut(evt, selectionOffsets);
    await handleSyncToDom(evt, selectionOffsets);
    //await handleArrows(evt, selectionOffsets);
    // refresh caret after possible setState() mutations above
    //selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    //await handleEditSectionMenu(evt);
    //await manageInsertMenu(evt, selectionOffsets);
    //await manageFormatSelectionMenu(evt, selectionOffsets);
  }

  async function handleKeyUp(evt) {
    if (
      formatSelectionModel.get(SELECTION_ACTION_LINK) ||
      (!evt.shiftKey && !isControlKey(evt.keyCode))
    ) {
      return;
    }
    // TODO: this is to coordinate with closing the Format Selection menu
    // without it, the menu would reopen after the user hits ESC?
    if (shouldSkipKeyUp) {
      shouldSkipKeyUp = undefined;
      return;
    }
    console.debug('KEYUP');
    const selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    //await manageFormatSelectionMenu(evt, selectionOffsets);
  }

  async function handleInput(evt) {
    // any control keys being held down?
    if (evt.metaKey) {
      return;
    }
    // if there's a MetaNode selected, bail
    if (editSectionNode.get('id')) {
      return;
    }
    const selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    // if the caret isn't on a node with an id, bail
    if (!selectionOffsets.startNodeId) {
      return;
    }
    console.debug('INPUT (aka: sync back from DOM)');
    // for emoji keyboard insert & spellcheck correct
    const { executeSelectionOffsets, historyState } = syncFromDom(
      documentModel,
      selectionOffsets,
      evt
    );
    historyManager.appendToHistoryLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      historyState,
    });

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    await commitUpdates(executeSelectionOffsets);
  }

  async function handleMouseUp(evt) {
    // console.debug('MouseUp: ', evt)
    const selectionOffsets = getSelectionOffsetsOrEditSectionNode();

    // close everything by default, sectionEdit() callback will fire after this to override
    await closeAllEditContentMenus();
    //await manageInsertMenu(evt, selectionOffsets);
    //await manageFormatSelectionMenu(evt, selectionOffsets);
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
<!--    insertSection={insertSection}-->
<!--    />-->
<!--    )}-->
<!--{editSectionNode.get('type') === NODE_TYPE_IMAGE &&-->
<!--shouldShowEditSectionMenu && (-->
<!--    <EditImageForm-->
<!--    offsetTop={editSectionMetaFormTopOffset}-->
<!--    post={post}-->
<!--    nodeModel={editSectionNode}-->
<!--    update={updateEditSectionNode}-->
<!--    />-->
<!--    )}-->
<!--{editSectionNode.get('type') === NODE_TYPE_QUOTE &&-->
<!--shouldShowEditSectionMenu && (-->
<!--    <EditQuoteForm-->
<!--    offsetTop={editSectionMetaFormTopOffset}-->
<!--    nodeModel={editSectionNode}-->
<!--    update={updateEditSectionNode}-->
<!--    />-->
<!--    )}-->
<!--{formatSelectionNode.get('id') && (-->
<!--    <FormatSelectionMenu-->
<!--    offsetTop={formatSelectionMenuTopOffset}-->
<!--    offsetLeft={formatSelectionMenuLeftOffset}-->
<!--    nodeModel={formatSelectionNode}-->
<!--    selectionModel={formatSelectionModel}-->
<!--    selectionAction={handleSelectionAction}-->
<!--    updateLinkUrl={updateLinkUrl}-->
<!--    closeMenu={closeFormatSelectionMenu}-->
<!--    />-->
<!--    )}-->
