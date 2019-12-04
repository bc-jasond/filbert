import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
import { Redirect } from 'react-router-dom';

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  uploadImage,
} from '../../../common/fetch';
import {
  Article,
  DeletePost,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LogoLinkStyled,
  ListDrafts,
  NewPost,
  PublishPost,
  SignedInUser,
} from '../../../common/components/layout-styled-components';
import Footer from '../../footer';

import { getUserName, signout } from '../../../common/session';
import {
  confirmPromise,
  getCanonicalFromTitle,
  imageUrlIsId,
} from '../../../common/utils';
import {
  getRange,
  getNodeId,
  getFirstHeadingContent,
  setCaret,
  getHighlightedSelectionOffsets,
  isControlKey,
} from '../../../common/dom';

import {
  NODE_TYPE_H1,
  NODE_TYPE_QUOTE,
  NODE_TYPE_IMAGE,
  KEYCODE_ENTER,
  KEYCODE_BACKSPACE,
  KEYCODE_ESC,
  NEW_POST_URL_ID,
  NODE_TYPE_P,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL,
  POST_ACTION_REDIRECT_TIMEOUT, KEYCODE_X, KEYCODE_V,
} from '../../../common/constants';
import { lineHeight } from "../../../common/css";

import Document from '../../../common/components/document.component';
import { moveCaret } from '../document-model-helpers/caret';
import { doDelete } from '../document-model-helpers/delete';
import DocumentModel from '../document-model';
import { syncFromDom, syncToDom } from '../document-model-helpers/dom-sync';
import { insertSectionHelper } from '../document-model-helpers/insert';
import { doPaste } from '../document-model-helpers/paste';
import { selectionFormatAction } from '../document-model-helpers/selection-format-action';
import { doSplit } from '../document-model-helpers/split';
import UpdateManager from '../update-manager';

