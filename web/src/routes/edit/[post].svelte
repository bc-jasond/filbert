<script context="module">
  import { getApiClientInstance } from '../../common/api-client';
  import { getMapWithId } from '../../common/utils';
  import { NEW_POST_URL_ID, NODE_TYPE_H1 } from '../../common/constants';

  export async function preload({ path, params, query }, session) {
    const apiClient = getApiClientInstance(this.fetch);
    if (params.post === NEW_POST_URL_ID) {
      const placeHolderTitle = getMapWithId({ type: NODE_TYPE_H1 }).toJS();
      return {
        post: { id: NEW_POST_URL_ID },
        nodesById: { [placeHolderTitle.id]: placeHolderTitle },
        selectionOffsetsPreload: { startNodeId: placeHolderTitle.id },
        apiClient,
      };
    }

    const {
      error,
      data: { post, contentNodes: nodesById, selectionOffsets = {} } = {},
    } = await apiClient.get(`/edit/${params.post}`);

    if (error) {
      this.error(error);
      return;
    }

    return {
      post,
      nodesById,
      selectionOffsetsPreload: selectionOffsets,
      apiClient,
    };
  }
</script>

<script>
  export let post;
  export let nodesById;
  export let selectionOffsetsPreload;
  export let apiClient;

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
  let formatSelectionMenuTopOffset = 0;
  let formatSelectionMenuLeftOffset = 0;
  let selectionOffsetsManageFormatSelectionMenu;
  let batchSaveIntervalId;

  let postMap;
  let isUnsavedPost;
  let documentModel;
  let historyManager;
  let nodesByIdMapInternal;
  $: nodesByIdMapInternal = documentModel.getNodes();
  $: {
    function reinstantiatePost() {
      console.info('RE-INSTANTIATE POST', post);
      postMap = fromJS(post);
      isUnsavedPost = postMap.get('id') === NEW_POST_URL_ID;
      documentModel = DocumentModel(post.id, nodesById);
      historyManager = HistoryManager(post.id, apiClient);
      nodesByIdMapInternal = documentModel.getNodes();
      if (isUnsavedPost) {
        clearInterval(batchSaveIntervalId);
      } else if (!batchSaveIntervalId) {
        batchSaveIntervalId = setInterval(batchSave, 3000);
      }
      tick().then(() => {
        if (!setCaret) {
          return;
        }
        if (documentModel.isMetaType(selectionOffsetsPreload.startNodeId)) {
          sectionEdit(selectionOffsetsPreload.startNodeId);
        } else {
          setCaret(selectionOffsetsPreload);
        }
      });
    }
    if (!postMap || post.id !== postMap.get('id')) {
      reinstantiatePost();
    }
  }

  $: insertMenuNodeId = insertMenuNode.get('id');

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

  import { syncFromDom } from '../../editor-components/editor-commands/dom-sync';
  import { handleBackspace } from '../../editor-components/event-handlers/backspace';
  import { handleEnter } from '../../editor-components/event-handlers/enter';
  import { handleSyncToDom } from '../../editor-components/event-handlers/sync-to-dom';
  import { handleArrows } from '../../editor-components/event-handlers/arrow-keys';
  import {
    handleCut,
    isCutEvent,
  } from '../../editor-components/event-handlers/cut';
  import {
    handlePaste,
    isPasteEvent,
  } from '../../editor-components/event-handlers/paste';
  import {
    handleUndo,
    isUndoEvent,
  } from '../../editor-components/event-handlers/undo';
  import {
    handleRedo,
    isRedoEvent,
  } from '../../editor-components/event-handlers/redo';

  import {
    getSelectionAtIdx,
    getSelectionByContentOffset,
    replaceSelection,
  } from '../../editor-components/selection-helpers';
  import { doFormatSelection } from '../../editor-components/editor-commands/format-selection';

  import InsertSectionMenu from '../../editor-components/InsertSectionMenu.svelte';
  import EditImageMenu from '../../editor-components/EditImageMenu.svelte';
  import EditQuoteForm from '../../editor-components/EditQuoteMenu.svelte';
  import FormatSelectionMenu from '../../editor-components/FormatSelectionMenu.svelte';

  function handleCutWrapper(evt) {
    return handleCut({
      evt,
      documentModel,
      historyManager,
      commitUpdates,
      closeAllEditContentMenus,
    });
  }

  function handlePasteWrapper(evt) {
    return handlePaste({
      evt,
      documentModel,
      historyManager,
      commitUpdates,
      closeAllEditContentMenus,
    });
  }

  function registerTopLevelEventHandlers() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', manageInsertMenu);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('input', handleInput);
    window.addEventListener('paste', handlePasteWrapper);
    window.addEventListener('cut', handleCutWrapper);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function deregisterTopLevelEventHandlers() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', manageInsertMenu);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('input', handleInput);
    window.removeEventListener('paste', handlePasteWrapper);
    window.removeEventListener('cut', handleCutWrapper);
    window.removeEventListener('mouseup', handleMouseUp);
  }

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

    console.log('EDIT onMount()');

    if (isUnsavedPost) {
      clearInterval(batchSaveIntervalId);
    } else {
      batchSaveIntervalId = setInterval(batchSave, 3000);
    }

    tick().then(() => {
      if (documentModel.isMetaType(selectionOffsetsPreload.startNodeId)) {
        sectionEdit(selectionOffsetsPreload.startNodeId);
      } else {
        setCaret(selectionOffsetsPreload);
        manageInsertMenu();
      }
    });

    registerTopLevelEventHandlers();

    return () => {
      deregisterTopLevelEventHandlers();
      clearInterval(batchSaveIntervalId);
    };
  });

  async function createNewPost() {
    const title = getFirstHeadingContent();
    // get canonical - chop title, add hash
    const canonical = getCanonicalFromTitle(title);
    // POST to /post
    const { error, data: { postId } = {} } = await apiClient.post('/post', {
      title,
      canonical,
      // default 'sync post to content' settings ON
      meta: {
        syncTitleAndAbstract: true,
        syncTopPhoto: true,
      },
    });
    // TODO: handle error?
    if (error) {
      console.error(error);
      return;
    }
    console.info('CREATE NEW POST');
    // copy placeholder history
    const pendingHistory = historyManager.getLocalHistoryLog();
    // re-instantiate HistoryManager with pendingHistory for saveAndClearLocalHistoryLog()
    // will save current document state from history
    await HistoryManager(
      postId,
      apiClient,
      pendingHistory
    ).saveAndClearLocalHistoryLog();
    // huh, aren't we on /edit? - this is for going from /edit/new -> /edit/123...
    await goto(`/edit/${postId}`, { replaceState: true });
  }

  async function batchSave() {
    const { updatedPost } = await historyManager.saveAndClearLocalHistoryLog();
    if (updatedPost) {
      // trigger reactivity defined in onMount()
      // the last cursor position and current history position are among things that could have changed
      post = updatedPost;
    }
  }

  // TODO: this function references the DOM and state.  So, it needs to pass-through values because it always executes - separate the DOM and state checks?
  async function manageInsertMenu(evt, selectionOffsetsArg) {
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const { caretStart, caretEnd, startNodeId } = selectionOffsets;
    if (!startNodeId) {
      return;
    }
    const selectedNodeMap = documentModel.getNode(startNodeId);
    const selectedNode = getNodeById(startNodeId);

    // Show the menu?
    if (
      selectedNode &&
      (!caretEnd || caretStart === caretEnd) &&
      selectedNodeMap.get('type') === NODE_TYPE_P &&
      selectedNodeMap.get('content', '').length === 0
    ) {
      // save current node because the selection will disappear when the insert menu is shown
      console.debug('INSERT - SHOULD SHOW');
      insertMenuNode = selectedNodeMap;
      insertMenuTopOffset = selectedNode.offsetTop;
      insertMenuLeftOffset = selectedNode.offsetLeft;
    } else {
      console.debug('INSERT - HIDE', selectedNodeMap.toJS());
      insertMenuNode = Map();
    }
  }

  async function commitUpdates(selectionOffsets) {
    const { startNodeId, caretStart, caretEnd } = selectionOffsets;
    // TODO: optimistically saving updated nodes with no error handling - look ma, no errors!

    // sync internal document state with documentModel state
    nodesByIdMapInternal = documentModel.getNodes();
    insertMenuNode = Map();

    // on insert,set editSectionNode if not already set.
    if (startNodeId && documentModel.isMetaType(startNodeId)) {
      sectionEdit(startNodeId);
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

  function getSelectionOffsetsOrEditSectionNode() {
    if (editSectionNode.size > 0) {
      return {
        startNodeId: editSectionNode.get('id'),
        caretStart: 0,
        caretEnd: 0,
      };
    }
    return getHighlightedSelectionOffsets();
  }

  async function handleKeyDown(evt) {
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
    // ignore shift and option - don't override hard-refresh BUT, do handle REDO :) !
    if ((evt.metaKey || evt.ctrlKey) && evt.shiftKey && !isRedoEvent(evt)) {
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
      // allow "redo"
      !isRedoEvent(evt) &&
      // allow "undo"
      !isUndoEvent(evt) &&
      // allow "cut"
      !isCutEvent(evt) &&
      // allow "paste"
      !isPasteEvent(evt) &&
      // allow holding down shift
      !evt.shiftKey
    ) {
      return;
    }

    let selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    // ignore invalid DOM selection
    if (!isValidDomSelection(selectionOffsets)) {
      return;
    }
    console.debug('KEYDOWN', evt, selectionOffsets);
    // call "callbacks" with "args" in order until one returns truthy to get a "at most one fires in the list" guarantee
    const first = async (callbacks, args) => {
      for (let i = 0; i < callbacks.length; i++) {
        if (await callbacks[i](args)) {
          return true;
        }
      }
      return false;
    };

    const atLeastOneHandlerFired = await first(
      [
        handleRedo, // redo before undo because undo matches on redo keystrokes
        handleUndo,
        //handleDel, TODO: currently, no support for the 'Del' key
        handleBackspace,
        handleEnter,
        handleCut,
        handlePaste,
        handleSyncToDom,
        handleArrows,
      ],
      {
        evt,
        selectionOffsets,
        documentModel,
        historyManager,
        commitUpdates,
        closeAllEditContentMenus,
        sectionEdit,
        editSectionNode,
        setEditSectionNode: (value) => {
          editSectionNode = value;
        },
        setPost: (value) => {
          postMap = value;
        },
      }
    );

    if (!atLeastOneHandlerFired) {
      console.warn('handleKeyDown - no event handlers were called?');
      return;
    }

    await tick();
    // refresh caret after possible setState() mutations above
    selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    await manageInsertMenu(evt, selectionOffsets);
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
    // if (shouldSkipKeyUp) {
    //   shouldSkipKeyUp = undefined;
    //   return;
    // }
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
    console.debug('MouseUp: ', evt);
    const selectionOffsets = getSelectionOffsetsOrEditSectionNode();

    // close everything by default, sectionEdit() callback will fire after this to override
    await closeAllEditContentMenus();
    await manageInsertMenu(evt, selectionOffsets);
    await manageFormatSelectionMenu(evt, selectionOffsets);
  }

  // SECTION
  // TODO: move this out into "section" helper
  async function insertSection(sectionType, [firstFile] = []) {
    let meta = Map();
    if (sectionType === NODE_TYPE_IMAGE) {
      // TODO: add a loading indicator while uploading
      const { error, data: imageMeta } = await apiClient.uploadImage(
        getImageFileFormData(firstFile, postMap)
      );
      if (error) {
        console.error('Image Upload Error: ', error);
        return;
      }
      meta = Map(imageMeta);
    }
    const historyState = documentModel.update(
      insertMenuNode.set('type', sectionType).set('meta', meta)
    );
    const newSectionId = getLastExecuteIdFromHistory(historyState);
    const executeSelectionOffsets = { startNodeId: newSectionId };
    historyManager.appendToHistoryLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: {
        startNodeId: insertMenuNode.get('id'),
        caretStart: 0,
      },
      historyState,
    });
    await commitUpdates(executeSelectionOffsets);
    if (
      [NODE_TYPE_IMAGE, NODE_TYPE_QUOTE, NODE_TYPE_SPACER].includes(sectionType)
    ) {
      sectionEdit(newSectionId);
    }
  }

  function sectionEdit(sectionId) {
    // noop if this section is already selected
    if (sectionId === editSectionNode.get('id')) {
      return;
    }
    const [sectionDomNode] = document.getElementsByName(sectionId);
    const section = documentModel.getNode(sectionId);
    //if (section.get('type') === NODE_TYPE_SPACER) {
    removeAllRanges();
    //}
    console.log('EDIT SECTION CALLBACK ', sectionId);

    // hide all other menus here because this callback fires last
    // insert menu
    insertMenuNode = Map();
    // format selection menu
    formatSelectionNode = Map();
    formatSelectionModel = Selection();
    formatSelectionModelIdx = -1;
    // hide edit section menu by default
    editSectionNode = section;
    shouldShowEditSectionMenu = section.get('type') !== NODE_TYPE_SPACER;
    editSectionMetaFormTopOffset = sectionDomNode.offsetTop;
  }

  async function updateEditSectionNode(updatedNode, comparisonPath) {
    const historyState = documentModel.update(updatedNode);
    const offsets = { startNodeId: updatedNode.get('id') };
    // some text fields are stored in the node.meta object like image caption, link url, quote fields
    // these text fields will pass a path to differentiate themselves from other actions like image rotate, zoom, etc
    if (comparisonPath) {
      historyManager.appendToHistoryLogWhenNCharsAreDifferent({
        executeSelectionOffsets: offsets,
        unexecuteSelectionOffsets: offsets,
        historyState,
        comparisonPath,
      });
    } else {
      historyManager.appendToHistoryLog({
        executeSelectionOffsets: offsets,
        unexecuteSelectionOffsets: offsets,
        historyState,
      });
    }
    editSectionNode = updatedNode;
    await commitUpdates(getSelectionOffsetsOrEditSectionNode());
  }

  // FORMAT
  // TODO: move this out into "format" helper
  function closeFormatSelectionMenu(selectionOffsets) {
    const { startNodeId, endNodeId, caretEnd } = selectionOffsets;
    if (formatSelectionNode.get('id')) {
      formatSelectionNode = Map();
      formatSelectionModel = Selection();
      formatSelectionModelIdx = -1;
      formatSelectionMenuTopOffset = 0;
      formatSelectionMenuLeftOffset = 0;

      // if we're highlighting across nodes, don't setCaret because user is changing selection size with arrows keys while holding shift
      if (!endNodeId) {
        // caretStart: caretEnd - collapse range and place caret at end
        setCaret({ startNodeId, caretStart: caretEnd });
      }
    }
  }

  async function updateLinkUrl(value) {
    const updatedSelectionModel = formatSelectionModel.set(
      SELECTION_LINK_URL,
      value
    );
    const updatedNode = replaceSelection(
      formatSelectionNode,
      updatedSelectionModel,
      formatSelectionModelIdx
    );
    documentModel.update(updatedNode);
    formatSelectionNode = updatedNode;
    formatSelectionModel = updatedSelectionModel;
    await commitUpdates(getSelectionOffsetsOrEditSectionNode());
  }

  // TODO: show/hide logic for this menu is split up and difficult to understand.
  //  It should be split up based on type of event instead of trying to overload the handlers with too much logic
  async function manageFormatSelectionMenu(evt, selectionOffsets) {
    const { caretStart, caretEnd, startNodeId, endNodeId } = selectionOffsets;
    if (
      // no node
      !startNodeId ||
      !caretEnd ||
      // collapsed caret
      caretStart === caretEnd
    ) {
      if (formatSelectionNode.size > 0) {
        closeFormatSelectionMenu(selectionOffsets);
      }
      return;
    }

    if (endNodeId) {
      // TODO: support highlight across multiple nodes
      console.info(
        '// TODO: format selection across nodes: ',
        selectionOffsets
      );
      closeFormatSelectionMenu();
      return;
    }

    // allow user to hold shift and use arrow keys to adjust selection range
    if (
      !evt.shiftKey &&
      !(evt.metaKey && [KEYCODE_X, KEYCODE_V].includes(evt.keyCode))
    ) {
      stopAndPrevent(evt);
    }

    const range = getRange();
    console.info(
      'SELECTION: ',
      caretStart,
      caretEnd,
      endNodeId,
      range,
      range.getBoundingClientRect()
    );
    const rect = range.getBoundingClientRect();
    const selectedNodeModel = documentModel.getNode(startNodeId);
    // save range offsets because if the selection is marked as a "link" the url input will be focused
    // and the range will be lost
    selectionOffsetsManageFormatSelectionMenu = selectionOffsets;
    const { selections, idx } = getSelectionByContentOffset(
      selectedNodeModel,
      caretStart,
      caretEnd
    );

    formatSelectionNode = selectedNodeModel.setIn(
      ['meta', 'selections'],
      selections
    );
    formatSelectionModel = getSelectionAtIdx(selections, idx);
    formatSelectionModelIdx = idx;
    // NOTE: need to add current vertical scroll position of the window to the
    // rect position to get offset relative to the whole document
    formatSelectionMenuTopOffset = rect.top + window.scrollY;
    formatSelectionMenuLeftOffset = (rect.left + rect.right) / 2;
  }

  async function handleSelectionAction(action) {
    const { historyState, updatedSelection } = doFormatSelection(
      documentModel,
      formatSelectionNode,
      formatSelectionModel,
      formatSelectionModelIdx,
      action
    );
    // formatting doesn't change the SelectionOffsets
    // seems like it could conditionally collapse the selection only when moving from P -> H1 or H2 but, idk???
    historyManager.appendToHistoryLog({
      executeSelectionOffsets: selectionOffsetsManageFormatSelectionMenu,
      unexecuteSelectionOffsets: selectionOffsetsManageFormatSelectionMenu,
      historyState,
    });
    await commitUpdates(selectionOffsetsManageFormatSelectionMenu);

    const updatedNode = documentModel.getNode(
      getLastExecuteIdFromHistory(historyState)
    );
    // need to refresh the selection after update, as a merge might have occured
    // between neighboring selections that now have identical formats
    const { selections } = getSelectionByContentOffset(
      updatedNode,
      selectionOffsetsManageFormatSelectionMenu.caretStart,
      selectionOffsetsManageFormatSelectionMenu.caretEnd
    );
    formatSelectionNode = updatedNode.setIn(['meta', 'selections'], selections);
    // note: this selection index shouldn't have changed.
    formatSelectionModel = getSelectionAtIdx(
      selections,
      formatSelectionModelIdx
    );
    if (updatedSelection.get(SELECTION_ACTION_LINK)) {
      return;
    }
    // this replaces the selection after calling setState
    const replacementRange = replaceRange(
      selectionOffsetsManageFormatSelectionMenu
    );
    // reposition menu since formatting changes move the selection around on the screen
    const rect = replacementRange.getBoundingClientRect();
    // NOTE: need to add current vertical scroll position of the window to the
    // rect position to get offset relative to the whole document
    formatSelectionMenuTopOffset = rect.top + window.scrollY;
    formatSelectionMenuLeftOffset = (rect.left + rect.right) / 2;
  }
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
{#if insertMenuNodeId}
  <InsertSectionMenu
    insertNodeId="{insertMenuNodeId}"
    {insertMenuTopOffset}
    {insertMenuLeftOffset}
    {insertSection}
  />
{/if}
{#if editSectionNode.get('type') === NODE_TYPE_IMAGE && shouldShowEditSectionMenu}
  <EditImageMenu
    offsetTop="{editSectionMetaFormTopOffset}"
    {postMap}
    nodeModel="{editSectionNode}"
    update="{updateEditSectionNode}"
    closeMenu="{() => {
      shouldShowEditSectionMenu = false;
    }}"
  />
{/if}
{#if editSectionNode.get('type') === NODE_TYPE_QUOTE && shouldShowEditSectionMenu}
  <EditQuoteForm
    offsetTop="{editSectionMetaFormTopOffset}"
    nodeModel="{editSectionNode}"
    update="{updateEditSectionNode}"
    closeMenu="{() => {
      shouldShowEditSectionMenu = false;
    }}"
  />
{/if}
{#if formatSelectionNode.get('id')}
  <FormatSelectionMenu
    offsetTop="{formatSelectionMenuTopOffset}"
    offsetLeft="{formatSelectionMenuLeftOffset}"
    nodeModel="{formatSelectionNode}"
    selectionModel="{formatSelectionModel}"
    selectionAction="{handleSelectionAction}"
    {updateLinkUrl}
    closeMenu="{closeFormatSelectionMenu}"
  />
{/if}