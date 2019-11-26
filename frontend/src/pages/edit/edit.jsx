import React from 'react';
import styled from 'styled-components';
import { List, Map, fromJS } from 'immutable';
import { Redirect } from 'react-router-dom';

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  uploadImage,
} from '../../common/fetch';
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
} from '../../common/layout-styled-components';
import Footer from '../footer';

import { getUserName, signout } from '../../common/session';
import {
  confirmPromise,
  getCanonicalFromTitle,
  imageUrlIsId,
} from '../../common/utils';
import {
  getRange,
  getNodeId,
  getFirstHeadingContent,
  setCaret,
  getHighlightedSelectionOffsets,
  isControlKey,
} from '../../common/dom';

import {
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_IMAGE,
  KEYCODE_ENTER,
  KEYCODE_BACKSPACE,
  KEYCODE_ESC,
  NEW_POST_URL_ID,
  ROOT_NODE_PARENT_ID,
  NODE_TYPE_P,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL,
  POST_ACTION_REDIRECT_TIMEOUT,
} from '../../common/constants';
import { lineHeight } from "../../common/css";

import ContentNode from '../../common/content-node.component';
import { moveCaret } from './helpers-document-model/caret';
import { doDelete } from './helpers-document-model/delete';
import DocumentModel from './document-model';
import { syncFromDom, syncToDom } from './helpers-document-model/dom-sync';
import { insertSectionHelper } from './helpers-document-model/insert';
import { doPaste } from './helpers-document-model/paste';
import { selectionFormatAction } from './helpers-document-model/selection-format-action';
import { doSplit } from './helpers-document-model/split';
import UpdateManager from './update-manager';

import {
  Selection,
  getSelection,
  upsertSelection,
} from './selection-helpers';

import InsertSectionMenu from './components/insert-section-menu';
import EditImageForm from './components/edit-image-form';
import EditQuoteForm from './components/edit-quote-form';
import FormatSelectionMenu from './components/format-selection-menu';
import PublishPostForm from '../../common/edit-publish-post-form';

