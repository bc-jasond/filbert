<script context="module">
  export async function preload({ params }, session) {
    if (!session.user) {
      this.error(404, 'Not found');
      return;
    }

    return {
      postId: params.post,
    };
  }
</script>

<script>
  export let postId;

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
  let shouldSkipKeyUp;
  let apiClient;

  let documentModel;
  let historyManager;
  let nodesByIdMapInternal = Map();

  import { fromJS, Map } from 'immutable';
  import { goto } from '@sapper/app';
  import { tick, onMount, onDestroy } from 'svelte';

  import { getMapWithId } from '@filbert/util';
  import { NEW_POST_URL_ID } from '@filbert/constants';
  import { NODE_TYPE_H1 } from '@filbert/document';

  import {
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
  } from '../../common/dom';

  import { getApiClientInstance } from '../../common/api-client';
  import { currentPost } from '../../stores';

  import {
    KEYCODE_DOWN_ARROW,
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_LEFT_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_UP_ARROW,
    KEYCODE_V,
    KEYCODE_X,
  } from '@filbert/constants';
  import {
    NODE_TYPE_IMAGE,
    NODE_TYPE_P,
    NODE_TYPE_QUOTE,
    NODE_TYPE_SPACER,
  } from '@filbert/document';
  import {
    Selection,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
  } from '@filbert/selection';
  import { DocumentModel, getFirstNode } from '@filbert/document';
  import { HistoryManager } from '@filbert/history';
  import {
    getCanonicalFromTitle,
    stopAndPrevent,
    isBrowser,
  } from '../../common/utils';
  import Document from '../../document-components/Document.svelte';

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
  } from '@filbert/selection';
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
    if (!isBrowser()) {
      return;
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', manageInsertMenu);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('input', handleInput);
    window.removeEventListener('paste', handlePasteWrapper);
    window.removeEventListener('cut', handleCutWrapper);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  $: insertMenuNodeId = insertMenuNode.get('id');
  $: apiClient = isBrowser() && getApiClientInstance();
  $: (async function instantiatePost(postIdInternal) {
    if (!isBrowser()) {
      return;
    }

    if (postIdInternal === NEW_POST_URL_ID) {
      console.log('UNSAVED Placeholder Post');
      clearInterval(batchSaveIntervalId);
      $currentPost = Map();
      documentModel = DocumentModel(postIdInternal, Map());
      historyManager = HistoryManager(postIdInternal, apiClient);
      const historyState = documentModel.insert(NODE_TYPE_H1);
      const newSectionId = documentModel.getLastInsertId();
      const selectionOffsets = { startNodeId: newSectionId, caretStart: 0 };
      historyManager.appendToHistoryLog({
        selectionOffsets,
        historyState,
      });
      // Sapper calls document.activeElement.blur() on navigation for some reason...
      tick().then(() => {
        commitUpdates(selectionOffsets);
      });
      return;
    }

    if (parseInt(postIdInternal) === $currentPost.get('id')) {
      return;
    }

    const {
      error,
      data: { post, contentNodes, selectionOffsets = {} } = {},
    } = await apiClient.get(`/edit/${postIdInternal}`);

    if (error) {
      console.error('Error Loading Post id: ', postIdInternal);
      return;
    }

    console.info('RE-INSTANTIATE POST', post);
    $currentPost = fromJS(post);
    documentModel = DocumentModel(post.id, contentNodes);
    historyManager = HistoryManager(post.id, apiClient);
    nodesByIdMapInternal = documentModel.getNodes();
    clearInterval(batchSaveIntervalId);
    batchSaveIntervalId = setInterval(batchSave, 3000);
    await commitUpdates(selectionOffsets);
  })(postId);

  onMount(() => {
    registerTopLevelEventHandlers();
  });

  onDestroy(() => {
    deregisterTopLevelEventHandlers();
    clearInterval(batchSaveIntervalId);
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
    // will save current document state from history with the newly created postId
    await historyManager.saveAndClearLocalHistoryLog(postId);
    // huh, aren't we on /edit? - this is for going from /edit/new -> /edit/123...
    await goto(`/edit/${postId}`, { replaceState: true });
  }

  async function batchSave() {
    const { updatedPost } = await historyManager.saveAndClearLocalHistoryLog();
    if (updatedPost) {
      // the last cursor position and current history position are among things that could have changed
      $currentPost = updatedPost;
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
    await tick();
    insertMenuNode = Map();

    // on insert,set editSectionNode if not already set.
    if (startNodeId && documentModel.isMetaType(startNodeId)) {
      sectionEdit(startNodeId);
      // no more caret work necessary for Meta nodes
      return;
    }
    // no more caret work if we're typing a url in the formatSelection menu
    if (formatSelectionModel.get(SELECTION_ACTION_LINK)) {
      return;
    }

    // if a menu isn't open, re-place the caret
    if (!caretEnd || caretStart === caretEnd) {
      setCaret(selectionOffsets);
    } else {
      replaceRange(selectionOffsets);
    }
    //manageInsertMenu({}, selectionOffsets);
    await manageFormatSelectionMenu({}, selectionOffsets);
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

    // TODO: return selectionOffsets instead of boolean?
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
      }
    );

    if (!atLeastOneHandlerFired) {
      console.warn('handleKeyDown - no event handlers were called?');
      return;
    }

    await tick();
    // refresh caret after possible document state mutations above
    selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    await manageInsertMenu(evt, selectionOffsets);
    await manageFormatSelectionMenu(evt, selectionOffsets);

    // create new post?
    // special case for creating a new document on "Enter"
    if (
      evt.keyCode === KEYCODE_ENTER &&
      (!$currentPost.get('id') || $currentPost.get('id') === NEW_POST_URL_ID)
    ) {
      await createNewPost();
    }
  }

  async function handleKeyUp(evt) {
    // TODO: this is to coordinate with closing the Format Selection menu
    // without it, the menu would reopen after the user hits ESC?
    if (shouldSkipKeyUp) {
      shouldSkipKeyUp = undefined;
      return;
    }
    console.debug('KEYUP');
    const selectionOffsets = getSelectionOffsetsOrEditSectionNode();
    await manageFormatSelectionMenu(evt, selectionOffsets);
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
    // hitting backspace with a Selection is an input event but, not when the caret is collapsed?
    if (evt.inputType === 'deleteContentBackward') {
      console.debug('INPUT (Backspace with Selection)', evt);
      await handleBackspace({
        evt,
        // selectionOffsets will be collapsed here, use the last saved offsets during manageFormatSelectionMenu()
        selectionOffsets: selectionOffsetsManageFormatSelectionMenu,
        documentModel,
        historyManager,
        commitUpdates,
        setEditSectionNode: (value) => {
          editSectionNode = value;
        },
      });
      return;
    }
    console.debug('INPUT (aka: sync back from DOM)', evt);
    // for emoji keyboard insert & spellcheck correct
    const {
      selectionOffsets: executeSelectionOffsets,
      historyState,
    } = syncFromDom(documentModel, selectionOffsets, evt);
    historyManager.appendToHistoryLog({
      selectionOffsets,
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
        getImageFileFormData(firstFile, $currentPost)
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
    const newSectionId = documentModel.getLastInsertId();
    const selectionOffsets = { startNodeId: newSectionId };
    historyManager.appendToHistoryLog({
      selectionOffsets,
      historyState,
    });
    await commitUpdates(selectionOffsets);
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
    if (!section.size) {
      console.warn('BAD Section', section.toJS());
    }
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
    const selectionOffsets = { startNodeId: updatedNode.get('id') };
    // some text fields are stored in the node.meta object like image caption, link url, quote fields
    // these text fields will pass a path to differentiate themselves from other actions like image rotate, zoom, etc
    if (comparisonPath) {
      historyManager.appendToHistoryLogWhenNCharsAreDifferent({
        selectionOffsets,
        historyState,
        comparisonPath,
      });
    } else {
      historyManager.appendToHistoryLog({
        selectionOffsets,
        historyState,
      });
    }
    editSectionNode = updatedNode;
    await commitUpdates(getSelectionOffsetsOrEditSectionNode());
  }

  // FORMAT
  // TODO: move this out into "format" helper
  function closeFormatSelectionMenu() {
    shouldSkipKeyUp = true;
    formatSelectionNode = Map();
    formatSelectionModel = Selection();
    formatSelectionModelIdx = -1;
    formatSelectionMenuTopOffset = 0;
    formatSelectionMenuLeftOffset = 0;
    if (selectionOffsetsManageFormatSelectionMenu) {
      setCaret(selectionOffsetsManageFormatSelectionMenu);
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
    formatSelectionNode = updatedNode;
    formatSelectionModel = updatedSelectionModel;

    const historyState = documentModel.update(updatedNode);
    // TODO: when NCharsAreDifferent - current linked list representation doesn't lend itself well to comparisonPath
    historyManager.appendToHistoryLog({
      selectionOffsets: selectionOffsetsManageFormatSelectionMenu,
      historyState,
    });
    await commitUpdates(selectionOffsetsManageFormatSelectionMenu);
  }

  // TODO: show/hide logic for this menu is split up and difficult to understand.
  //  It should be split up based on type of event instead of trying to overload the handlers with too much logic
  async function manageFormatSelectionMenu(evt, selectionOffsets) {
    // allow user to hold shift and use arrow keys to adjust selection range
    if (evt.shiftKey) {
      return;
    }
    // FormatSelectionMenu has event handlers that interfere with cut / paste
    if (isCutEvent(evt) || isPasteEvent(evt)) {
      closeFormatSelectionMenu();
      return;
    }
    const { caretStart, caretEnd, startNodeId, endNodeId } = selectionOffsets;
    if (
      // no node
      !startNodeId ||
      !caretEnd ||
      // collapsed caret
      caretStart === caretEnd
    ) {
      if (formatSelectionNode.size > 0) {
        // NOTE: unset this selectionOffsets cache - at least one known issue is "select and type" - this value will setCaret() to a stale value
        selectionOffsetsManageFormatSelectionMenu = undefined;
        closeFormatSelectionMenu();
      }
      return;
    }

    if (endNodeId) {
      // TODO: support highlight across multiple nodes
      console.info(
        '// TODO: format selection across nodes: ',
        selectionOffsets
      );
      // NOTE: unset this selectionOffsets cache - another issue is you can't select across multiple nodes for cut/paste - this value will setCaret() to a stale value
      selectionOffsetsManageFormatSelectionMenu = undefined;
      closeFormatSelectionMenu();
      return;
    }

    stopAndPrevent(evt);

    const range = getRange();
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

    console.info(
      'manageFormatSelectionMenu: ',
      caretStart,
      caretEnd,
      endNodeId,
      selections.toJS(),
      idx,
      range,
      range.getBoundingClientRect()
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
      selectionOffsets: selectionOffsetsManageFormatSelectionMenu,
      historyState,
    });
    await commitUpdates(selectionOffsetsManageFormatSelectionMenu);

    const updatedNode = documentModel.getNode(documentModel.getLastInsertId());
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
