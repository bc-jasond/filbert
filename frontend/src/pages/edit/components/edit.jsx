import React from 'react';
import styled from 'styled-components';
import { fromJS, Map } from 'immutable';
import { Redirect } from 'react-router-dom';

import { apiGet, apiPost, uploadImage } from '../../../common/fetch';
import { Article } from '../../../common/components/layout-styled-components';
import { viewport7 } from '../../../variables.css';
import Header from '../../header';
import Footer from '../../footer';

import {
  getCanonicalFromTitle,
  Selection,
  stopAndPrevent,
} from '../../../common/utils';
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
  selectionOffsetsAreEqual,
  setCaret,
} from '../../../common/dom';

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
  NEW_POST_URL_ID,
  NODE_TYPE_IMAGE,
  NODE_TYPE_P,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
  PAGE_NAME_EDIT,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL,
} from '../../../common/constants';

import Document from '../../../common/components/document.component';
import DocumentModel, { getFirstNode } from '../document-model';
import HistoryManager, {
  getLastExecuteIdFromHistory,
} from '../history-manager';

import { doDelete, doDeleteMetaType, doMerge } from '../editor-commands/delete';
import { syncFromDom, syncToDom } from '../editor-commands/dom-sync';
import { doPaste } from '../editor-commands/paste';
import { doSplit } from '../editor-commands/split';

import {
  getSelectionAtIdx,
  getSelectionByContentOffset,
  replaceSelection,
} from '../selection-helpers';
import { doFormatSelection } from '../editor-commands/format-selection';

import InsertSectionMenu from './insert-section-menu';
import EditImageForm from './edit-image-form';
import EditQuoteForm from './edit-quote-form';
import FormatSelectionMenu from './format-selection-menu';

import Page404 from '../../404';

const ArticleStyled = styled(Article)`
  @media (max-width: ${viewport7}) {
    padding: 40px 80px;
  }
`;

export default class EditPost extends React.Component {
  selectionOffsets = {};

  batchSaveIntervalId;

  constructor(props) {
    super(props);

    this.state = {
      post: Map(),
      nodesById: Map(),
      shouldShow404: false,
      shouldRedirect: false,
      insertMenuNode: Map(),
      insertMenuTopOffset: 0,
      insertMenuLeftOffset: 0,
      editSectionNode: Map(),
      shouldShowEditSectionMenu: false,
      editSectionMetaFormTopOffset: 0,
      formatSelectionLastOffsets: {},
      formatSelectionNode: Map(),
      formatSelectionModel: Selection(),
      formatSelectionModelIdx: -1,
    };
  }

  async componentDidMount() {
    console.debug('EDIT - didMount');
    this.registerWindowEventHandlers();
    const {
      props: {
        params: { id },
      },
    } = this;
    if (id === NEW_POST_URL_ID) {
      this.newPost();
      return;
    }
    await this.loadPost();
  }

  async componentDidUpdate(prevProps) {
    const params = this.props?.params;
    const id = params?.id;
    const prevId = prevProps?.params?.id;
    if (id === prevId) {
      return;
    }
    console.debug('EDIT - didUpdate');
    /* eslint-disable-next-line react/no-did-update-set-state */
    this.setState({
      shouldRedirect: false,
      shouldShow404: false,
      insertMenuNode: Map(),
    });
    if (id === NEW_POST_URL_ID) {
      this.newPost();
      return;
    }
    await this.loadPost();
  }

  async componentWillUnmount() {
    this.unregisterWindowEventHandlers();
    clearInterval(this.batchSaveIntervalId);
  }

  registerWindowEventHandlers = () => {
    window.addEventListener('resize', this.manageInsertMenu);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('input', this.handleInput);
    window.addEventListener('paste', this.handlePaste);
    window.addEventListener('cut', this.handleCut);
  };

  unregisterWindowEventHandlers = () => {
    window.removeEventListener('resize', this.manageInsertMenu);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('input', this.handleInput);
    window.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('cut', this.handleCut);
  };

  postHasntBeenSavedYet = () => {
    const {
      state: { post },
    } = this;
    const postId = post.get('id');
    return !postId || postId === NEW_POST_URL_ID;
  };

  newPost = () => {
    console.debug('New PostNew PostNew PostNew PostNew PostNew Post');
    this.historyManager = HistoryManager(NEW_POST_URL_ID);
    this.documentModel = DocumentModel(NEW_POST_URL_ID);
    const startNodeId = getFirstNode(this.documentModel.getNodes()).get('id');
    this.setState({ post: Map() });
    this.commitUpdates({ startNodeId });
  };

