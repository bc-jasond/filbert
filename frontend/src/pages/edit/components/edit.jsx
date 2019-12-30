import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
import { Redirect } from 'react-router-dom';

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  uploadImage
} from '../../../common/fetch';
import {
  Article,
  DeletePost,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  ListDrafts,
  LogoLinkStyled,
  NewPost,
  PublishPost,
  SignedInUser
} from '../../../common/components/layout-styled-components';
import Footer from '../../footer';

import { getUserName } from '../../../common/session';
import { confirmPromise, getCanonicalFromTitle } from '../../../common/utils';
import {
  caretIsOnEdgeOfParagraphText,
  getFirstHeadingContent,
  getHighlightedSelectionOffsets,
  getNodeById,
  getRange,
  isControlKey,
  removeAllRanges,
  replaceRange,
  setCaret
} from '../../../common/dom';

import {
  KEYCODE_BACKSPACE,
  KEYCODE_DOWN_ARROW,
  KEYCODE_ENTER,
  KEYCODE_ESC,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SHIFT_OR_COMMAND_LEFT,
  KEYCODE_SHIFT_RIGHT,
  KEYCODE_SPACE,
  KEYCODE_UP_ARROW,
  KEYCODE_V,
  KEYCODE_X,
  NEW_POST_URL_ID,
  NODE_TYPE_IMAGE,
  NODE_TYPE_P,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
  POST_ACTION_REDIRECT_TIMEOUT,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL
} from '../../../common/constants';

import Document from '../../../common/components/document.component';
import { doDelete } from '../document-model-helpers/delete';
import DocumentModel from '../document-model';
import { syncFromDom, syncToDom } from '../document-model-helpers/dom-sync';
import { doPaste } from '../document-model-helpers/paste';
import { selectionFormatAction } from '../document-model-helpers/selection-format-action';
import { doSplit } from '../document-model-helpers/split';
import UpdateManager from '../update-manager';

import { getSelection, Selection, upsertSelection } from '../selection-helpers';

import InsertSectionMenu from './insert-section-menu';
import EditImageForm from './edit-image-form';
import EditQuoteForm from './edit-quote-form';
import FormatSelectionMenu from './format-selection-menu';
import PublishPostForm from '../../../common/components/edit-publish-post-form';

import Page404 from '../../404';

const ArticleStyled = styled(Article)`
  @media (max-width: 800px) {
    padding: 40px 80px;
  }
`;

export default class EditPost extends React.Component {
  documentModel = new DocumentModel();

  updateManager = new UpdateManager();

  commitTimeoutId;

