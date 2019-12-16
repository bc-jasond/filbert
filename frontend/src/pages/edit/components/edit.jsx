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

import { getUserName, signout } from '../../../common/session';
import { confirmPromise, getCanonicalFromTitle } from '../../../common/utils';
import {
  caretIsOnEdgeOfParagraphText,
  getFirstHeadingContent,
  getHighlightedSelectionOffsets,
  getNodeById,
  getRange,
  isControlKey,
  removeAllRanges,
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
import { lineHeight } from '../../../common/css';

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
      // TODO: unregister these
      window.addEventListener('resize', this.manageInsertMenu);
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('input', this.handleInput);
      window.addEventListener('paste', this.handlePaste);
      window.addEventListener('cut', this.handleCut);
      if (this.props.match.params.id === NEW_POST_URL_ID) {
        return this.newPost();
      }
      await this.loadPost();
    } catch (err) {
      console.error('EDIT - load post error:', err);
    }
  }

  async componentDidUpdate(prevProps) {
    try {
      if (this.props.match.params.id === prevProps.match.params.id) {
        return;
      }
      console.debug('EDIT - didUpdate');
      /* eslint-disable-next-line react/no-did-update-set-state */
      this.setState({
        shouldRedirect: false,
        insertMenuNode: Map()
      });
      if (this.props.match.params.id === NEW_POST_URL_ID) {
        return this.newPost();
      }
      await this.loadPost();
    } catch (err) {
      console.error('EDIT - load post error:', err);
    }
  }

  documentModel = new DocumentModel();

  updateManager = new UpdateManager();

  commitTimeoutId;

  inputRef;

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

  saveContentBatchDebounce() {
    console.debug('Batch Debounce');
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 750);
  }

  newPost() {
    console.debug('New PostNew PostNew PostNew PostNew PostNew Post');
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.updateManager.init(postPlaceholder);
    const focusNodeId = this.documentModel.init(
      postPlaceholder,
      this.updateManager
    );
    this.setState({ post: Map() });
    this.commitUpdates(focusNodeId);
  }

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
        `/edit/${this.props.match.params.id}`
      );
      this.updateManager.init(post);
      const lastNodeId = this.documentModel.init(
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
          setCaret(lastNodeId, -1, true);
          await this.manageInsertMenu();
          window.scrollTo(0, 0);
        }
      );
    } catch (err) {
      console.error(err);
      this.setState({ nodesById: Map(), shouldShow404: true });
    }
  };

  updatePost = (fieldName, value) => {
    const { post } = this.state;
    this.setState({
      post: post.set(fieldName, value),
      shouldShowPostError: null,
      shouldShowPostSuccess: null
    });
  };

  savePost = async () => {
    try {
      const { post } = this.state;
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
    const { post } = this.state;

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
                shouldRedirect: `/posts/${post.get('canonical')}`
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
    const { post } = this.state;
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
      this.setState({ shouldRedirect: '/drafts' });
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  togglePostMenu = () => {
    const { shouldShowPublishPostMenu: oldVal } = this.state;
    this.setState({ shouldShowPublishPostMenu: !oldVal });
  };

  anyEditContentMenuIsOpen = () => {
    const { formatSelectionNode, editSectionNode } = this.state;
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
    return new Promise((resolve, reject) => {
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
        if (this.props.match.params.id !== NEW_POST_URL_ID) {
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
    const { editSectionNode, shouldShowEditSectionMenu } = this.state;
    // if there's no currently selected MetaType node or it's a spacer (no menu for spacer) we're done.
    if (
      !editSectionNode.get('id') ||
      editSectionNode.get('type') === NODE_TYPE_SPACER
    ) {
      return;
    }
    console.debug('EDIT SECTION MENU');
    return new Promise(resolve => {
      this.setState(
        { shouldShowEditSectionMenu: !shouldShowEditSectionMenu },
        resolve
      );
    });
  };

  // return the prev or next node if the caret is at the "edge" of a paragraph
  // and the user hits the corresponding arrow key
  getNeighborOnArrowNavigation = (evt, selectionOffsets) => {
    const [[_, __, currentNodeId]] = selectionOffsets;
    const currentNode = this.documentModel.getNode(currentNodeId);
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
      neighborNode = this.documentModel.getPrevNode(currentNodeId);
    } else if (
      (evt.keyCode === KEYCODE_DOWN_ARROW && isAtBottom) ||
      (evt.keyCode === KEYCODE_RIGHT_ARROW &&
        (isAtEnd || currentNode.get('content', '').length === 0))
    ) {
      neighborNode = this.documentModel.getNextNode(currentNodeId);
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
    const [[startNodeCaretStart, startNodeCaretEnd, _]] = selectionOffsets;

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
      return;
    }

    const { editSectionNode } = this.state;
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
      } else {
        setCaret(
          neighborNode.get('id'),
          [KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode) ? -1 : 0
        );
      }
      return;
    }
    // we're currently inside a selected MetaType node
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
        return this.sectionEdit(prevNode.get('id'));
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
      return this.sectionEdit(nextNode.get('id'));
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
      this.state.shouldShowEditSectionMenu
    ) {
      return;
    }

    evt.stopPropagation();
    evt.preventDefault();

    const [focusNodeId, caretOffset, shouldFocusLastNode] = doDelete(
      this.documentModel,
      selectionOffsets
    );
    if (!focusNodeId) {
      return;
    }

    // clear the selected format node when deleting the highlighted selection
    // NOTE: must wait for state have been set or setCaret will check stale values
    await this.closeAllEditContentMenus();
    return this.commitUpdates(focusNodeId, caretOffset, shouldFocusLastNode);
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
    if (this.state.shouldShowEditSectionMenu) {
      return;
    }

    const focusNodeId = doSplit(this.documentModel, selectionOffsets);
    if (!focusNodeId) {
      return;
    }

    evt.stopPropagation();
    evt.preventDefault();

    await this.closeAllEditContentMenus();

    if (this.props.match.params.id === NEW_POST_URL_ID) {
      return this.createNewPost();
    }
    return this.commitUpdates(focusNodeId, 0);
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

    const { editSectionNode } = this.state;
    if (editSectionNode.get('id')) {
      return;
    }

    const [[startNodeCaretStart, startNodeCaretEnd, _]] = selectionOffsets;
    // select-and-type ?? delete selection first
    if (startNodeCaretStart !== startNodeCaretEnd) {
      doDelete(this.documentModel, selectionOffsets);
    }

    const [focusNodeId, caretOffset] = syncToDom(
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
    return this.commitUpdates(focusNodeId, caretOffset);
  };

  handleSyncFromDom(evt, selectionOffsets) {
    if (
      // this is the only way to get an emoji keyboard insert without using a custom MutationObserver
      evt.type !== 'input' ||
      // don't sync the "v" from a paste operation
      this.didPaste ||
      // don't sync the "x" from a cut operation
      this.didCut
    ) {
      return;
    }

    const [focusNodeId, caretOffset] = syncFromDom(
      this.documentModel,
      selectionOffsets,
      evt
    );
    if (!focusNodeId) {
      return;
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    this.commitUpdates(focusNodeId, caretOffset);
  }

  // MAIN "ON" EVENT CALLBACKS
  getSelectionOffsetsOrEditSectionNode = () => {
    let selectionOffsets = getHighlightedSelectionOffsets();
    const [start] = selectionOffsets;
    if (start.length === 0) {
      const { editSectionNode } = this.state;
      // if there's a MetaNode selected, override DOM selection
      if (!editSectionNode.get('id')) {
        return [[]];
      }
      selectionOffsets = [[0, 0, editSectionNode.get('id')]];
    }
    return selectionOffsets;
  };

  handleKeyDown = async evt => {
    const { insertMenuNode } = this.state;
    // bail conditions
    // insert menu button is displayed
    if (
      insertMenuNode.get('id') &&
      // no range means the menu is closed
      (!getRange() ||
        // allow shift through so user can double tap it to open the menu
        evt.shiftKey)
    ) {
      // pass this event up to the menu to handle
      this.setState({ insertMenuDomEvent: evt });
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
    if (evt.defaultPrevented) {
      this.didHandleWithKeydown = true;
    }
  };

  handleKeyUp = async () => {};

  handleInput = async evt => {
    // any control keys being held down?
    if (
      evt.metaKey ||
      // cross-event coordination
      this.didCut ||
      this.didPaste ||
      this.didHandleWithKeydown
    ) {
      return;
    }
    const { editSectionNode } = this.state;
    // if there's a MetaNode selected, bail
    if (editSectionNode.get('id')) {
      return;
    }
    const selectionOffsets = this.getSelectionOffsetsOrEditSectionNode();
    const [start] = selectionOffsets;
    // if the caret isn't on a node with an id, bail
    if (start.length === 0) {
      return;
    }
    console.debug('INPUT');
    // for emoji keyboard insert
    this.handleSyncFromDom(evt, selectionOffsets);
    // since evt.inputType ('inputFromPaste','deleteFromCut', etc.) isn't compatible with Edge
    this.didPaste = false;
    this.didCut = false;
    this.didHandleWithKeydown = false;
  };

  handleMouseUp = async evt => {
    // console.debug('MouseUp: ', evt)
    let selectionOffsets = getHighlightedSelectionOffsets();
    const [start] = selectionOffsets;
    if (start.length === 0) {
      const { editSectionNode } = this.state;
      // if there's a MetaNode selected, override DOM selection
      if (!editSectionNode.get('id')) {
        return;
      }
      selectionOffsets = [[0, 0, editSectionNode.get('id')]];
    }
    evt.persist(); // because of awaits below
    // close everything by default, this.sectionEdit() callback will fire after this to override
    await this.closeAllEditContentMenus();
    await this.manageInsertMenu(evt, selectionOffsets);
    return this.manageFormatSelectionMenu(evt, selectionOffsets);
  };

  handleCut = async (evt, selectionOffsetsArg) => {
    if (evt.type !== 'cut' && !(evt.metaKey && evt.keyCode === KEYCODE_X)) {
      return;
    }
    console.debug('CUT', evt.type, evt.metaKey, evt.keyCode);
    this.didCut = true;
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const [
      [startNodeCaretStart, startNodeCaretEnd, startNodeId]
    ] = selectionOffsets;
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "paste" with clipboard data...
    if (evt.type !== 'cut') {
      if (startNodeCaretStart !== startNodeCaretEnd) {
        doDelete(this.documentModel, selectionOffsets);
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
    return this.commitUpdates(startNodeId, startNodeCaretStart);
  };

  handlePaste = async (evt, selectionOffsetsArg) => {
    // NOTE: this handler needs to pass through twice on a "paste" event
    // 1st: on "keydown" - this is to handle deleting selected text
    // 2nd: on "paste" - now that the selection is clear, paste in the text
    if (evt.type !== 'paste' && !(evt.metaKey && evt.keyCode === KEYCODE_V)) {
      return;
    }
    // this is to bypass the "keyup" & "input" handlers
    this.didPaste = true;

    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const [[startNodeCaretStart, startNodeCaretEnd, _]] = selectionOffsets;
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

    const [focusNodeId, caretOffset] = doPaste(
      this.documentModel,
      selectionOffsets,
      evt.clipboardData
    );
    if (!focusNodeId) {
      return;
    }
    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    return this.commitUpdates(focusNodeId, caretOffset);
  };

  // TODO: this function references the DOM and state.  So, it needs to pass-through values because it always executes - separate the DOM and state checks?
  manageInsertMenu = async (evt, selectionOffsetsArg) => {
    const selectionOffsets =
      selectionOffsetsArg || getHighlightedSelectionOffsets();
    const [
      [caretPositionStart, caretPositionEnd, selectedNodeId]
    ] = selectionOffsets;
    if (!selectedNodeId) {
      return;
    }

    console.debug('MANAGE INSERT');

    const selectedNodeMap = this.documentModel.getNode(selectedNodeId);
    const selectedNode = getNodeById(selectedNodeId);

    if (
      selectedNode &&
      caretPositionStart === caretPositionEnd &&
      selectedNodeMap.get('type') === NODE_TYPE_P &&
      selectedNodeMap.get('content', '').length === 0
    ) {
      return new Promise(resolve => {
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
    }

    return new Promise(resolve => {
      this.setState({ insertMenuNode: Map() }, resolve);
    });
  };

  async uploadFile(file) {
    const { post } = this.state;
    // TODO: allow multiple files
    const formData = new FormData();
    formData.append('postId', post.get('id'));
    formData.append('userId', post.get('user_id'));
    formData.append('fileData', file);
    return uploadImage(formData);
  }

  /**
   * INSERT SECTIONS
   */
  insertSection = async (sectionType, [firstFile] = []) => {
    const { insertMenuNode } = this.state;
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

    return new Promise(resolve => {
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

  getLinkUrlForwardedRef = ref => {
    if (!ref) return;
    this.inputRef = ref;
    const { formatSelectionModel } = this.state;
    if (formatSelectionModel.get(SELECTION_ACTION_LINK)) {
      ref.focus();
    }
  };

  replaceImageFile = async ([firstFile]) => {
    const { editSectionNode } = this.state;
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
    const { editSectionNode } = this.state;
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
    const { editSectionNode } = this.state;
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
    const { editSectionNode } = this.state;
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

  updateLinkUrl = value => {
    const { formatSelectionNode, formatSelectionModel } = this.state;
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
    const isEscKey = evt && evt.keyCode === KEYCODE_ESC;
    const [[startOffset, endOffset, selectedNodeId], end] = selectionOffsets;
    if (
      // no node
      !selectedNodeId ||
      // collapsed caret
      startOffset === endOffset ||
      // hit esc
      isEscKey
    ) {
      const { formatSelectionNode } = this.state;
      if (formatSelectionNode.get('id')) {
        return new Promise(resolve => {
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
      }
      return;
    }

    if (end) {
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
      startOffset,
      endOffset,
      end,
      range,
      range.getBoundingClientRect()
    );
    const rect = range.getBoundingClientRect();
    const selectedNodeModel = this.documentModel.getNode(selectedNodeId);

    return new Promise(resolve =>
      this.setState(
        {
          formatSelectionNode: selectedNodeModel,
          formatSelectionModel: getSelection(
            selectedNodeModel,
            startOffset,
            endOffset
          ),
          formatSelectionMenuTopOffset: rect.top,
          formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2
        },
        resolve
      )
    );
  };

  handleSelectionAction = async action => {
    const { formatSelectionModel, formatSelectionNode } = this.state;

    const [focusNodeId, updatedNode, updatedSelection] = selectionFormatAction(
      this.documentModel,
      formatSelectionNode,
      formatSelectionModel,
      action
    );
    await this.commitUpdates(focusNodeId);
    this.setState(
      {
        formatSelectionNode: updatedNode,
        formatSelectionModel: updatedSelection
      },
      () => {
        // TODO: selection highlight will be lost after rendering - create new range and add to window.selection
        if (updatedSelection.get(SELECTION_ACTION_LINK) && this.inputRef) {
          this.inputRef.focus();
        }
      }
    );
  };

  render() {
    const {
      post,
      nodesById,
      shouldShow404,
      shouldRedirect,
      insertMenuDomEvent,
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
    } = this.state;

    if (shouldShow404) return <Page404 />;
    if (shouldRedirect) return <Redirect to={shouldRedirect} />;

    return (
      <>
        <div role="presentation" onMouseUp={this.handleMouseUp}>
          <Header>
            <HeaderContentContainer>
              <LogoLinkStyled to="/">✍️ filbert</LogoLinkStyled>
              <HeaderLinksContainer>
                <PublishPost onClick={this.togglePostMenu}>publish</PublishPost>
                <DeletePost onClick={this.deletePost}>delete</DeletePost>
                <NewPost to="/edit/new">new</NewPost>
                <ListDrafts to="/drafts">drafts</ListDrafts>
                <SignedInUser
                  onClick={() => {
                    if (confirm('Logout?')) {
                      signout();
                      this.setState({ shouldRedirect: '/' });
                    }
                  }}
                >
                  {getUserName()}
                </SignedInUser>
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
            windowEvent={insertMenuDomEvent}
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
            offsetTop={formatSelectionMenuTopOffset}
            offsetLeft={formatSelectionMenuLeftOffset}
            nodeModel={formatSelectionNode}
            selectionModel={formatSelectionModel}
            selectionAction={this.handleSelectionAction}
            updateLinkUrl={this.updateLinkUrl}
            forwardRef={this.getLinkUrlForwardedRef}
          />
        )}
      </>
    );
  }
}