import Page404 from '../404';

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
      nodesByParentId: Map(),
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
    const focusNodeId = this.documentModel.insertSection(NODE_TYPE_SECTION_H1, 0);
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
      const focusNodeId = this.documentModel.getPreviousFocusNodeId(this.documentModel.rootId);
      this.setState({
        post: fromJS(post),
        nodesByParentId: this.documentModel.nodesByParentId,
        shouldShow404: false
      }, () => {
        const focusNodeId = this.documentModel.getNextFocusNodeId(this.documentModel.rootId);
        setCaret(focusNodeId, -1, true);
        this.manageInsertMenu();
        window.scrollTo(0, 0);
      })
    } catch (err) {
      // console.error(err);
      this.setState({ nodesByParentId: Map(), shouldShow404: true })
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
  
  commitUpdates = (focusNodeId, offset = -1, shouldFocusLastChild) => {
    // TODO: optimistically save updated nodes - look ma, no errors!
    const {
      formatSelectionNode,
      editImageSectionNode,
      editQuoteSectionNode,
    } = this.state;
    return new Promise((resolve, reject) => {
      // roll with state changes TODO: handle errors - roll back?
      this.setState({
        nodesByParentId: this.documentModel.nodesByParentId,
        shouldShowInsertMenu: false,
        insertMenuIsOpen: false,
        editSectionId: null,
      }, () => {
        // if we're on /edit/new, we don't save until user hits "enter"
        if (this.props.match.params.id !== NEW_POST_URL_ID) {
          this.saveContentBatchDebounce();
        }
        // if a menu isn't open, re-place the caret
        if (!formatSelectionNode.get('id') && !editImageSectionNode.get('id') && !editQuoteSectionNode.get('id')) {
          setCaret(focusNodeId, offset, shouldFocusLastChild);
        }
        this.manageInsertMenu();
        resolve();
      });
    })
  }
  
  handleBackspace = async (evt, selectionOffsets) => {
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
    await new Promise(resolve => {
      this.setState({ formatSelectionNode: Map() }, resolve)
    });
    
    this.commitUpdates(focusNodeId, caretOffset, shouldFocusLastNode);
  }
  
  /**
   * ENTER
   * @param evt
   * @param selectionOffsets
   * @returns {Promise<void>}
   */
  handleEnter(evt, selectionOffsets) {
    if (evt.keyCode !== KEYCODE_ENTER) {
      return;
    }
    
    const focusNodeId = doSplit(this.documentModel, selectionOffsets);
    if (!focusNodeId) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    if (this.props.match.params.id === NEW_POST_URL_ID) {
      return this.createNewPost();
    }
    this.commitUpdates(focusNodeId, 0);
  }
  
  /**
   * Capture edit intent one keystroke at a time.  Update JS Model then let React selectively re-render DOM
   *
   // TODO: better cut/paste
   // TODO: handle select & type
   */
  handleSyncToDom(evt, selectionOffsets) {
    // don't send updates for control keys
    if (isControlKey(evt.keyCode)
      // stopped by another handler like Backspace or Enter
      || evt.isPropagationStopped()) {
      return;
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
    // Stop all updates to the contenteditable div!
    evt.stopPropagation();
    evt.preventDefault();
    
    if (evt.type !== 'input') {
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
  
  handleKeyDown = (evt) => {
    // any control keys being held down?
    if (evt.metaKey || isControlKey(evt.keyCode)) {
      return;
    }
    const selectionOffsets = getHighlightedSelectionOffsets();
    const [start] = selectionOffsets;
    if (start.length === 0) {
      return;
    }
    //console.debug('KeyDown: ', evt)
    this.handleBackspace(evt, selectionOffsets);
    // TODO this.handleDel(evt); // currently, no support for the 'Del' key
    this.handleEnter(evt, selectionOffsets);
    this.handleSyncToDom(evt, selectionOffsets);
  }
  
  handleKeyUp = (evt) => {
    // any control keys being held down?
    if (evt.metaKey) {
      return;
    }
    //console.debug('KeyUp: ', evt)
    const selectionOffsets = getHighlightedSelectionOffsets();
    this.handleSyncFromDom(evt, selectionOffsets);
    moveCaret(this.documentModel, selectionOffsets, evt);
    this.manageInsertMenu(selectionOffsets);
    this.manageFormatSelectionMenu(evt, selectionOffsets);
  }
  
  handleMouseUp = (evt) => {
    //console.debug('MouseUp: ', evt)
    const selectionOffsets = getHighlightedSelectionOffsets();
    moveCaret(this.documentModel, selectionOffsets, evt);
    this.manageInsertMenu(selectionOffsets);
    this.manageFormatSelectionMenu(evt, selectionOffsets);
    // close edit section menus by default, this.sectionEdit() callback will fire after this to override
    this.sectionEditClose();
  }
  
  handlePaste = (evt) => {
    const selectionOffsets = getHighlightedSelectionOffsets();
    const [focusNodeId, caretOffset] = doPaste(this.documentModel, selectionOffsets, evt.clipboardData);
    if (!focusNodeId) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
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
    if ([NODE_TYPE_SECTION_IMAGE, NODE_TYPE_SECTION_QUOTE].includes(sectionType)) {
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
      case NODE_TYPE_SECTION_IMAGE: {
        newState.editImageSectionNode = section;
        break;
      }
      case NODE_TYPE_SECTION_QUOTE: {
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
      nodesByParentId,
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
    
    const root = this.documentModel.nodesByParentId.get(ROOT_NODE_PARENT_ID, List()).get(0, Map());
    
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
            {root.get('id') && (
              <div id="filbert-edit-container"
                   contentEditable={true}
                   suppressContentEditableWarning={true}
                   onKeyDown={this.handleKeyDown}
                   onKeyUp={this.handleKeyUp}
                   onInput={this.handleKeyUp}
                   onPaste={this.handlePaste}
              >
                <ContentNode post={post} node={root} nodesByParentId={nodesByParentId} isEditing={this.sectionEdit} />
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