  createNewPost = async () => {
    const title = getFirstHeadingContent();
    // get canonical - chop title, add hash
    const canonical = getCanonicalFromTitle(title);
    // POST to /post
    const { error, data: { postId } = {} } = await apiPost('/post', {
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
      return;
    }
    // copy placeholder history
    const pendingHistory = this.historyManager.getHistoryQueue();
    // re-instantiate HistoryManager with pendingHistory for saveContentBatch()
    this.historyManager = HistoryManager(postId, pendingHistory);
    // will save current document state from history
    await this.historyManager.saveContentBatch();
    // huh, aren't we on /edit? - this is for going from /edit/new -> /edit/123...
    this.setState({ shouldRedirect: `/edit/${postId}` });
  };

  batchSave = async () => {
    const { updatedPost } = await this.historyManager.saveContentBatch();
    if (updatedPost) {
      this.setState({ post: fromJS(updatedPost) });
    }
  };

  loadPost = async () => {
    const {
      error,
      data: {
        post,
        contentNodes,
        selectionOffsets: { startNodeId, caretStart } = {},
      } = {},
    } = await apiGet(`/edit/${this.props?.params?.id}`);
    if (error) {
      console.error(error);
      this.setState({ nodesById: Map(), shouldShow404: true });
      return;
    }
    const postMap = fromJS(post);
    this.historyManager = HistoryManager(postMap.get('id'));
    this.documentModel = DocumentModel(postMap.get('id'), contentNodes);
    this.batchSaveIntervalId = setInterval(this.batchSave, 3000);
    this.setState(
      {
        post: postMap,
        nodesById: this.documentModel.getNodes(),
        shouldShow404: false,
      },
      async () => {
        setCaret({ startNodeId, caretStart });
        await this.manageInsertMenu();
      }
    );
  };

  closeAllEditContentMenus = async () => {
    return new Promise((resolve) => {
      this.setState(
        {
          formatSelectionNode: Map(),
          editSectionNode: Map(),
          shouldShowEditSectionMenu: false,
        },
        resolve
      );
    });
  };

  /**
   * moves the undo cursor position
   * applies the unexecute state to the document
   * IF user makes edits after an undo - all history entries after this current one need to be marked deleted before adding another one
   * @returns {Promise<void>}
   */
  undo = async () => {
    const {
      state: { nodesById },
    } = this;
    const undoResult = await this.historyManager.undo(nodesById);
    // already at beginning of history? or error?
    if (undoResult.size === 0) {
      return;
    }
    const updatedNodesById = undoResult.get('nodesById', Map());
    const historyOffsets = undoResult.get('selectionOffsets', Map());
    const updatedPost = undoResult.get('updatedPost', Map());
    if (updatedNodesById.size === 0) {
      return;
    }

    console.info('UNDO!', undoResult.toJS());
    // Right now, nothing depends on changes to the "post" object but, seems like bad form to
    // not update it given the meta data will have changed (currentUndoHistoryId)
    this.setState({ post: updatedPost });
    this.documentModel.setNodes(updatedNodesById);
    await this.commitUpdates(historyOffsets.toJS());
  };

  redo = async () => {
    const {
      state: { nodesById },
    } = this;
    const redoResult = await this.historyManager.redo(nodesById);
    // already at end of history?
    if (redoResult.size === 0) {
      return;
    }
    const updatedNodesById = redoResult.get('nodesById', Map());
    const historyOffsets = redoResult.get('selectionOffsets', Map());
    const updatedPost = redoResult.get('updatedPost', Map());
    if (updatedNodesById.size === 0) {
      return;
    }

    console.info('REDO!', redoResult.toJS());
    this.setState({ post: updatedPost });
    this.documentModel.setNodes(updatedNodesById);
    await this.commitUpdates(historyOffsets.toJS());
  };

  commitUpdates = (selectionOffsets) => {
    const { startNodeId, caretStart, caretEnd } = selectionOffsets;
    const {
      state: { editSectionNode, formatSelectionModel },
    } = this;
    // TODO: optimistically saving updated nodes with no error handling - look ma, no errors!
    return new Promise((resolve /* , reject */) => {
      // roll with state changes TODO: handle errors - roll back?
      const newState = {
        nodesById: this.documentModel.getNodes(),
        insertMenuNode: Map(),
      };
      // on insert,set editSectionNode if not already set.
      if (
        startNodeId &&
        this.documentModel.isMetaType(startNodeId) &&
        editSectionNode.get('id') !== startNodeId
      ) {
        newState.editSectionNode = this.documentModel.getNode(startNodeId);
      }
      this.setState(newState, async () => {
        // no more caret work necessary for Meta nodes
        if (
          this.documentModel.isMetaType(startNodeId) ||
          // OR if we're typing a url in the formatSelection menu
          formatSelectionModel.get(SELECTION_ACTION_LINK)
        ) {
          resolve();
          return;
        }
        // if a menu isn't open, re-place the caret
        if (!caretEnd || caretStart === caretEnd) {
          setCaret(selectionOffsets);
        } else {
          replaceRange(selectionOffsets);
        }
        this.manageInsertMenu({}, selectionOffsets);
        this.manageFormatSelectionMenu({}, selectionOffsets);
        resolve();
      });
    });
  };

  handleEditSectionMenu = async (evt) => {
    if (![KEYCODE_ENTER, KEYCODE_ESC].includes(evt.keyCode)) {
      return;
    }
    const {
      state: { editSectionNode, shouldShowEditSectionMenu },
    } = this;
    // if there's no currently selected MetaType node or it's a spacer (no menu for spacer) we're done.
    if (
      !editSectionNode.get('id') ||
      editSectionNode.get('type') === NODE_TYPE_SPACER
    ) {
      return;
    }
    console.debug('EDIT SECTION MENU');
    await new Promise((resolve) => {
      this.setState(
        { shouldShowEditSectionMenu: !shouldShowEditSectionMenu },
        resolve
      );
    });
  };

  // return the prev or next node if the caret is at the "edge" of a paragraph
  // and the user hits the corresponding arrow key
  getNeighborOnArrowNavigation = (evt, selectionOffsets) => {
    const { startNodeId } = selectionOffsets;
    const currentNode = this.documentModel.getNode(startNodeId);
    let neighborNode = Map();
    const [
      isAtTop,
      isAtEnd,
      isAtBottom,
      isAtStart,
    ] = caretIsOnEdgeOfParagraphText();
    if (
      (evt.keyCode === KEYCODE_UP_ARROW && isAtTop) ||
      (evt.keyCode === KEYCODE_LEFT_ARROW &&
        // NOTE: if the content is empty, there will be a ZERO_LENGTH char and user would
        // have to hit left twice without this code
        (isAtStart || currentNode.get('content', '').length === 0))
    ) {
      neighborNode = this.documentModel.getPrevNode(startNodeId);
    } else if (
      (evt.keyCode === KEYCODE_DOWN_ARROW && isAtBottom) ||
      (evt.keyCode === KEYCODE_RIGHT_ARROW &&
        (isAtEnd || currentNode.get('content', '').length === 0))
    ) {
      neighborNode = this.documentModel.getNextNode(startNodeId);
    }
    return neighborNode;
  };

  // Intercept arrow keys when moving into or out of MetaType nodes
  // no-op otherwise to allow native browser behaviour inside contenteditable text
  handleArrows = async (evt, selectionOffsets) => {
    if (
      ![
        KEYCODE_UP_ARROW,
        KEYCODE_DOWN_ARROW,
        KEYCODE_LEFT_ARROW,
        KEYCODE_RIGHT_ARROW,
      ].includes(evt.keyCode)
    ) {
      return;
    }
    console.debug('ARROW');
    const { caretStart, caretEnd } = selectionOffsets;

    // collapse range if there's highlighted selection and the user hits an arrow
    if (
      caretStart !== caretEnd &&
      // ignore shift key because user could be in the middle of adjusting a selection
      !evt.shiftKey
    ) {
      if ([KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)) {
        // up or left - collapse to start
        getRange().collapse(true);
      } else {
        // down or right - collapse to end
        getRange().collapse(false);
      }
      stopAndPrevent(evt);
      return;
    }

    const {
      state: { editSectionNode, insertMenuNode },
    } = this;
    // if there's no currently selected MetaType node
    if (!editSectionNode.get('id')) {
      // see if we've entered one
      const neighborNode = this.getNeighborOnArrowNavigation(
        evt,
        selectionOffsets
      );
      if (!neighborNode.get('id')) {
        // we won't be leaving the current node, let contenteditable handle the caret
        return;
      }
      stopAndPrevent(evt);
      if (this.documentModel.isMetaType(neighborNode.get('id'))) {
        await this.sectionEdit(neighborNode.get('id'));
        return;
      }
      // NOTE: unset insertMenuNode here or arrow navigation breaks
      if (
        insertMenuNode.size > 0 &&
        neighborNode.get('id') !== insertMenuNode.get('id')
      ) {
        await new Promise((resolve) => {
          this.setState({ insertMenuNode: Map() }, resolve);
        });
      }
      setCaret({
        startNodeId: neighborNode.get('id'),
        caretStart: [KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)
          ? -1
          : 0,
      });
      return;
    }
    // we're currently inside a selected MetaType node
    // only leave edit section menu if user hit's up / down arrow
    // user can still use tab to move vertically between inputs
    const {
      state: { shouldShowEditSectionMenu },
    } = this;
    if (
      shouldShowEditSectionMenu &&
      ![KEYCODE_UP_ARROW, KEYCODE_DOWN_ARROW].includes(evt.keyCode)
    ) {
      return;
    }
    stopAndPrevent(evt);
    if ([KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)) {
      const prevNode = this.documentModel.getPrevNode(
        editSectionNode.get('id')
      );
      if (!prevNode.get('id')) {
        return;
      }
      if (this.documentModel.isMetaType(prevNode.get('id'))) {
        await this.sectionEdit(prevNode.get('id'));
        return;
      }
      await this.closeAllEditContentMenus();
      setCaret({ startNodeId: prevNode.get('id') });
      return;
    }
    // down or right arrows
    const nextNode = this.documentModel.getNextNode(editSectionNode.get('id'));
    if (!nextNode.get('id')) {
      return;
    }
    if (this.documentModel.isMetaType(nextNode.get('id'))) {
      await this.sectionEdit(nextNode.get('id'));
      return;
    }
    await this.closeAllEditContentMenus();
    setCaret({ startNodeId: nextNode.get('id'), caretStart: 0 });
  };

  handleBackspace = async (evt, selectionOffsets) => {
    // if the caret is collapsed, only let the "backspace" key through...
    // otherwise, if there are any other key strokes that aren't control keys - delete the selection!
    if (
      evt.keyCode !== KEYCODE_BACKSPACE ||
      // don't delete the section while editing its fields :) !
      this.state?.shouldShowEditSectionMenu ||
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
    if (this.documentModel.isMetaType(startNodeId)) {
      const {
        historyState: historyStateDeleteMetaType,
        executeSelectionOffsets: executeSelectionOffsetsDeleteMetaType,
      } = doDeleteMetaType(this.documentModel, selectionOffsets);
      historyState.push(...historyStateDeleteMetaType);
      executeSelectionOffsets = executeSelectionOffsetsDeleteMetaType;

      this.historyManager.appendToNodeUpdateLog({
        executeSelectionOffsets,
        unexecuteSelectionOffsets: selectionOffsets,
        state: historyState,
      });
      await this.commitUpdates(executeSelectionOffsets);
      return;
    }

    const hasContentToDelete = endNodeId || caretStart > 0 || caretEnd;

    // is there any content to delete?
    if (hasContentToDelete) {
      const {
        historyState: historyStateDelete,
        executeSelectionOffsets: executeSelectionOffsetsDelete,
      } = doDelete(this.documentModel, selectionOffsets);
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
      } = doMerge(this.documentModel, executeSelectionOffsets);
      historyState.push(...historyStateMerge);
      executeSelectionOffsets = executeSelectionOffsetsMerge;
    }

    // since this handler catches keystrokes *before* DOM updates, deleting one char will look like a diff length of 0
    const didDeleteContentInOneNode = !endNodeId && hasContentToDelete;

    if (didDeleteContentInOneNode) {
      this.historyManager.appendToNodeUpdateLogWhenNCharsAreDifferent({
        executeSelectionOffsets,
        unexecuteSelectionOffsets: selectionOffsets,
        state: historyState,
        comparisonPath: ['content'],
      });
    } else {
      this.historyManager.appendToNodeUpdateLog({
        executeSelectionOffsets,
        unexecuteSelectionOffsets: selectionOffsets,
        state: historyState,
      });
    }

    // clear the selected format node when deleting the highlighted selection
    // NOTE: must wait for state to have been set or setCaret will check stale values
    this.closeAllEditContentMenus();
    await this.commitUpdates(executeSelectionOffsets);
  };

  /**
   * ENTER
   * @param evt
   * @param selectionOffsets
   * @returns {Promise<void>}
   */
  handleEnter = async (evt, selectionOffsets) => {
    if (
      evt.keyCode !== KEYCODE_ENTER ||
      // ignore if there's a selected MetaType node's menu is open
      this.state?.shouldShowEditSectionMenu ||
      // invalid dom selection
      !isValidDomSelection(selectionOffsets)
    ) {
      return;
    }

    stopAndPrevent(evt);

    // perform editor commands
    const { executeSelectionOffsets, historyState } = doSplit(
      this.documentModel,
      selectionOffsets
    );
    // create history log entry
    this.historyManager.appendToNodeUpdateLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      state: historyState,
    });
    // special case for creating a new document on "Enter"
    if (this.postHasntBeenSavedYet()) {
      await this.createNewPost();
      return;
    }
    await this.closeAllEditContentMenus();
    await this.commitUpdates(executeSelectionOffsets);
  };

  /**
   * Capture edit intent one keystroke at a time.  Update JS Model then let React selectively re-render DOM
   *
   */
  handleSyncToDom = async (evt, selectionOffsets) => {
    // don't send updates for control keys
    if (
      isControlKey(evt.keyCode) ||
      // stopped by another handler like Backspace or Enter
      evt.defaultPrevented ||
      // contentEditable is not the srcTarget
      evt.target.id !== 'filbert-edit-container' ||
      // ignore "paste" - propagation hasn't been stopped because it would cancel the respective "paste", "cut" events
      this.pasteHistoryState ||
      // ignore "cut"
      this.cutHistoryState ||
      // invalid selection
      !isValidDomSelection(selectionOffsets)
    ) {
      return;
    }
    stopAndPrevent(evt);

    const {
      state: { editSectionNode },
    } = this;
    if (editSectionNode.get('id')) {
      return;
    }
    const historyState = [];
    // select-and-type ?? delete selection first
    if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
      const { historyState: historyStateDelete } = doDelete(
        this.documentModel,
        selectionOffsets
      );
      historyState.push(...historyStateDelete);
    }
    // sync keystroke to DOM
    const {
      historyState: historyStateSync,
      executeSelectionOffsets,
    } = syncToDom(this.documentModel, selectionOffsets, evt);
    historyState.push(...historyStateSync);

    // assumes content update (of one char) on a single node, only create an entry every so often
    if (historyState.length === 1) {
      this.historyManager.appendToNodeUpdateLogWhenNCharsAreDifferent({
        unexecuteSelectionOffsets: selectionOffsets,
        executeSelectionOffsets,
        state: historyState,
        comparisonPath: ['content'],
      });
    } else {
      // we did more than a simple content update to one node, save an entry
      this.historyManager.flushPendingNodeUpdateLogEntry();
      this.historyManager.appendToNodeUpdateLog({
        unexecuteSelectionOffsets: selectionOffsets,
        executeSelectionOffsets,
        state: historyState,
      });
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent??? 😞 so we place it back with JS...
    await this.closeAllEditContentMenus();
    await this.commitUpdates(executeSelectionOffsets);
  };

  // MAIN "ON" EVENT CALLBACKS
  getSelectionOffsetsOrEditSectionNode = () => {
    const {
      state: { editSectionNode },
    } = this;

    if (editSectionNode.size > 0) {
      return {
        startNodeId: editSectionNode.get('id'),
        caretStart: 0,
        caretEnd: 0,
      };
    }
    // TODO: style MetaType nodes that have been selected so user can tell
    return getHighlightedSelectionOffsets();
  };

  handleKeyDown = async (evt) => {
    // redo
    if (evt.keyCode === KEYCODE_Z && evt.shiftKey && evt.metaKey) {
      this.redo();
      stopAndPrevent(evt);
      return;
    }
    // undo
    if (evt.keyCode === KEYCODE_Z && evt.metaKey) {
      this.undo();
      stopAndPrevent(evt);
      return;
    }
    // ignore shift and option - don't override hard-refresh!
    if (evt.metaKey && evt.shiftKey) {
      return;
    }
    if (
      // ignore control or modifier keys
      // unless related to a supported destructive operation like: "cut" or "paste"
      (evt.metaKey || isControlKey(evt.keyCode)) &&
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
      !(evt.metaKey && evt.keyCode === KEYCODE_X) &&
      // allow "paste"
      !(evt.metaKey && evt.keyCode === KEYCODE_V) &&
      // allow holding down shift
      !evt.shiftKey
    ) {
      return;
    }

    console.debug('KEYDOWN', evt, this.state);
    let selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    // TODO this.handleDel(evt); // currently, no support for the 'Del' key
    await this.handleBackspace(evt, selectionOffsets);
    await this.handleEnter(evt, selectionOffsets);
    await this.handlePaste(evt, selectionOffsets);
    await this.handleCut(evt, selectionOffsets);
    await this.handleSyncToDom(evt, selectionOffsets);
    await this.handleArrows(evt, selectionOffsets);
    // refresh caret after possible setState() mutations above
    selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    await this.handleEditSectionMenu(evt);
    await this.manageInsertMenu(evt, selectionOffsets);
    await this.manageFormatSelectionMenu(evt, selectionOffsets);
  };

  handleKeyUp = async (evt) => {
    const {
      state: { formatSelectionModel },
    } = this;
    if (
      formatSelectionModel.get(SELECTION_ACTION_LINK) ||
      (!evt.shiftKey && !isControlKey(evt.keyCode))
    ) {
      return;
    }
    console.debug('KEYUP');
    const selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    await this.manageFormatSelectionMenu(evt, selectionOffsets);
  };

  handleInput = async (evt) => {
    // any control keys being held down?
    if (
      evt.metaKey ||
      // cross-event coordination
      this.cutHistoryState ||
      this.pasteHistoryState
    ) {
      // since evt.inputType ('inputFromPaste','deleteFromCut', etc.) isn't compatible with Edge
      this.pasteHistoryState = undefined;
      this.cutHistoryState = undefined;
      return;
    }
    const {
      state: { editSectionNode },
    } = this;
    // if there's a MetaNode selected, bail
    if (editSectionNode.get('id')) {
      return;
    }
    const selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    // if the caret isn't on a node with an id, bail
    if (!selectionOffsets.startNodeId) {
      return;
    }
    console.debug('INPUT (aka: sync back from DOM)');
    // for emoji keyboard insert & spellcheck correct
    const { executeSelectionOffsets, historyState } = syncFromDom(
      this.documentModel,
      selectionOffsets,
      evt
    );
    this.historyManager.appendToNodeUpdateLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      state: historyState,
    });

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    await this.commitUpdates(executeSelectionOffsets);
  };

  handleMouseUp = async (evt) => {
    // console.debug('MouseUp: ', evt)
    const selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    evt.persist(); // because of awaits below
    // close everything by default, this.sectionEdit() callback will fire after this to override
    await this.closeAllEditContentMenus();
    await this.manageInsertMenu(evt, selectionOffsets);
    await this.manageFormatSelectionMenu(evt, selectionOffsets);
  };

  handleCut = async (evt, selectionOffsetsArg) => {
    if (evt.type !== 'cut' && !(evt.metaKey && evt.keyCode === KEYCODE_X)) {
      return;
    }
    console.debug('CUT', evt.type, evt.metaKey, evt.keyCode);
    this.cutHistoryState = [];
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const { caretStart, caretEnd } = selectionOffsets;
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "cut" with clipboard data...
    if (evt.type !== 'cut') {
      // save these to pass to commitUpdates for undo history
      this.unexecuteSelectionOffsets = selectionOffsets;
      if (caretStart !== caretEnd) {
        const { historyState, executeSelectionOffsets } = doDelete(
          this.documentModel,
          selectionOffsets
        );
        this.executeSelectionOffsets = executeSelectionOffsets;
        this.cutHistoryState.push(...historyState);
      }
      return;
    }
    // NOTE: have to manually set selection string into clipboard since we're cancelling the event
    // TODO: how to handle undo history with this clipboard data?  Should we setData() on undo?
    //  or just manage the delete above?
    const selectionString = document.getSelection().toString();
    console.debug('CUT selection', selectionString);
    evt.clipboardData.setData('text/plain', selectionString);

    this.historyManager.appendToNodeUpdateLog({
      executeSelectionOffsets: this.executeSelectionOffsets,
      unexecuteSelectionOffsets: this.unexecuteSelectionOffsets,
      state: this.cutHistoryState,
    });
    // NOTE: if we stopPropagation and preventDefault on the 'keydown' event, they'll cancel the 'cut' event too
    // so don't move this up
    stopAndPrevent(evt);

    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    await this.commitUpdates(this.executeSelectionOffsets);
  };

  handlePaste = async (evt, selectionOffsetsArg) => {
    // NOTE: this handler needs to pass through twice on a "paste" event
    // 1st: on "keydown" - this is to handle deleting selected text TODO: why? let the keydown noop
    // 2nd: on "paste" - now that the selection is clear, paste in the text
    if (evt.type !== 'paste' && !(evt.metaKey && evt.keyCode === KEYCODE_V)) {
      return;
    }
    // don't override pasting into inputs of menus
    const {
      state: { shouldShowEditSectionMenu, formatSelectionModel },
    } = this;
    // format selection menu is open, and the link url input is visible
    if (
      shouldShowEditSectionMenu ||
      formatSelectionModel.get(SELECTION_ACTION_LINK)
    ) {
      return;
    }

    // this is to bypass the "keyup" & "input" handlers
    this.pasteHistoryState = [];

    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "paste" with clipboard data...
    if (evt.type !== 'paste') {
      // for undo history - need to store the "first" selections, aka before the delete operation
      this.unexecuteSelectionOffsets = selectionOffsets;
      if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
        const { historyState } = doDelete(this.documentModel, selectionOffsets);
        this.pasteHistoryState.push(...historyState);
      }
      return;
    }
    // NOTE: if these get called on the 'keydown' event, they'll cancel the 'paste' event
    stopAndPrevent(evt);

    const { executeSelectionOffsets, historyState } = doPaste(
      this.documentModel,
      selectionOffsets,
      evt.clipboardData
    );
    this.pasteHistoryState.push(...historyState);
    // TODO: paste into Meta Type nodes isn't supported
    if (!executeSelectionOffsets) {
      return;
    }
    // add history entry
    this.historyManager.appendToNodeUpdateLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: this.unexecuteSelectionOffsets,
      state: this.pasteHistoryState,
    });
    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    await this.commitUpdates(executeSelectionOffsets);
  };

  // TODO: this function references the DOM and state.  So, it needs to pass-through values because it always executes - separate the DOM and state checks?
  manageInsertMenu = async (evt, selectionOffsetsArg) => {
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const { caretStart, caretEnd, startNodeId } = selectionOffsets;
    if (!startNodeId) {
      return Promise.resolve();
    }

    console.debug('MANAGE INSERT');

    const selectedNodeMap = this.documentModel.getNode(startNodeId);
    const selectedNode = getNodeById(startNodeId);

    if (
      selectedNode &&
      (!caretEnd || caretStart === caretEnd) &&
      selectedNodeMap.get('type') === NODE_TYPE_P &&
      selectedNodeMap.get('content', '').length === 0
    ) {
      return new Promise((resolve) => {
        this.setState(
          {
            // save current node because the selection will disappear when the insert menu is shown
            insertMenuNode: selectedNodeMap,
            insertMenuTopOffset: selectedNode.offsetTop,
            insertMenuLeftOffset: selectedNode.offsetLeft,
          },
          resolve
        );
      });
    }

    const {
      state: { insertMenuNode },
    } = this;
    if (insertMenuNode.size === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.setState({ insertMenuNode: Map() }, resolve);
    });
  };

  /**
   * INSERT SECTIONS
   */
  insertSection = async (sectionType, [firstFile] = []) => {
    const {
      state: { insertMenuNode, post },
    } = this;
    let meta = Map();
    if (sectionType === NODE_TYPE_IMAGE) {
      // TODO: add a loading indicator while uploading
      const { error, data: imageMeta } = await uploadImage(
        getImageFileFormData(firstFile, post)
      );
      if (error) {
        console.error('Image Upload Error: ', error);
        return;
      }
      meta = Map(imageMeta);
    }
    const historyState = this.documentModel.update(
      insertMenuNode.set('type', sectionType).set('meta', meta)
    );
    const newSectionId = getLastExecuteIdFromHistory(historyState);
    const executeSelectionOffsets = { startNodeId: newSectionId };
    this.historyManager.appendToNodeUpdateLog({
      executeSelectionOffsets,
      unexecuteSelectionOffsets: {
        startNodeId: insertMenuNode.get('id'),
        caretStart: 0,
      },
      state: historyState,
    });
    await this.commitUpdates(executeSelectionOffsets);
    if (
      [NODE_TYPE_IMAGE, NODE_TYPE_QUOTE, NODE_TYPE_SPACER].includes(sectionType)
    ) {
      this.sectionEdit(newSectionId);
    }
  };

  sectionEdit = async (sectionId) => {
    const [sectionDomNode] = document.getElementsByName(sectionId);
    const section = this.documentModel.getNode(sectionId);
    if (section.get('type') === NODE_TYPE_SPACER) {
      removeAllRanges();
    }
    console.debug('SECTION CALLBACK ', sectionId);

    const newState = {
      // hide all other menus here because this callback fires last
      // insert menu
      insertMenuNode: Map(),
      // format selection menu
      formatSelectionNode: Map(),
      formatSelectionModel: Selection(),
      formatSelectionModelIdx: -1,
      // hide edit section menu by default
      editSectionNode: section,
      shouldShowEditSectionMenu: section.get('type') !== NODE_TYPE_SPACER,
      editSectionMetaFormTopOffset: sectionDomNode.offsetTop,
    };

    await new Promise((resolve) => this.setState(newState, resolve));
  };

  updateEditSectionNode = (updatedNode) => {
    const historyState = this.documentModel.update(updatedNode);
    // TODO: appendToNodeUpdateLogWhenNCharsAreDifferent() for text fields like Image Caption, Quote fields...
    const offsets = { startNodeId: updatedNode.get('id') };
    this.historyManager.appendToNodeUpdateLog({
      executeSelectionOffsets: offsets,
      unexecuteSelectionOffsets: offsets,
      state: historyState,
    });
    this.setState(
      {
        editSectionNode: updatedNode,
      },
      async () => {
        await this.commitUpdates(this.getSelectionOffsetsOrEditSectionNode());
      }
    );
  };

  closeFormatSelectionMenu = async () => {
    const {
      state: { formatSelectionNode },
      selectionOffsets: { startNodeId, caretEnd },
    } = this;
    if (formatSelectionNode.get('id')) {
      await new Promise((resolve) => {
        this.setState(
          {
            formatSelectionNode: Map(),
            formatSelectionModel: Selection(),
            formatSelectionModelIdx: -1,
            formatSelectionMenuTopOffset: 0,
            formatSelectionMenuLeftOffset: 0,
          },
          resolve
        );
      });
      // caretStart: caretEnd - collapse range and place caret at end
      setCaret({ startNodeId, caretStart: caretEnd });
    }
  };

  updateLinkUrl = (value) => {
    const {
      state: {
        formatSelectionNode,
        formatSelectionModel,
        formatSelectionModelIdx,
      },
    } = this;

    const updatedSelectionModel = formatSelectionModel.set(
      SELECTION_LINK_URL,
      value
    );
    const updatedNode = replaceSelection(
      formatSelectionNode,
      updatedSelectionModel,
      formatSelectionModelIdx
    );
    this.documentModel.update(updatedNode);
    this.setState(
      {
        formatSelectionNode: updatedNode,
        formatSelectionModel: updatedSelectionModel,
      },
      async () => {
        await this.commitUpdates(this.getSelectionOffsetsOrEditSectionNode());
      }
    );
  };

  // TODO: add history entry for change in selection.  When user moves caret either collapsed or a selection range
  // it's nice during undo/redo to show the change in caret placement.  Currently, when doing an undo - if the caret
  // had changed place - all of a sudden a character "somewhere else" disappears/reappears and it's kinda WTF?
  manageFormatSelectionMenu = async (evt, selectionOffsets) => {
    const {
      state: { formatSelectionLastOffsets, formatSelectionNode },
    } = this;
    const { caretStart, caretEnd, startNodeId, endNodeId } = selectionOffsets;
    if (
      selectionOffsetsAreEqual(selectionOffsets, formatSelectionLastOffsets)
    ) {
      return;
    }
    console.debug(
      'SELECTION TEST: ',
      formatSelectionLastOffsets,
      selectionOffsets
    );
    await new Promise((resolve) =>
      this.setState({ formatSelectionLastOffsets: selectionOffsets }, resolve)
    );
    if (
      // no node
      !startNodeId ||
      !caretEnd ||
      // collapsed caret
      caretStart === caretEnd
    ) {
      if (formatSelectionNode.size > 0) {
        await this.closeFormatSelectionMenu();
      }
      return;
    }

    if (endNodeId) {
      // TODO: support highlight across multiple nodes
      console.info(
        '// TODO: format selection across nodes: ',
        selectionOffsets
      );
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
    const selectedNodeModel = this.documentModel.getNode(startNodeId);
    // save range offsets because if the selection is marked as a "link" the url input will be focused
    // and the range will be lost
    this.selectionOffsets = selectionOffsets;
    const { selections, idx } = getSelectionByContentOffset(
      selectedNodeModel,
      caretStart,
      caretEnd
    );
    await new Promise((resolve) =>
      this.setState(
        {
          formatSelectionNode: selectedNodeModel.setIn(
            ['meta', 'selections'],
            selections
          ),
          formatSelectionModel: getSelectionAtIdx(selections, idx),
          formatSelectionModelIdx: idx,
          // NOTE: need to add current vertical scroll position of the window to the
          // rect position to get offset relative to the whole document
          formatSelectionMenuTopOffset: rect.top + window.scrollY,
          formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2,
        },
        resolve
      )
    );
  };

  handleSelectionAction = async (action, shouldCloseMenu = false) => {
    const {
      state: {
        formatSelectionModel,
        formatSelectionModelIdx,
        formatSelectionNode,
      },
      selectionOffsets,
    } = this;
    const {
      historyState,
      executeSelectionOffsets,
      updatedSelection,
    } = doFormatSelection(
      this.documentModel,
      formatSelectionNode,
      formatSelectionModel,
      formatSelectionModelIdx,
      action
    );
    this.historyManager.appendToNodeUpdateLog({
      // doFormatSelection will return new selection offsets if changing node type i.e. P -> H1
      executeSelectionOffsets: executeSelectionOffsets || selectionOffsets,
      unexecuteSelectionOffsets: selectionOffsets,
      state: historyState,
    });
    await this.commitUpdates(selectionOffsets);
    if (shouldCloseMenu) {
      await this.closeFormatSelectionMenu();
      return;
    }

    const updatedNode = this.documentModel.getNode(
      getLastExecuteIdFromHistory(historyState)
    );
    // need to refresh the selection after update, as a merge might have occured
    // between neighboring selections that now have identical formats
    const { selections } = getSelectionByContentOffset(
      updatedNode,
      selectionOffsets.caretStart,
      selectionOffsets.caretEnd
    );
    this.setState(
      {
        formatSelectionNode: updatedNode.setIn(
          ['meta', 'selections'],
          selections
        ),
        // note: this selection index shouldn't have changed.
        formatSelectionModel: getSelectionAtIdx(
          selections,
          formatSelectionModelIdx
        ),
      },
      async () => {
        if (updatedSelection.get(SELECTION_ACTION_LINK)) {
          return;
        }
        // this replaces the selection after calling setState
        const replacementRange = replaceRange(selectionOffsets);
        // reposition menu since formatting changes move the selection around on the screen
        const rect = replacementRange.getBoundingClientRect();
        await new Promise((resolve) =>
          this.setState(
            {
              // NOTE: need to add current vertical scroll position of the window to the
              // rect position to get offset relative to the whole document
              formatSelectionMenuTopOffset: rect.top + window.scrollY,
              formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2,
            },
            resolve
          )
        );
      }
    );
  };

  render() {
    const {
      state: {
        post,
        nodesById,
        shouldShow404,
        shouldRedirect,
        insertMenuNode,
        insertMenuTopOffset,
        insertMenuLeftOffset,
        editSectionNode,
        shouldShowEditSectionMenu,
        editSectionMetaFormTopOffset,
        formatSelectionNode,
        formatSelectionMenuTopOffset,
        formatSelectionMenuLeftOffset,
        formatSelectionModel,
      },
      props: { session, setSession },
    } = this;

    if (shouldShow404) return <Page404 session={session} />;
    if (shouldRedirect) return <Redirect to={shouldRedirect} />;

    return (
      nodesById.size > 0 && (
        <>
          <div role="presentation" onMouseUp={this.handleMouseUp}>
            <Header
              session={session}
              setSession={setSession}
              pageName={PAGE_NAME_EDIT}
              post={post}
            />
            <ArticleStyled>
              <div
                id="filbert-edit-container"
                contentEditable
                suppressContentEditableWarning
              >
                {/* for debugging purposes */}
                {/* <button onClick={this.batchSave}>SAVE BATCH</button> */}
                <Document
                  nodesById={nodesById}
                  currentEditNode={editSectionNode}
                  setEditNodeId={this.sectionEdit}
                />
              </div>
            </ArticleStyled>
            <Footer />
          </div>
          {insertMenuNode.get('id') && (
            <InsertSectionMenu
              insertNodeId={insertMenuNode.get('id')}
              insertMenuTopOffset={insertMenuTopOffset}
              insertMenuLeftOffset={insertMenuLeftOffset}
              insertSection={this.insertSection}
            />
          )}
          {editSectionNode.get('type') === NODE_TYPE_IMAGE &&
            shouldShowEditSectionMenu && (
              <EditImageForm
                offsetTop={editSectionMetaFormTopOffset}
                post={post}
                nodeModel={editSectionNode}
                update={this.updateEditSectionNode}
              />
            )}
          {editSectionNode.get('type') === NODE_TYPE_QUOTE &&
            shouldShowEditSectionMenu && (
              <EditQuoteForm
                offsetTop={editSectionMetaFormTopOffset}
                nodeModel={editSectionNode}
                update={this.updateEditSectionNode}
              />
            )}
          {formatSelectionNode.get('id') && (
            <FormatSelectionMenu
              offsetTop={formatSelectionMenuTopOffset}
              offsetLeft={formatSelectionMenuLeftOffset}
              nodeModel={formatSelectionNode}
              selectionModel={formatSelectionModel}
              selectionAction={this.handleSelectionAction}
              updateLinkUrl={this.updateLinkUrl}
              closeMenu={this.closeFormatSelectionMenu}
            />
          )}
        </>
      )
    );
  }
}
