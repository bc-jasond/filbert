import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
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
import { doDelete } from '../document-model-helpers/delete';
import DocumentModel from '../document-model';
import { syncFromDom, syncToDom } from '../document-model-helpers/dom-sync';
import { doPaste } from '../document-model-helpers/paste';
import { selectionFormatAction } from '../document-model-helpers/selection-format-action';
import { doSplit } from '../document-model-helpers/split';
import UpdateManager from '../update-manager';

import {
  getSelectionAtIdx,
  getSelectionByContentOffset,
  replaceSelection,
} from '../selection-helpers';

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
  documentModel = new DocumentModel();

  updateManager = new UpdateManager();

  selectionOffsets = {};

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

  newPost = () => {
    console.debug('New PostNew PostNew PostNew PostNew PostNew Post');
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.updateManager.init(postPlaceholder);
    // don't bring forward failed updates to other posts!
    this.updateManager.clearUpdates();
    this.documentModel = DocumentModel(postPlaceholder);
    const startNodeId = this.documentModel.init(
      postPlaceholder,
      this.updateManager
    );
    this.setState({ post: Map() });
    this.commitUpdates(undefined, { startNodeId });
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
    // update post id for all updates
    this.updateManager.addPostIdToUpdates(postId);
    await this.updateManager.saveContentBatch();
    // huh, aren't we on /edit? - this is for going from /edit/new -> /edit/123...
    this.setState({ shouldRedirect: `/edit/${postId}?shouldFocusLastNode` });
  };

  loadPost = async () => {
    const { error, data: { post, contentNodes } = {} } = await apiGet(
      `/edit/${this.props?.params?.id}`
    );
    if (error) {
      console.error(error);
      this.setState({ nodesById: Map(), shouldShow404: true });
      return;
    }

    this.updateManager.init(post);
    const firstNodeId = this.documentModel.init(
      post,
      this.updateManager,
      contentNodes
    );
    this.setState(
      {
        post: this.documentModel.post,
        nodesById: this.documentModel.nodesById,
        shouldShow404: false,
      },
      async () => {
        let startNodeId = firstNodeId;
        let caretStart = 0;
        const queryParams = new URLSearchParams(window.location.search);
        // all this just to advance the cursor for a new post...
        if (queryParams.has('shouldFocusLastNode')) {
          startNodeId = DocumentModel.getLastNode(
            this.documentModel.nodesById
          ).get('id');
          caretStart = -1;
          queryParams.delete('shouldFocusLastNode');
          const queryString = queryParams.toString();
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname +
              (queryString.length > 0 ? `?${queryString}` : '')
          );
        }
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

  undo = async (shouldUndo = true) => {
    const {
      state: { nodesById },
    } = this;
    // this pops the undo/redo stack AND applies the updates to the document (nodesById)
    const historyEntry = shouldUndo
      ? this.updateManager.undo(nodesById)
      : this.updateManager.redo(nodesById);
    const updatedNodesById = historyEntry.get('nodesById', Map());
    const historyOffsets = historyEntry.get('selectionOffsets', Map());
    if (updatedNodesById.size === 0) {
      return;
    }
    console.info(`${shouldUndo ? 'UNDO!' : 'REDO!'}`, historyEntry.toJS());
    this.documentModel.nodesById = updatedNodesById;
    // passing undefined as prevSelectionOffsets will skip adding this operation to history again
    await this.commitUpdates(undefined, historyOffsets.toJS());
  };

  commitUpdates = (prevSelectionOffsets, selectionOffsets) => {
    const { startNodeId, caretStart, caretEnd } = selectionOffsets;
    const {
      state: { editSectionNode, formatSelectionModel },
    } = this;
    // TODO: optimistically saving updated nodes with no error handling - look ma, no errors!
    return new Promise((resolve /* , reject */) => {
      const {
        state: {
          // these are the "clean" nodes - the updated (dirty) ones are in this.documentModel.nodesById (and this.updateManager.nodeUpdates)
          nodesById: prevNodesById,
          post,
        },
      } = this;
      if (post.size > 0 && prevSelectionOffsets) {
        this.updateManager.addToUndoHistory(
          prevNodesById,
          prevSelectionOffsets,
          selectionOffsets
        );
      }
      // roll with state changes TODO: handle errors - roll back?
      const newState = {
        nodesById: this.documentModel.nodesById,
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
        // if we're on /edit/new, we don't save until user hits "enter"
        if (this.props?.params?.id !== NEW_POST_URL_ID) {
          this.updateManager.saveContentBatchDebounce();
        }
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
      this.state?.shouldShowEditSectionMenu
    ) {
      return;
    }

    stopAndPrevent(evt);

    const { startNodeId, caretStart } = doDelete(
      this.documentModel,
      selectionOffsets
    );
    if (!startNodeId) {
      return;
    }

    // clear the selected format node when deleting the highlighted selection
    // NOTE: must wait for state have been set or setCaret will check stale values
    this.closeAllEditContentMenus();
    await this.commitUpdates(selectionOffsets, { startNodeId, caretStart });
  };

  /**
   * ENTER
   * @param evt
   * @param selectionOffsets
   * @returns {Promise<void>}
   */
  handleEnter = async (evt, selectionOffsets) => {
    if (evt.keyCode !== KEYCODE_ENTER) {
      return;
    }
    // ignore if there's a selected MetaType node's menu is open
    if (this.state?.shouldShowEditSectionMenu) {
      return;
    }

    const startNodeId = doSplit(this.documentModel, selectionOffsets);
    if (!startNodeId) {
      return;
    }

    stopAndPrevent(evt);

    await this.closeAllEditContentMenus();

    if (this.props?.params?.id === NEW_POST_URL_ID) {
      await this.createNewPost();
      return;
    }
    await this.commitUpdates(selectionOffsets, { startNodeId, caretStart: 0 });
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
      this.didPaste ||
      // ignore "cut"
      this.didCut
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

    // select-and-type ?? delete selection first
    if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
      doDelete(this.documentModel, selectionOffsets);
    }

    const { startNodeId, caretStart } = syncToDom(
      this.documentModel,
      selectionOffsets,
      evt
    );
    if (!startNodeId) {
      return;
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we place it back with JS
    await this.closeAllEditContentMenus();
    await this.commitUpdates(selectionOffsets, { startNodeId, caretStart });
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
      this.undo(false);
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
      this.didCut ||
      this.didPaste
    ) {
      // since evt.inputType ('inputFromPaste','deleteFromCut', etc.) isn't compatible with Edge
      this.didPaste = false;
      this.didCut = false;
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
    // for emoji keyboard insert
    const { startNodeId, caretStart } = syncFromDom(
      this.documentModel,
      selectionOffsets,
      evt
    );
    if (!startNodeId) {
      return;
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    await this.commitUpdates(selectionOffsets, { startNodeId, caretStart });
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
    this.didCut = true;
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const { caretStart, caretEnd, startNodeId } = selectionOffsets;
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "cut" with clipboard data...
    if (evt.type !== 'cut') {
      // save these to pass to commitUpdates for undo history
      this.selectionOffsets = selectionOffsets;
      if (caretStart !== caretEnd) {
        doDelete(this.documentModel, selectionOffsets);
      }
      return;
    }
    // NOTE: have to manually set selection string into clipboard since we're cancelling the event
    const selectionString = document.getSelection().toString();
    console.debug('CUT selection', selectionString);
    evt.clipboardData.setData('text/plain', selectionString);

    // NOTE: if we stopPropagation and preventDefault on the 'keydown' event, they'll cancel the 'cut' event too
    // so don't move this up
    stopAndPrevent(evt);

    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    await this.commitUpdates(this.selectionOffsets, {
      startNodeId,
      caretStart,
    });
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
    this.didPaste = true;

    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "paste" with clipboard data...
    if (evt.type !== 'paste') {
      // for undo history - need to store the "first" selections, aka before the delete operation
      this.selectionOffsets = selectionOffsets;
      if (selectionOffsets.caretStart !== selectionOffsets.caretEnd) {
        doDelete(this.documentModel, selectionOffsets);
      }
      return;
    }
    // NOTE: if these get called on the 'keydown' event, they'll cancel the 'paste' event
    stopAndPrevent(evt);

    const { startNodeId, caretStart } = doPaste(
      this.documentModel,
      selectionOffsets,
      evt.clipboardData
    );
    if (!startNodeId) {
      return;
    }
    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    await this.commitUpdates(this.selectionOffsets, {
      startNodeId,
      caretStart,
    });
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
    const newSectionId = this.documentModel.update(
      insertMenuNode.set('type', sectionType).set('meta', meta)
    );
    await this.commitUpdates(this.getSelectionOffsetsOrEditSectionNode(), {
      startNodeId: newSectionId,
    });
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
    this.documentModel.update(updatedNode);
    this.setState(
      {
        editSectionNode: updatedNode,
      },
      async () => {
        await this.commitUpdates(
          this.getSelectionOffsetsOrEditSectionNode(),
          this.getSelectionOffsetsOrEditSectionNode()
        );
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
        await this.commitUpdates(
          this.getSelectionOffsetsOrEditSectionNode(),
          this.getSelectionOffsetsOrEditSectionNode()
        );
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
    const { updatedNode, updatedSelection } = selectionFormatAction(
      this.documentModel,
      formatSelectionNode,
      formatSelectionModel,
      formatSelectionModelIdx,
      action
    );
    if (shouldCloseMenu) {
      await this.closeFormatSelectionMenu();
      return;
    }
    this.setState(
      {
        formatSelectionNode: updatedNode,
        formatSelectionModel: updatedSelection,
      },
      async () => {
        await this.commitUpdates(selectionOffsets, selectionOffsets);
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