  inputRef;

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
      formatSelectionNode: Map(),
      formatSelectionModel: Selection(),
      shouldShowPublishPostMenu: false,
      shouldShowPostError: null,
      shouldShowPostSuccess: null
    };
  }

  async componentDidMount() {
    console.debug('EDIT - didMount');
    try {
      this.registerWindowEventHandlers();
      const {
        props: {
          match: {
            params: { id }
          }
        }
      } = this;
      if (id === NEW_POST_URL_ID) {
        this.newPost();
        return;
      }
      await this.loadPost();
    } catch (err) {
      console.error('EDIT - load post error:', err);
    }
  }

  async componentDidUpdate(prevProps) {
    try {
      const params = this.props?.match?.params;
      const id = params?.id;
      const prevId = prevProps?.match?.params?.id;
      if (id === prevId) {
        return;
      }
      console.debug('EDIT - didUpdate');
      /* eslint-disable-next-line react/no-did-update-set-state */
      this.setState({
        shouldRedirect: false,
        insertMenuNode: Map()
      });
      if (id === NEW_POST_URL_ID) {
        this.newPost();
        return;
      }
      await this.loadPost();
    } catch (err) {
      console.error('EDIT - load post error:', err);
    }
  }

  async componentWillUnmount() {
    this.unregisterWindowEventHandlers();
  }

  registerWindowEventHandlers = () => {
    window.addEventListener('resize', this.manageInsertMenu, { capture: true });
    window.addEventListener('keydown', this.handleKeyDown, { capture: true });
    window.addEventListener('keyup', this.handleKeyUp, { capture: true });
    window.addEventListener('input', this.handleInput, { capture: true });
    window.addEventListener('paste', this.handlePaste, { capture: true });
    window.addEventListener('cut', this.handleCut, { capture: true });
  };

  unregisterWindowEventHandlers = () => {
    window.removeEventListener('resize', this.manageInsertMenu, {
      capture: true
    });
    window.removeEventListener('keydown', this.handleKeyDown, {
      capture: true
    });
    window.removeEventListener('keyup', this.handleKeyUp, { capture: true });
    window.removeEventListener('input', this.handleInput, { capture: true });
    window.removeEventListener('paste', this.handlePaste, { capture: true });
    window.removeEventListener('cut', this.handleCut, { capture: true });
  };

  saveContentBatch = async () => {
    try {
      const updated = this.updateManager.updates(this.documentModel);
      if (updated.length === 0) return;
      // console.info('Save Batch', updated);
      const result = await apiPost('/content', updated);
      this.updateManager.clearUpdates();
      console.info('Save Batch result', result);
    } catch (err) {
      console.error('Content Batch Update Error: ', err);
    }
  };

  saveContentBatchDebounce = () => {
    console.debug('Batch Debounce');
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 750);
  };

  newPost = () => {
    console.debug('New PostNew PostNew PostNew PostNew PostNew Post');
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.updateManager.init(postPlaceholder);
    const focusNodeId = this.documentModel.init(
      postPlaceholder,
      this.updateManager
    );
    this.setState({ post: Map() });
    this.commitUpdates(focusNodeId);
  };

  createNewPost = async () => {
    const title = getFirstHeadingContent();
    // get canonical - chop title, add hash
    const canonical = getCanonicalFromTitle(title);
    // POST to /post
    const { postId } = await apiPost('/post', { title, canonical });
    // update post id for all updates
    this.updateManager.addPostIdToUpdates(postId);
    await this.saveContentBatch();
    // huh, aren't we on /edit? - this is for going from /edit/new -> /edit/123...
    this.setState({ shouldRedirect: `/edit/${postId}` });
  };

  loadPost = async () => {
    try {
      const { post, contentNodes } = await apiGet(
        `/edit/${this.props?.match?.params?.id}`
      );
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
          shouldShow404: false
        },
        async () => {
          setCaret(firstNodeId, 0);
          await this.manageInsertMenu();
        }
      );
    } catch (err) {
      console.error(err);
      this.setState({ nodesById: Map(), shouldShow404: true });
    }
  };

  updatePost = (fieldName, value) => {
    const {
      state: { post }
    } = this;
    this.setState({
      post: post.set(fieldName, value),
      shouldShowPostError: null,
      shouldShowPostSuccess: null
    });
  };

  savePost = async () => {
    try {
      const {
        state: { post }
      } = this;
      await apiPatch(`/post/${post.get('id')}`, {
        title: post.get('title'),
        canonical: post.get('canonical'),
        abstract: post.get('abstract')
      });
      this.setState(
        {
          shouldShowPostSuccess: true,
          shouldShowPostError: null
        },
        () => {
          setTimeout(
            () => this.setState({ shouldShowPostSuccess: null }),
            POST_ACTION_REDIRECT_TIMEOUT
          );
        }
      );
    } catch (err) {
      this.setState({ shouldShowPostError: true });
    }
  };

  publishPost = async () => {
    const {
      state: { post }
    } = this;

    try {
      await confirmPromise('Publish this post?  This makes it public.');
      await this.savePost();
      await apiPost(`/publish/${post.get('id')}`);
      this.setState(
        {
          shouldShowPostSuccess: true,
          shouldShowPostError: null
        },
        () => {
          setTimeout(
            () =>
              this.setState({
                shouldRedirect: `/p/${post.get('canonical')}`
              }),
            POST_ACTION_REDIRECT_TIMEOUT
          );
        }
      );
    } catch (err) {
      this.setState({ shouldShowPostError: true });
    }
  };

  deletePost = async () => {
    const {
      state: { post }
    } = this;
    try {
      if (post.get('published')) {
        await confirmPromise(`Delete post ${post.get('title')}?`);
        await apiDelete(`/post/${post.get('id')}`);
        // if editing a published post - assume redirect to published posts list
        this.setState({ shouldRedirect: '/' });
        return;
      }
      await confirmPromise(`Delete draft ${post.get('title')}?`);
      await apiDelete(`/draft/${post.get('id')}`);
      this.setState({ shouldRedirect: '/private' });
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  togglePostMenu = () => {
    const {
      state: { shouldShowPublishPostMenu: oldVal }
    } = this;
    if (oldVal) {
      // hiding menu - reregister
      this.registerWindowEventHandlers();
    } else {
      // showing menu, unregister to not interfere
      this.unregisterWindowEventHandlers();
    }
    this.setState({ shouldShowPublishPostMenu: !oldVal });
  };

  anyEditContentMenuIsOpen = () => {
    const {
      state: { formatSelectionNode, editSectionNode }
    } = this;
    return formatSelectionNode.get('id') || editSectionNode.get('id');
  };

  closeAllEditContentMenus = async () => {
    return new Promise(resolve => {
      this.setState(
        {
          formatSelectionNode: Map(),
          editSectionNode: Map(),
          shouldShowEditSectionMenu: false
        },
        resolve
      );
    });
  };

  commitUpdates = (focusNodeId, offset = -1, shouldFocusLastChild) => {
    // TODO: optimistically save updated nodes - look ma, no errors!
    return new Promise((resolve /* , reject */) => {
      // roll with state changes TODO: handle errors - roll back?
      const newState = {
        nodesById: this.documentModel.nodesById,
        insertMenuNode: Map()
      };
      if (focusNodeId && this.documentModel.isMetaType(focusNodeId)) {
        removeAllRanges();
        newState.editSectionNode = this.documentModel.getNode(focusNodeId);
      }
      this.setState(newState, () => {
        // if we're on /edit/new, we don't save until user hits "enter"
        if (this.props?.match?.params?.id !== NEW_POST_URL_ID) {
          this.saveContentBatchDebounce();
        }
        // if a menu isn't open, re-place the caret
        if (!this.anyEditContentMenuIsOpen()) {
          setCaret(focusNodeId, offset, shouldFocusLastChild);
        }
        resolve();
      });
    });
  };

  handleEditSectionMenu = async evt => {
    if (![KEYCODE_ENTER, KEYCODE_ESC].includes(evt.keyCode)) {
      return;
    }
    const {
      state: { editSectionNode, shouldShowEditSectionMenu }
    } = this;
    // if there's no currently selected MetaType node or it's a spacer (no menu for spacer) we're done.
    if (
      !editSectionNode.get('id') ||
      editSectionNode.get('type') === NODE_TYPE_SPACER
    ) {
      return;
    }
    console.debug('EDIT SECTION MENU');
    await new Promise(resolve => {
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
      isAtStart
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
        KEYCODE_RIGHT_ARROW
      ].includes(evt.keyCode)
    ) {
      return;
    }
    console.debug('ARROW');
    const { startNodeCaretStart, startNodeCaretEnd } = selectionOffsets;

    // collapse range if there's highlighted selection and the user hits an arrow
    if (
      startNodeCaretStart !== startNodeCaretEnd &&
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
      evt.stopPropagation();
      evt.preventDefault();
      return;
    }

    const {
      state: { editSectionNode }
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
      evt.stopPropagation();
      evt.preventDefault();
      if (this.documentModel.isMetaType(neighborNode.get('id'))) {
        removeAllRanges();
        await this.sectionEdit(neighborNode.get('id'));
        return;
      }
      setCaret(
        neighborNode.get('id'),
        [KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode) ? -1 : 0
      );
      return;
    }
    // we're currently inside a selected MetaType node
    // only leave edit section menu if user hit's up / down arrow
    // user can still use tab to move vertically between inputs
    const {
      state: { shouldShowEditSectionMenu }
    } = this;
    if (
      shouldShowEditSectionMenu &&
      ![KEYCODE_UP_ARROW, KEYCODE_DOWN_ARROW].includes(evt.keyCode)
    ) {
      return;
    }
    evt.stopPropagation();
    evt.preventDefault();
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
      setCaret(prevNode.get('id'), -1);
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
    setCaret(nextNode.get('id'), 0);
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

    evt.stopPropagation();
    evt.preventDefault();

    const { focusNodeId, caretOffset, shouldFocusLastNode } = doDelete(
      this.documentModel,
      selectionOffsets
    );
    if (!focusNodeId) {
      return;
    }

    // clear the selected format node when deleting the highlighted selection
    // NOTE: must wait for state have been set or setCaret will check stale values
    await this.closeAllEditContentMenus();
    await this.commitUpdates(focusNodeId, caretOffset, shouldFocusLastNode);
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

    const focusNodeId = doSplit(this.documentModel, selectionOffsets);
    if (!focusNodeId) {
      return;
    }

    evt.stopPropagation();
    evt.preventDefault();

    await this.closeAllEditContentMenus();

    if (this.props?.match?.params?.id === NEW_POST_URL_ID) {
      await this.createNewPost();
      return;
    }
    await this.commitUpdates(focusNodeId, 0);
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
    evt.stopPropagation();
    evt.preventDefault();

    const {
      state: { editSectionNode }
    } = this;
    if (editSectionNode.get('id')) {
      return;
    }

    const { startNodeCaretStart, startNodeCaretEnd } = selectionOffsets;
    // select-and-type ?? delete selection first
    if (startNodeCaretStart !== startNodeCaretEnd) {
      doDelete(this.documentModel, selectionOffsets);
    }

    const { focusNodeId, caretOffset } = syncToDom(
      this.documentModel,
      selectionOffsets,
      evt
    );
    if (!focusNodeId) {
      return;
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we place it back with JS
    await this.closeAllEditContentMenus();
    await this.commitUpdates(focusNodeId, caretOffset);
  };

  // MAIN "ON" EVENT CALLBACKS
  getSelectionOffsetsOrEditSectionNode = () => {
    let selectionOffsets = getHighlightedSelectionOffsets();
    const { startNodeId } = selectionOffsets;
    if (!startNodeId) {
      const {
        state: { editSectionNode }
      } = this;
      // if there's a MetaNode selected, override DOM selection
      if (!editSectionNode.get('id')) {
        return {};
      }
      selectionOffsets = {
        startNodeCaretStart: 0,
        startNodeCaretEnd: 0,
        startNodeId: editSectionNode.get('id')
      };
    }
    return selectionOffsets;
  };

  handleKeyDown = async evt => {
    const {
      state: { insertMenuNode, formatSelectionNode, formatSelectionModel }
    } = this;
    // BAIL conditions
    //
    // insert menu button is displayed (on empty P)
    if (
      insertMenuNode.get('id') &&
      // no range means the menu is closed
      (!getRange() ||
        // allow shift through so user can double tap it to open the menu
        [KEYCODE_SHIFT_RIGHT, KEYCODE_SHIFT_OR_COMMAND_LEFT].includes(
          evt.keyCode
        ))
    ) {
      // pass this event up to the menu to handle
      this.setState({ windowEventToForward: evt });
      return;
    }
    // format selection menu is open
    if (
      formatSelectionNode.get('id') &&
      // don't capture holding down shift so user can resize the selection
      !evt.shiftKey &&
      (formatSelectionModel.get(SELECTION_ACTION_LINK) ||
        // but DO allow a double tap on shift to open the menu
        [
          KEYCODE_SHIFT_RIGHT,
          KEYCODE_SHIFT_OR_COMMAND_LEFT,
          KEYCODE_LEFT_ARROW,
          KEYCODE_RIGHT_ARROW,
          KEYCODE_SPACE,
          KEYCODE_ESC,
          KEYCODE_ENTER
        ].includes(evt.keyCode))
    ) {
      // pass this event up to the menu to handle
      this.setState({ windowEventToForward: evt });
      return;
    }
    if (
      // ignore shift and option - don't override hard-refresh!
      evt.metaKey &&
      evt.shiftKey
    ) {
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
        KEYCODE_RIGHT_ARROW
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

  handleKeyUp = async evt => {
    if (!(evt.shiftKey && isControlKey(evt.keyCode))) {
      return;
    }
    console.debug('KEYUP');
    const selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    await this.manageFormatSelectionMenu(evt, selectionOffsets);
  };

  handleInput = async evt => {
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
      state: { editSectionNode }
    } = this;
    // if there's a MetaNode selected, bail
    if (editSectionNode.get('id')) {
      return;
    }
    const selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    const { startNodeId } = selectionOffsets;
    // if the caret isn't on a node with an id, bail
    if (!startNodeId) {
      return;
    }
    console.debug('INPUT (aka: sync back from DOM)');
    // for emoji keyboard insert
    const { focusNodeId, caretOffset } = syncFromDom(
      this.documentModel,
      selectionOffsets,
      evt
    );
    if (!focusNodeId) {
      return;
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    await this.commitUpdates(focusNodeId, caretOffset);
  };

  handleMouseUp = async evt => {
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
    const {
      startNodeCaretStart,
      startNodeCaretEnd,
      startNodeId
    } = selectionOffsets;
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "paste" with clipboard data...
    if (evt.type !== 'cut') {
      if (startNodeCaretStart !== startNodeCaretEnd) {
        doDelete(this.documentModel, selectionOffsets);
        await this.commitUpdates(startNodeId, startNodeCaretStart);
      }
      return;
    }
    // NOTE: have to manually set selection string into clipboard
    const selectionString = document.getSelection().toString();
    console.debug('CUT selection', selectionString);
    evt.clipboardData.setData('text/plain', selectionString);

    // NOTE: if these get called on the 'keydown' event, they'll cancel the 'cut' event
    evt.stopPropagation();
    evt.preventDefault();

    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    await this.commitUpdates(startNodeId, startNodeCaretStart);
  };

  handlePaste = async (evt, selectionOffsetsArg) => {
    // NOTE: this handler needs to pass through twice on a "paste" event
    // 1st: on "keydown" - this is to handle deleting selected text
    // 2nd: on "paste" - now that the selection is clear, paste in the text
    if (evt.type !== 'paste' && !(evt.metaKey && evt.keyCode === KEYCODE_V)) {
      return;
    }
    // don't override pasting into inputs of menus
    const {
      state: { formatSelectionNode, formatSelectionModel }
    } = this;
    // format selection menu is open, and the link url input is visible
    if (
      formatSelectionNode.get('id') &&
      formatSelectionModel.get(SELECTION_ACTION_LINK)
    ) {
      return;
    }

    // this is to bypass the "keyup" & "input" handlers
    this.didPaste = true;

    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const { startNodeCaretStart, startNodeCaretEnd } = selectionOffsets;
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "paste" with clipboard data...
    if (evt.type !== 'paste') {
      if (startNodeCaretStart !== startNodeCaretEnd) {
        doDelete(this.documentModel, selectionOffsets);
      }
      return;
    }
    // NOTE: if these get called on the 'keydown' event, they'll cancel the 'paste' event
    evt.stopPropagation();
    evt.preventDefault();

    const { focusNodeId, caretOffset } = doPaste(
      this.documentModel,
      selectionOffsets,
      evt.clipboardData
    );
    if (!focusNodeId) {
      return;
    }
    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    await this.commitUpdates(focusNodeId, caretOffset);
  };

  // TODO: this function references the DOM and state.  So, it needs to pass-through values because it always executes - separate the DOM and state checks?
  manageInsertMenu = async (evt, selectionOffsetsArg) => {
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const {
      startNodeCaretStart,
      startNodeCaretEnd,
      startNodeId
    } = selectionOffsets;
    if (!startNodeId) {
      return;
    }

    console.debug('MANAGE INSERT');

    const selectedNodeMap = this.documentModel.getNode(startNodeId);
    const selectedNode = getNodeById(startNodeId);

    if (
      selectedNode &&
      startNodeCaretStart === startNodeCaretEnd &&
      selectedNodeMap.get('type') === NODE_TYPE_P &&
      selectedNodeMap.get('content', '').length === 0
    ) {
      await new Promise(resolve => {
        this.setState(
          {
            // save current node because the selection will disappear when the insert menu is shown
            insertMenuNode: selectedNodeMap,
            insertMenuTopOffset: selectedNode.offsetTop,
            insertMenuLeftOffset: selectedNode.offsetLeft
          },
          resolve
        );
      });
      return;
    }

    await new Promise(resolve => {
      this.setState({ insertMenuNode: Map() }, resolve);
    });
  };

  /**
   * INSERT SECTIONS
   */
  insertSection = async (sectionType, [firstFile] = []) => {
    const {
      state: { insertMenuNode }
    } = this;
    let meta = Map();
    if (sectionType === NODE_TYPE_IMAGE) {
      const { imageId, width, height } = await this.uploadFile(firstFile);
      meta = Map({
        url: imageId,
        width,
        height
      });
    }
    const newSectionId = this.documentModel.update(
      insertMenuNode.set('type', sectionType).set('meta', meta)
    );
    let focusNodeId = newSectionId;
    // TODO: put a P after any MetaType - maybe only if it's the last node in the document
    if (
      this.documentModel.isMetaType(focusNodeId) &&
      DocumentModel.getLastNode(this.documentModel.nodesById).get('id') ===
        focusNodeId
    ) {
      focusNodeId = this.documentModel.insert(NODE_TYPE_P, focusNodeId);
    }
    await this.commitUpdates(focusNodeId);
    if (
      [NODE_TYPE_IMAGE, NODE_TYPE_QUOTE, NODE_TYPE_SPACER].includes(sectionType)
    ) {
      this.sectionEdit(newSectionId);
    }
  };

  sectionEdit = async sectionId => {
    const [sectionDomNode] = document.getElementsByName(sectionId);
    const section = this.documentModel.getNode(sectionId);
    removeAllRanges();
    console.debug('SECTION CALLBACK ', sectionId);

    const newState = {
      // hide all other menus here because this callback fires last
      // insert menu
      insertMenuNode: Map(),
      // format selection menu
      formatSelectionNode: Map(),
      formatSelectionModel: Selection(),
      // hide edit section menu by default
      editSectionNode: section,
      shouldShowEditSectionMenu: section.get('type') !== NODE_TYPE_SPACER,
      editSectionMetaFormTopOffset: sectionDomNode.offsetTop
    };

    await new Promise(resolve => {
      this.setState(newState, () => {
        if (this.inputRef) {
          // allow animations to finish or scroll goes wacko
          setTimeout(() => this.inputRef.focus(), 500);
        }
        resolve();
      });
    });
  };

  getInputForwardedRef = ref => {
    if (!ref) return;
    this.inputRef = ref;
    ref.focus();
  };

  replaceImageFile = async ([firstFile]) => {
    const {
      state: { editSectionNode }
    } = this;
    const { imageId, width, height } = await this.uploadFile(firstFile);
    const updatedImageSectionNode = editSectionNode
      .deleteIn(['meta', 'rotationDegrees'])
      .setIn(['meta', 'url'], imageId)
      .setIn(['meta', 'width'], width)
      .setIn(['meta', 'height'], height);
    this.documentModel.update(updatedImageSectionNode);
    this.setState(
      {
        editSectionNode: updatedImageSectionNode
      },
      async () => {
        await this.commitUpdates();
      }
    );
  };

  updateImageCaption = value => {
    const {
      state: { editSectionNode }
    } = this;
    const updatedImageSectionNode = editSectionNode.setIn(
      ['meta', 'caption'],
      value
    );
    this.documentModel.update(updatedImageSectionNode);
    this.setState(
      {
        editSectionNode: updatedImageSectionNode
      },
      async () => {
        await this.commitUpdates();
      }
    );
  };

  imageRotate = () => {
    const {
      state: { editSectionNode }
    } = this;
    const currentRotationDegrees = editSectionNode.getIn(
      ['meta', 'rotationDegrees'],
      0
    );
    const updatedRotationDegrees =
      currentRotationDegrees === 270 ? 0 : currentRotationDegrees + 90;
    const updatedImageSectionNode = editSectionNode.setIn(
      ['meta', 'rotationDegrees'],
      updatedRotationDegrees
    );
    this.documentModel.update(updatedImageSectionNode);
    this.setState(
      {
        editSectionNode: updatedImageSectionNode
      },
      async () => {
        await this.commitUpdates();
      }
    );
  };

  updateEditSectionNodeMeta = (metaKey, value) => {
    const {
      state: { editSectionNode }
    } = this;
    const updatedQuoteSectionNode = editSectionNode.setIn(
      ['meta', metaKey],
      value
    );
    this.documentModel.update(updatedQuoteSectionNode);
    this.setState(
      {
        editSectionNode: updatedQuoteSectionNode
      },
      async () => {
        await this.commitUpdates();
      }
    );
  };

  closeFormatSelectionMenu = async () => {
    const {
      state: { formatSelectionNode },
      selectionOffsets: { startNodeId, startNodeCaretStart, startNodeCaretEnd }
    } = this;
    if (formatSelectionNode.get('id')) {
      await new Promise(resolve => {
        this.setState(
          {
            formatSelectionNode: Map(),
            formatSelectionModel: Selection(),
            formatSelectionMenuTopOffset: 0,
            formatSelectionMenuLeftOffset: 0
          },
          resolve
        );
      });
      replaceRange(startNodeId, startNodeCaretStart, startNodeCaretEnd);
    }
  };

  updateLinkUrl = value => {
    const {
      state: { formatSelectionNode, formatSelectionModel }
    } = this;
    const updatedSelectionModel = formatSelectionModel.set(
      SELECTION_LINK_URL,
      value
    );
    const updatedNode = upsertSelection(
      formatSelectionNode,
      updatedSelectionModel
    );
    this.documentModel.update(updatedNode);
    this.setState(
      {
        formatSelectionNode: updatedNode,
        formatSelectionModel: updatedSelectionModel
      },
      async () => {
        await this.commitUpdates();
      }
    );
  };

  // TODO: bug - selection highlighting disappears on user input on format selection menu
  manageFormatSelectionMenu = async (evt, selectionOffsets) => {
    const {
      startNodeCaretStart,
      startNodeCaretEnd,
      startNodeId,
      endNodeId
    } = selectionOffsets;
    if (
      // no node
      !startNodeId ||
      // collapsed caret
      startNodeCaretStart === startNodeCaretEnd
    ) {
      await this.closeFormatSelectionMenu();
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
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    const range = getRange();
    console.info(
      'SELECTION: ',
      startNodeCaretStart,
      startNodeCaretEnd,
      endNodeId,
      range,
      range.getBoundingClientRect()
    );
    const rect = range.getBoundingClientRect();
    const selectedNodeModel = this.documentModel.getNode(startNodeId);
    // save range offsets because if the selection is marked as a "link" the url input will be focused
    // and the range will be lost
    this.selectionOffsets = selectionOffsets;
    await new Promise(resolve =>
      this.setState(
        {
          formatSelectionNode: selectedNodeModel,
          formatSelectionModel: getSelection(
            selectedNodeModel,
            startNodeCaretStart,
            startNodeCaretEnd
          ),
          // NOTE: need to add current vertical scroll position of the window to the
          // rect position to get offset relative to the whole document
          formatSelectionMenuTopOffset: rect.top + window.scrollY,
          formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2
        },
        resolve
      )
    );
  };

  handleSelectionAction = async (action, shouldCloseMenu = false) => {
    const {
      state: { formatSelectionModel, formatSelectionNode },
      selectionOffsets: { startNodeCaretStart, startNodeCaretEnd, startNodeId }
    } = this;
    const {
      focusNodeId,
      updatedNode,
      updatedSelection
    } = selectionFormatAction(
      this.documentModel,
      formatSelectionNode,
      formatSelectionModel,
      action
    );
    await this.commitUpdates(focusNodeId);
    if (shouldCloseMenu) {
      await this.closeFormatSelectionMenu();
      replaceRange(startNodeId, startNodeCaretStart, startNodeCaretEnd);
      return;
    }
    this.setState(
      {
        formatSelectionNode: updatedNode,
        formatSelectionModel: updatedSelection
      },
      async () => {
        if (updatedSelection.get(SELECTION_ACTION_LINK) && this.inputRef) {
          this.inputRef.focus();
        }
        // this replaces the selection after calling setState
        const replacementRange = replaceRange(
          startNodeId,
          startNodeCaretStart,
          startNodeCaretEnd
        );
        // reposition menu since formatting changes move the selection around on the screen
        const rect = replacementRange.getBoundingClientRect();
        await new Promise(resolve =>
          this.setState(
            {
              // NOTE: need to add current vertical scroll position of the window to the
              // rect position to get offset relative to the whole document
              formatSelectionMenuTopOffset: rect.top + window.scrollY,
              formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2
            },
            resolve
          )
        );
      }
    );
  };

  async uploadFile(file) {
    const {
      state: { post }
    } = this;
    // TODO: allow multiple files
    const formData = new FormData();
    formData.append('postId', post.get('id'));
    formData.append('userId', post.get('user_id'));
    formData.append('fileData', file);
    return uploadImage(formData);
  }

  render() {
    const {
      state: {
        post,
        nodesById,
        shouldShow404,
        shouldRedirect,
        windowEventToForward,
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
        shouldShowPublishPostMenu,
        shouldShowPostError,
        shouldShowPostSuccess
      }
    } = this;

    if (shouldShow404) return <Page404 />;
    if (shouldRedirect) return <Redirect to={shouldRedirect} />;

    return (
      <>
        <div role="presentation" onMouseUp={this.handleMouseUp}>
          <Header>
            <HeaderContentContainer>
              <LogoLinkStyled to="/">
                <span role="img" aria-label="hand writing with a pen">
                  ✍️
                </span>{' '}
                filbert
              </LogoLinkStyled>
              <HeaderLinksContainer>
                <PublishPost onClick={this.togglePostMenu}>publish</PublishPost>
                <DeletePost onClick={this.deletePost}>delete</DeletePost>
                <NewPost to="/edit/new">new</NewPost>
                <ListDrafts to="/discover">discover</ListDrafts>
                <ListDrafts to="/private">private</ListDrafts>
                <SignedInUser to="/me">{getUserName()}</SignedInUser>
              </HeaderLinksContainer>
            </HeaderContentContainer>
          </Header>
          <HeaderSpacer id="header-spacer" />
          <ArticleStyled>
            {nodesById.size > 0 && (
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
            )}
          </ArticleStyled>
          <Footer />
        </div>
        {shouldShowPublishPostMenu && (
          <PublishPostForm
            post={post}
            updatePost={this.updatePost}
            publishPost={this.publishPost}
            savePost={this.savePost}
            close={this.togglePostMenu}
            successMessage={shouldShowPostSuccess}
            errorMessage={shouldShowPostError}
            forwardRef={this.getInputForwardedRef}
          />
        )}
        {insertMenuNode.get('id') && (
          <InsertSectionMenu
            windowEvent={windowEventToForward}
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
              nodeModel={editSectionNode}
              uploadFile={this.replaceImageFile}
              updateMeta={this.updateEditSectionNodeMeta}
              imageRotate={this.imageRotate}
              forwardRef={this.getInputForwardedRef}
            />
          )}
        {editSectionNode.get('type') === NODE_TYPE_QUOTE &&
          shouldShowEditSectionMenu && (
            <EditQuoteForm
              offsetTop={editSectionMetaFormTopOffset}
              nodeModel={editSectionNode}
              updateMeta={this.updateEditSectionNodeMeta}
              forwardRef={this.getInputForwardedRef}
            />
          )}
        {formatSelectionNode.get('id') && (
          <FormatSelectionMenu
            windowEvent={windowEventToForward}
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
    );
  }
}