import {
  Selection,
  getSelection,
  upsertSelection,
} from '../selection-helpers';

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
      shouldRedirectToHome: false,
      shouldRedirectToDrafts: false,
      shouldRedirectToEditWithId: false,
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false,
      insertMenuTopOffset: 0,
      insertMenuLeftOffset: 0,
      editImageSectionNode: Map(),
      editQuoteSectionNode: Map(),
      editSectionMetaFormTopOffset: 0,
      formatSelectionNode: Map(),
      formatSelectionModel: Selection(),
      shouldShowPublishPostMenu: false,
      shouldRedirectToPublishedPostId: false,
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
    }
  }
  
  async componentDidMount() {
    console.debug("EDIT - didMount")
    try {
      window.addEventListener('resize', this.manageInsertMenu.bind(this));
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
      console.debug("EDIT - didUpdate")
      
      this.setState({
        shouldRedirectToEditWithId: false,
        shouldShowInsertMenu: false,
      })
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
  }
  
  saveContentBatchDebounce() {
    console.debug("Batch Debounce");
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 750);
  }
  
  newPost() {
    console.debug("New PostNew PostNew PostNew PostNew PostNew Post");
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.updateManager.init(postPlaceholder);
    this.documentModel.init(postPlaceholder, this.updateManager);
    this.updateManager.stageNodeUpdate(this.documentModel.rootId);
    const focusNodeId = this.documentModel.insertSection(NODE_TYPE_H1, 0);
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
    this.setState({ shouldRedirectToEditWithId: postId })
  }
  
  loadPost = async () => {
    try {
      const { post, contentNodes } = await apiGet(`/edit/${this.props.match.params.id}`);
      this.updateManager.init(post);
      this.documentModel.init(post, this.updateManager, contentNodes);
      this.setState({
        post: this.documentModel.post,
        nodesById: this.documentModel.nodesById,
        shouldShow404: false
      }, () => {
        setCaret(DocumentModel.getLastNode(this.documentModel.nodesById).get('id'), -1, true);
        this.manageInsertMenu();
        window.scrollTo(0, 0);
      })
    } catch (err) {
      console.error(err);
      this.setState({ nodesById: Map(), shouldShow404: true })
    }
  }
  updatePost = (fieldName, value) => {
    const { post } = this.state;
    this.setState({
      post: post.set(fieldName, value),
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
    })
  }
  savePost = async () => {
    try {
      const { post } = this.state;
      await apiPatch(`/post/${post.get('id')}`, {
        title: post.get('title'),
        canonical: post.get('canonical'),
        abstract: post.get('abstract'),
      });
      this.setState({
        shouldShowPostSuccess: true,
        shouldShowPostError: null,
      }, () => {
        setTimeout(() => this.setState({ shouldShowPostSuccess: null }), POST_ACTION_REDIRECT_TIMEOUT);
      })
    } catch (err) {
      this.setState({ shouldShowPostError: true })
    }
  }
  publishPost = async () => {
    const { post } = this.state;
    
    try {
      await confirmPromise('Publish this post?  This makes it public.');
      await this.savePost();
      await apiPost(`/publish/${post.get('id')}`);
      this.setState({
        shouldShowPostSuccess: true,
        shouldShowPostError: null,
      }, () => {
        setTimeout(() => this.setState({ shouldRedirectToPublishedPostId: post.get('canonical') }), POST_ACTION_REDIRECT_TIMEOUT);
      });
    } catch (err) {
      this.setState({ shouldShowPostError: true })
    }
  }
  deletePost = async () => {
    const { post } = this.state;
    try {
      if (post.get('published')) {
        await confirmPromise(`Delete post ${post.get('title')}?`);
        await apiDelete(`/post/${post.get('id')}`);
        // if editing a published post - assume redirect to published posts list
        this.setState({ shouldRedirectToHome: true });
        return;
      }
      await confirmPromise(`Delete draft ${post.get('title')}?`);
      await apiDelete(`/draft/${post.get('id')}`);
      this.setState({ shouldRedirectToDrafts: true });
    } catch (err) {
      console.error('Delete post error:', err)
    }
  }
  togglePostMenu = () => {
    const { shouldShowPublishPostMenu: oldVal } = this.state;
    this.setState({ shouldShowPublishPostMenu: !oldVal })
  }
  
  anyEditContentMenuIsOpen = () => {
    const {
    formatSelectionNode,
      editImageSectionNode ,
      editQuoteSectionNode,
    } = this.state;
    return formatSelectionNode.get('id') || editImageSectionNode.get('id') || editQuoteSectionNode.get('id')
  }
  
  closeAllEditContentMenus = async () => {
    return new Promise(resolve => {
      this.setState({
        formatSelectionNode: Map(),
        editImageSectionNode: Map(),
        editQuoteSectionNode: Map(),
      }, resolve)
    });
  }
  
  commitUpdates = (focusNodeId, offset = -1, shouldFocusLastChild) => {
    // TODO: optimistically save updated nodes - look ma, no errors!
    return new Promise((resolve, reject) => {
      // roll with state changes TODO: handle errors - roll back?
      this.setState({
        nodesById: this.documentModel.nodesById,
        shouldShowInsertMenu: false,
        insertMenuIsOpen: false,
        editSectionId: null,
      }, () => {
        // if we're on /edit/new, we don't save until user hits "enter"
        if (this.props.match.params.id !== NEW_POST_URL_ID) {
          this.saveContentBatchDebounce();
        }
        // if a menu isn't open, re-place the caret
        if (!this.anyEditContentMenuIsOpen()) {
          setCaret(focusNodeId, offset, shouldFocusLastChild);
        }
        this.manageInsertMenu();
        resolve();
      });
    })
  }
  
  handleBackspace = async (evt, selectionOffsets) => {
    // if the caret is collapsed, only let the "backspace" key through...
    // otherwise, if there are any other key strokes that aren't control keys - delete the selection!
    if (evt.keyCode !== KEYCODE_BACKSPACE) {
      return;
    }
    
    const [focusNodeId, caretOffset, shouldFocusLastNode] = doDelete(this.documentModel, selectionOffsets);
    if (!focusNodeId) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
  
    // clear the selected format node when deleting the highlighted selection
    // NOTE: must wait for state have been set or setCaret will check stale values
    await this.closeAllEditContentMenus();
    
    this.commitUpdates(focusNodeId, caretOffset, shouldFocusLastNode);
  }
  
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
    this.commitUpdates(focusNodeId, 0);
  }
  
  /**
   * Capture edit intent one keystroke at a time.  Update JS Model then let React selectively re-render DOM
   *
   */
  handleSyncToDom(evt, selectionOffsets) {
    // don't send updates for control keys
    if (isControlKey(evt.keyCode)
      // stopped by another handler like Backspace or Enter
      || evt.isPropagationStopped()
      // ignore "paste" - propagation hasn't been stopped because it would cancel the respective "paste", "cut" events
      || this.didPaste
      // ignore "cut"
      || this.didCut) {
      return;
    }
  
    const [
      [startNodeCaretStart, startNodeCaretEnd, startNode]
    ] = selectionOffsets;
    // select-and-type ?? delete selection first
    if (startNodeCaretStart !== startNodeCaretEnd) {
      doDelete(this.documentModel, selectionOffsets);
    }
    
    const [focusNodeId, caretOffset] = syncToDom(this.documentModel, selectionOffsets, evt);
    if (!focusNodeId) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we place it back with JS
    this.commitUpdates(focusNodeId, caretOffset);
  }
  
  handleSyncFromDom(evt, selectionOffsets) {
    if (
      // this is the only way to get an emoji keyboard insert without using a custom MutationObserver
      evt.type !== 'input'
      // don't sync the "v" from a paste operation
      || this.didPaste
      // don't sync the "x" from a cut operation
      || this.didCut) {
      return;
    }
    
    const [focusNodeId, caretOffset] = syncFromDom(this.documentModel, selectionOffsets, evt);
    if (!focusNodeId) {
      return;
    }
    
    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    this.commitUpdates(focusNodeId, caretOffset);
  }
  
  // MAIN "ON" EVENT CALLBACKS
  
  handleKeyDown = async (evt) => {
    if (
      // ignore control or modifier keys
      // unless related to a supported destructive operation like: "cut" or "paste"
      (evt.metaKey || isControlKey(evt.keyCode))
      // allow "cut"
      && !(evt.metaKey && evt.keyCode === KEYCODE_X)
      // allow "paste"
      && !(evt.metaKey && evt.keyCode === KEYCODE_V)
      ) {
      return;
    }
    const selectionOffsets = getHighlightedSelectionOffsets();
    const [start] = selectionOffsets;
    if (start.length === 0) {
      return;
    }
    // since we're `await`ing below we need to persist this evt object or React will clean it up
    evt.persist();
    //console.debug('KeyDown: ', evt)
    // await here because we rely on handleBackspace calling setState and resolving on the callback
    //  this is to unset nodes that are checked in commitUpdates() for setCaret()
    await this.handleBackspace(evt, selectionOffsets);
    // TODO this.handleDel(evt); // currently, no support for the 'Del' key
    await this.handleEnter(evt, selectionOffsets);
    await this.handlePaste(evt, selectionOffsets);
    await this.handleCut(evt, selectionOffsets);
    this.handleSyncToDom(evt, selectionOffsets);
  }
  
  handleKeyUp = async (evt) => {
    // any control keys being held down?
    if (evt.metaKey) {
      return;
    }
    //console.debug('KeyUp: ', evt)
    const selectionOffsets = getHighlightedSelectionOffsets();
    const [start] = selectionOffsets;
    if (start.length === 0) {
      return;
    }
    // because of "await"
    evt.persist();
    
    await this.handlePaste(evt, selectionOffsets);
    this.handleSyncFromDom(evt, selectionOffsets);
    moveCaret(this.documentModel, selectionOffsets, evt);
    this.manageInsertMenu(selectionOffsets);
    this.manageFormatSelectionMenu(evt, selectionOffsets);
    // since evt.inputType ('inputFromPaste','deleteFromCut', etc.) isn't compatible with Edge
    this.didPaste = false;
    this.didCut = false;
  }
  
  handleMouseUp = (evt) => {
    //console.debug('MouseUp: ', evt)
    const selectionOffsets = getHighlightedSelectionOffsets();
    const [start] = selectionOffsets;
    if (start.length === 0) {
      return;
    }
    moveCaret(this.documentModel, selectionOffsets, evt);
    this.manageInsertMenu(selectionOffsets);
    this.manageFormatSelectionMenu(evt, selectionOffsets);
    // close edit section menus by default, this.sectionEdit() callback will fire after this to override
    this.sectionEditClose();
  }
  
  handleCut = async (evt, selectionOffsetsArg) => {
    console.log("CUT", evt.type, evt.metaKey, evt.keyCode)
    if (evt.type !== 'cut'
      && !(evt.metaKey && evt.keyCode === KEYCODE_X)) {
      return;
    }
    this.didCut = true;
    const selectionOffsets = selectionOffsetsArg || getHighlightedSelectionOffsets();
    const [
      [startNodeCaretStart, startNodeCaretEnd, startNode]
    ] = selectionOffsets;
    const startNodeId = getNodeId(startNode);
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
    console.debug("CUT selection", selectionString);
    evt.clipboardData.setData('text/plain', selectionString);
    
    // NOTE: if these get called on the 'keydown' event, they'll cancel the 'cut' event
    evt.stopPropagation();
    evt.preventDefault();
  
    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    this.commitUpdates(startNodeId, startNodeCaretStart);
  }
  
  handlePaste = async (evt, selectionOffsetsArg) => {
    // NOTE: this handler needs to pass through twice on a "paste" event
    // 1st: on "keydown" - this is to handle deleting selected text
    // 2nd: on "paste" - now that the selection is clear, paste in the text
    if (evt.type !== 'paste'
      && !(evt.metaKey && evt.keyCode === KEYCODE_V)) {
      return;
    }
    // this is to bypass the "keyup" & "input" handlers
    this.didPaste = true;
    
    const selectionOffsets = selectionOffsetsArg || getHighlightedSelectionOffsets();
    const [
      [startNodeCaretStart, startNodeCaretEnd, _]
    ] = selectionOffsets;
    // if we're coming from "keydown" - check for a highlighted selection and delete it, then bail
    // we'll come back through from "paste" with clipboard data...
    if (evt.type !== 'paste') {
      if (startNodeCaretStart !== startNodeCaretEnd) {
        doDelete(this.documentModel, selectionOffsets);
      }
      return;
    }
    // on "paste" this hasn't been set yet
    evt.persist();
    // NOTE: if these get called on the 'keydown' event, they'll cancel the 'paste' event
    evt.stopPropagation();
    evt.preventDefault();
    
    // for commitUpdates() -> setCaret()
    await this.closeAllEditContentMenus();
    
    const [focusNodeId, caretOffset] = doPaste(this.documentModel, selectionOffsets, evt.clipboardData);
    if (!focusNodeId) {
      return;
    }
    
    this.commitUpdates(focusNodeId, caretOffset);
  }
  
  manageInsertMenu(selectionOffsetsArg) {
    const selectionOffsets = selectionOffsetsArg || getHighlightedSelectionOffsets();
    const [
      [caretPositionStart, caretPositionEnd, selectedNode]
    ] = selectionOffsets;
    // save current nodeId because the selection will disappear when the insert menu is shown
    this.insertMenuSelectedNodeId = getNodeId(selectedNode);
    const selectedNodeMap = this.documentModel.getNode(this.insertMenuSelectedNodeId);
    
    if (selectedNode
      && caretPositionStart === caretPositionEnd
      && selectedNodeMap.get('type') === NODE_TYPE_P
      && selectedNodeMap.get('content', '').length === 0) {
      this.setState({
        shouldShowInsertMenu: true,
        insertMenuTopOffset: selectedNode.offsetTop,
        insertMenuLeftOffset: selectedNode.offsetLeft,
      });
      return;
    }
    
    this.setState({ shouldShowInsertMenu: false, insertMenuIsOpen: false });
  }
  
  toggleInsertMenu = () => {
    const { insertMenuIsOpen } = this.state;
    this.setState({ insertMenuIsOpen: !insertMenuIsOpen }, () => {
      if (insertMenuIsOpen) {
        setCaret(this.insertMenuSelectedNodeId);
      }
    });
  }
  
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
    const focusNodeId = await insertSectionHelper(
      this.documentModel,
      sectionType,
      this.insertMenuSelectedNodeId,
      this.uploadFile.bind(this, firstFile),
    );
    if (!focusNodeId) {
      return;
    }
    await this.commitUpdates(focusNodeId);
    if ([NODE_TYPE_IMAGE, NODE_TYPE_QUOTE].includes(sectionType)) {
      this.sectionEdit(focusNodeId)
    }
  }
  
  sectionEdit = (sectionId) => {
    const [sectionDomNode] = document.getElementsByName(sectionId);
    const section = this.documentModel.getNode(sectionId);
    console.log('SECTION CALLBACK ', sectionId);
    
    const newState = {
      // hide all other menus here because this callback fires last
      // insert menu
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false,
      // format selection menu
      formatSelectionNode: Map(),
      formatSelectionModel: Selection(),
      // hide edit section menu by default
      editImageSectionNode: Map(),
      editQuoteSectionNode: Map(),
      editSectionMetaFormTopOffset: sectionDomNode.offsetTop,
    }
    
    switch (section.get('type')) {
      case NODE_TYPE_IMAGE: {
        newState.editImageSectionNode = section;
        break;
      }
      case NODE_TYPE_QUOTE: {
        newState.editQuoteSectionNode = section;
        break;
      }
    }
    
    this.setState(newState, () => {
      if (this.inputRef) {
        // allow animations to finish or scroll goes wacko
        setTimeout(() => this.inputRef.focus(), 500)
      }
    });
    
    // 1. open edit menu
    // 2. position it based on the section
    // 3. save and close
    // 4. cancel and close
  }
  sectionEditClose = () => {
    this.setState({
      editImageSectionNode: Map(),
      editQuoteSectionNode: Map(),
    });
  }
  sectionDelete = (sectionId) => {
    if (confirm('Delete?')) {
      this.sectionEditClose();
      const focusNodeId = this.documentModel.getNextFocusNodeId(sectionId);
      this.documentModel.delete(sectionId);
      this.commitUpdates(focusNodeId);
    }
  }
  sectionDeleteImage = async (sectionId) => {
    if (confirm('Delete?')) {
      const { editImageSectionNode } = this.state;
      const urlField = editImageSectionNode.getIn(['meta', 'url']);
      if (imageUrlIsId(urlField)) {
        await apiDelete(`/image/${urlField}`)
      }
      this.sectionEditClose();
      const focusNodeId = this.documentModel.getNextFocusNodeId(sectionId);
      this.documentModel.delete(sectionId);
      this.commitUpdates(focusNodeId);
    }
  }
  
  getInputForwardedRef = (ref) => {
    if (!ref) return;
    this.inputRef = ref;
    ref.focus();
  }
  
  getLinkUrlForwardedRef = (ref) => {
    if (!ref) return;
    this.inputRef = ref;
    const { formatSelectionModel } = this.state;
    if (formatSelectionModel.get(SELECTION_ACTION_LINK)) {
      ref.focus();
    }
  }
  
  replaceImageFile = async ([firstFile]) => {
    const { editImageSectionNode } = this.state;
    const {
      imageId,
      width,
      height,
    } = await this.uploadFile(firstFile);
    const updatedImageSectionNode = editImageSectionNode
      .deleteIn(['meta', 'rotationDegrees'])
      .setIn(['meta', 'url'], imageId)
      .setIn(['meta', 'width'], width)
      .setIn(['meta', 'height'], height);
    this.documentModel.update(updatedImageSectionNode);
    this.setState({
      editImageSectionNode: updatedImageSectionNode,
    }, async () => {
      await this.commitUpdates()
    })
  }
  
  updateImageCaption = (value) => {
    const {
      editImageSectionNode,
    } = this.state;
    const updatedImageSectionNode = editImageSectionNode.setIn(['meta', 'caption'], value);
    this.documentModel.update(updatedImageSectionNode);
    this.setState({
      editImageSectionNode: updatedImageSectionNode,
    }, async () => {
      await this.commitUpdates();
    })
  }
  
  imageRotate = () => {
    const {
      editImageSectionNode,
    } = this.state;
    const currentRotationDegrees = editImageSectionNode.getIn(['meta', 'rotationDegrees'], 0);
    const updatedRotationDegrees = currentRotationDegrees === 270 ? 0 : currentRotationDegrees + 90;
    let updatedImageSectionNode = editImageSectionNode.setIn(['meta', 'rotationDegrees'], updatedRotationDegrees);
    this.documentModel.update(updatedImageSectionNode);
    this.setState({
      editImageSectionNode: updatedImageSectionNode,
    }, async () => {
      await this.commitUpdates();
    });
  }
  
  updateQuoteMeta = (value, metaKey) => {
    const {
      editQuoteSectionNode,
    } = this.state;
    const updatedQuoteSectionNode = editQuoteSectionNode.setIn(['meta', metaKey], value);
    this.documentModel.update(updatedQuoteSectionNode);
    this.setState({
      editQuoteSectionNode: updatedQuoteSectionNode,
    }, async () => {
      await this.commitUpdates();
    })
  }
  
  updateLinkUrl = (value) => {
    const {
      formatSelectionNode,
      formatSelectionModel,
    } = this.state;
    const updatedSelectionModel = formatSelectionModel.set(SELECTION_LINK_URL, value);
    const updatedNode = upsertSelection(
      formatSelectionNode,
      updatedSelectionModel,
    );
    this.documentModel.update(updatedNode);
    this.setState({
      formatSelectionNode: updatedNode,
      formatSelectionModel: updatedSelectionModel
    }, async () => {
      await this.commitUpdates();
    })
  }
  
  // TODO: bug - selection highlighting disappears on user input on format selection menu
  manageFormatSelectionMenu(evt, selectionOffsets) {
    const isEscKey = evt && evt.keyCode === KEYCODE_ESC;
    const [
      [startOffset, endOffset, selectedNode],
      middle,
      end,
    ] = selectionOffsets;
    if (!selectedNode || startOffset === endOffset || isEscKey) {
      this.setState({
        formatSelectionNode: Map(),
        formatSelectionModel: Selection(),
        formatSelectionMenuTopOffset: 0,
        formatSelectionMenuLeftOffset: 0,
      })
      return;
    }
    
    if (end) {
      // TODO: support highlight across multiple nodes
      console.info('// TODO: format selection across nodes: ', selectionOffsets);
      return;
    }
    const range = getRange();
    console.info('SELECTION: ', startOffset, endOffset, end, middle, range, range.getBoundingClientRect());
    const rect = range.getBoundingClientRect();
    const selectedNodeId = getNodeId(selectedNode);
    const selectedNodeModel = this.documentModel.getNode(selectedNodeId);
    // Top Offset (from top of document) - needs a heuristic, or I'm missing an API!
    // start with the top offset of the paragraph
    const paragraphTop = selectedNode.offsetTop;
    // get a percentage of where the start of the selection is relative to the length of the content
    const percentageOfText = (startOffset / selectedNode.textContent.length);
    // take that percentage from height of the paragraph
    const percentageOffset = selectedNode.offsetHeight * percentageOfText;
    // get closest clean division of the height by line height of the selection (this sort of works)
    let offsetByLineHeight = 0;
    let fueraDeControlCounter = 1000;
    while (true) {
      if (fueraDeControlCounter === 0) {
        break;
      }
      fueraDeControlCounter -= 1;
      if (offsetByLineHeight + lineHeight > percentageOffset) {
        break;
      }
      offsetByLineHeight += lineHeight;
    }
    //const
    this.setState({
      formatSelectionNode: selectedNodeModel,
      formatSelectionModel: getSelection(selectedNodeModel, startOffset, endOffset),
      formatSelectionMenuTopOffset: paragraphTop + offsetByLineHeight,
      formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2,
    });
  }
  
  handleSelectionAction = async (action) => {
    const {
      formatSelectionModel,
      formatSelectionNode,
    } = this.state;
    
    const [focusNodeId, updatedNode, updatedSelection] = selectionFormatAction(this.documentModel, formatSelectionNode, formatSelectionModel, action)
    await this.commitUpdates(focusNodeId);
    this.setState({
      formatSelectionNode: updatedNode,
      formatSelectionModel: updatedSelection
    }, () => {
      // TODO: selection highlight will be lost after rendering - create new range and add to window.selection
      if (updatedSelection.get(SELECTION_ACTION_LINK) && this.inputRef) {
        this.inputRef.focus();
      }
    })
  }
  
  render() {
    const {
      post,
      nodesById,
      shouldShow404,
      shouldRedirectToHome,
      shouldRedirectToDrafts,
      shouldRedirectToEditWithId,
      shouldShowInsertMenu,
      insertMenuIsOpen,
      insertMenuTopOffset,
      insertMenuLeftOffset,
      editImageSectionNode,
      editQuoteSectionNode,
      editSectionMetaFormTopOffset,
      formatSelectionNode,
      formatSelectionMenuTopOffset,
      formatSelectionMenuLeftOffset,
      formatSelectionModel,
      shouldShowPublishPostMenu,
      shouldRedirectToPublishedPostId,
      shouldShowPostError,
      shouldShowPostSuccess,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    if (shouldRedirectToHome) return (<Redirect to="/" />);
    if (shouldRedirectToDrafts) return (<Redirect to="/drafts" />);
    // huh, aren't we on /edit? - this is for coming from /edit/new...
    if (shouldRedirectToEditWithId) return (<Redirect to={`/edit/${shouldRedirectToEditWithId}`} />);
    if (shouldRedirectToPublishedPostId) return (<Redirect to={`/posts/${shouldRedirectToPublishedPostId}`} />);
    
    return (
      <React.Fragment>
        <main onMouseUp={this.handleMouseUp}>
          <Header>
            <HeaderContentContainer>
              <LogoLinkStyled to="/">✍️ filbert</LogoLinkStyled>
              <HeaderLinksContainer>
                <PublishPost onClick={this.togglePostMenu}>publish</PublishPost>
                <DeletePost onClick={this.deletePost}>delete</DeletePost>
                <NewPost to="/edit/new">new</NewPost>
                <ListDrafts to="/drafts">drafts</ListDrafts>
                <SignedInUser onClick={() => {
                  if (confirm('Logout?')) {
                    signout();
                    this.setState({ shouldRedirectToHome: true })
                  }
                }}>{getUserName()}</SignedInUser>
              </HeaderLinksContainer>
            </HeaderContentContainer>
          </Header>
          <HeaderSpacer id="header-spacer" />
          <ArticleStyled>
            {nodesById.size > 0 && (
              <div id="filbert-edit-container"
                   contentEditable={true}
                   suppressContentEditableWarning={true}
                   onKeyDown={this.handleKeyDown}
                   onKeyUp={this.handleKeyUp}
                   onInput={this.handleKeyUp}
                   onPaste={this.handlePaste}
                   onCut={this.handleCut}
              >
                <Document nodesById={nodesById} isEditing={this.sectionEdit} />
              </div>
            )}
          </ArticleStyled>
          <Footer />
        </main>
        {shouldShowPublishPostMenu && (<PublishPostForm
          post={post}
          updatePost={this.updatePost}
          publishPost={this.publishPost}
          savePost={this.savePost}
          close={this.togglePostMenu}
          successMessage={shouldShowPostSuccess}
          errorMessage={shouldShowPostError}
          forwardRef={this.getInputForwardedRef}
        />)}
        {shouldShowInsertMenu && (<InsertSectionMenu
          insertMenuTopOffset={insertMenuTopOffset}
          insertMenuLeftOffset={insertMenuLeftOffset}
          toggleInsertMenu={this.toggleInsertMenu}
          insertMenuIsOpen={insertMenuIsOpen}
          insertSection={this.insertSection}
        />)}
        {editImageSectionNode.get('id') && (<EditImageForm
          offsetTop={editSectionMetaFormTopOffset}
          nodeModel={editImageSectionNode}
          uploadFile={this.replaceImageFile}
          updateImageCaption={this.updateImageCaption}
          sectionDelete={this.sectionDeleteImage}
          imageRotate={this.imageRotate}
          forwardRef={this.getInputForwardedRef}
        />)}
        {editQuoteSectionNode.get('id') && (<EditQuoteForm
          offsetTop={editSectionMetaFormTopOffset}
          nodeModel={editQuoteSectionNode}
          updateMeta={this.updateQuoteMeta}
          sectionDelete={this.sectionDelete}
          forwardRef={this.getInputForwardedRef}
        />)}
        {formatSelectionNode.get('id') && (<FormatSelectionMenu
          offsetTop={formatSelectionMenuTopOffset}
          offsetLeft={formatSelectionMenuLeftOffset}
          nodeModel={formatSelectionNode}
          selectionModel={formatSelectionModel}
          selectionAction={this.handleSelectionAction}
          updateLinkUrl={this.updateLinkUrl}
          forwardRef={this.getLinkUrlForwardedRef}
        />)}
      </React.Fragment>
    )
  }
}
