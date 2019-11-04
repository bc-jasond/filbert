import React from 'react';
import { List, Map, fromJS } from 'immutable';
import { Redirect } from 'react-router-dom';

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost, uploadImage,
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
  cleanText,
  cleanTextOrZeroLengthPlaceholder,
  getDiffStartAndLength,
  getCanonicalFromTitle, imageUrlIsId,
} from '../../common/utils';
import {
  getRange,
  getCaretNode,
  getCaretNodeId,
  getCaretNodeType,
  getCaretOffset,
  getFirstHeadingContent,
  setCaret,
  getOffsetInParentContent,
  isControlKey,
} from '../../common/dom';

import {
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_IMAGE,
  KEYCODE_ENTER,
  KEYCODE_BACKSPACE,
  KEYCODE_DEL,
  KEYCODE_UP_ARROW,
  KEYCODE_DOWN_ARROW,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_ESC,
  NEW_POST_URL_ID,
  ROOT_NODE_PARENT_ID,
  NODE_TYPE_ROOT,
  NODE_TYPE_P,
  NODE_TYPE_OL,
  NODE_TYPE_LI,
  NODE_TYPE_PRE,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL, POST_ACTION_REDIRECT_TIMEOUT,
} from '../../common/constants';

import ContentNode from '../../common/content-node.component';
import EditDocumentModel from './edit-document-model';
import EditUpdateManager from './edit-update-manager';

import {
  handleBackspaceCode,
  handleDomSyncCode,
  handleEnterCode,
  handlePasteCode,
  insertCodeSection
} from './handle-code';
import { insertPhoto } from './handle-image';
import {
  handleBackspaceList,
  handleEnterList,
  insertList,
  splitListReplaceListItemWithSection,
} from './handle-list';
import {
  handleBackspaceParagraph,
  handleEnterParagraph,
  paragraphToTitle,
  titleToParagraph,
} from './handle-paragraph';
import { insertQuote } from './handle-quote';
import { insertSpacer } from './handle-spacer';
import {
  handleEnterTitle,
  handleBackspaceTitle,
  insertH1,
  insertH2
} from './handle-title';
import {
  Selection,
  adjustSelectionOffsetsAndCleanup,
  getSelection,
  upsertSelection,
} from './edit-selection-helpers';

import InsertSectionMenu from './insert-section-menu';
import EditImageForm from './edit-image-form';
import EditQuoteForm from './edit-quote-form';
import FormatSelectionMenu from './format-selection-menu';
import PublishPostForm from './edit-publish-post-form';

import Page404 from '../404';

export default class EditPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      post: Map(),
      nodesByParentId: Map(),
      root: null,
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
    try {
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
      console.info("componentDidUpdate");
      if (this.props.match.params.id === prevProps.match.params.id) {
        return;
      }
      
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
  
  documentModel = new EditDocumentModel();
  updateManager = new EditUpdateManager();
  commitTimeoutId;
  cancelledEvent; // to coordinate noops between event types keydown, keyup
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
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 750);
  }
  
  newPost() {
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.updateManager.init(postPlaceholder);
    this.documentModel.init(postPlaceholder, this.updateManager);
    this.updateManager.stageNodeUpdate(this.documentModel.rootId);
    const focusNodeId = this.documentModel.insertSection(NODE_TYPE_SECTION_H1, 0);
    this.setState({
      post: Map(),
      root: this.documentModel.nodesByParentId.get(ROOT_NODE_PARENT_ID).first(),
      nodesByParentId: this.documentModel.nodesByParentId,
    }, () => {
      setCaret(focusNodeId);
    });
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
        root: this.documentModel.root,
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
      this.setState({ root: null, nodesByParentId: Map(), shouldShow404: true })
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
  
  commitUpdates = (focusNodeId, offset = -1, shouldFocusLastChild = false, shouldSaveContentBatch = true /* used for a new post */) => {
    if (this.props.match.params.id === NEW_POST_URL_ID) {
      return this.createNewPost();
    }
    const {
      formatSelectionNode,
      editImageSectionNode,
      editQuoteSectionNode,
    } = this.state;
    // TODO: optimistically save updated nodes - look ma, no errors!
    // TODO: handle errors - roll back?
    // TODO: undo/redo entrypoint here?  AKA, don't setState({nodesByParentId:...}) anywhere else
    this.setState({
      nodesByParentId: this.documentModel.nodesByParentId,
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false,
      editSectionId: null,
    },() => {
      // TODO: WTF is going on here?  Basically, don't set the caret if a menu is open, I think.
      if (!formatSelectionNode.get('id') && !editImageSectionNode.get('id') && !editQuoteSectionNode.get('id')) {
        setCaret(focusNodeId, offset, shouldFocusLastChild);
      }
      if (shouldSaveContentBatch) {
        this.saveContentBatchDebounce();
      }
    });
  }
  
  activeElementHasContent() {
    const cleaned = cleanText(getCaretNode().textContent);
    return cleaned.length > 0;
  }
  
  handleBackspace(evt) {
    if (evt.keyCode !== KEYCODE_BACKSPACE) {
      return;
    }
    const range = getRange();
    if (!range) {
      console.warn('BACKSPACE no range');
      return;
    }
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('BACKSPACE - bad selection, no id ', selectedNode);
      return;
    }
    const selectedNode = getCaretNode();
    const selectedNodeType = getCaretNodeType();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    if (range.startOffset > 0 && cleanText(selectedNodeContent)) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    console.info('BACKSPACE node: ', selectedNode, ' content: ', selectedNodeContent);
    
    evt.stopPropagation();
    evt.preventDefault();
    this.cancelledEvent = evt;
    
    /**
     * TODO: make these into sets of atomic commands that are added to a queue,
     *  then make a 'flush' command to process this queue.
     *  Right now, live updates are happening and it's clobber city
     *
     *  UPDATE: immutablejs has helped make this situation more predictable but,
     *  it still isn't conducive to an undo/redo workflow, so leaving the TODO
     *
     * AN INCOMPLETE LIST OF THINGS TO CONSIDER FOR DELETE (in order, maybe):
     * 1) only-child of first section - noop until there's special 'rootIsEmpty' placeholder logic
     * 2) delete the current selected node - always if 'this far'
     * 3) delete the previous section (if it's a SPACER or other terminal node)?
     * 4) merge the current section's children (could be 0) into previous section (current section will be deleted)
     * 5) merge the current selected node's text into the previous node?
     * 6) selected node is/was an only-child, delete current section
     */
    let focusNodeId;
    let caretOffset;
    switch (selectedNodeType) {
      case NODE_TYPE_P: {
        [focusNodeId, caretOffset] = handleBackspaceParagraph(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_PRE: {
        [focusNodeId, caretOffset] = handleBackspaceCode(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_LI: {
        [focusNodeId, caretOffset] = handleBackspaceList(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_SECTION_H1:
      case NODE_TYPE_SECTION_H2: {
        [focusNodeId, caretOffset] = handleBackspaceTitle(this.documentModel, selectedNodeId);
        break;
      }
    }
    this.commitUpdates(focusNodeId, caretOffset, true);
  }
  
  handleEnter(evt) {
    if (evt.keyCode !== KEYCODE_ENTER) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    this.cancelledEvent = evt;
    
    const range = getRange();
    if (!range) {
      console.warn('ENTER no range');
      return;
    }
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('ENTER - bad selection, no id ', selectedNode);
      return;
    }
    
    const [caretPosition] = getOffsetInParentContent();
    const selectedNode = getCaretNode();
    console.info('ENTER node: ', selectedNode, caretPosition);
    const selectedNodeType = getCaretNodeType();
    // split selectedNodeContent at caret
    const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(selectedNode.textContent);
    let focusNodeId;
    
    switch (selectedNodeType) {
      case NODE_TYPE_PRE: {
        focusNodeId = handleEnterCode(this.documentModel, selectedNodeId, caretPosition, selectedNodeContent);
        break;
      }
      case NODE_TYPE_LI: {
        focusNodeId = handleEnterList(this.documentModel, selectedNodeId, caretPosition, selectedNodeContent);
        break;
      }
      case NODE_TYPE_P: {
        focusNodeId = handleEnterParagraph(this.documentModel, selectedNodeId, caretPosition, selectedNodeContent);
        break;
      }
      case NODE_TYPE_SECTION_H1:
      case NODE_TYPE_SECTION_H2: {
        focusNodeId = handleEnterTitle(this.documentModel, selectedNodeId, caretPosition, selectedNodeContent);
        break;
      }
      default: {
        console.error("Can't handle ENTER!", selectedNodeType);
        return;
      }
    }
    this.commitUpdates(focusNodeId, 0);
  }
  
  handleSyncFromDom(evt) {
    if (
      // cross event type cancellation keyDown -> keyUp, etc
      this.cancelledEvent
      // don't send updates for control keys
      // TODO: this should probably use a diff strategy instead of key detection
      || isControlKey(evt.keyCode)) {
      return;
    }
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.error('DOM SYNC - bad selection, no id ', selectedNode);
      return;
    }
    let selectedNodeMap = this.documentModel.getNode(selectedNodeId);
    const selectedNodeContentDom = cleanText(selectedNode.textContent);
    if (selectedNode.tagName === 'PRE') {
      handleDomSyncCode(this.documentModel, selectedNodeId, selectedNodeContentDom);
      console.info('DOM SYNC PRE ', selectedNode);
      // TODO: refactor to use commitUpdates()
      this.saveContentBatchDebounce();
      return;
    }
    // paragraph has selections?  adjust starts and ends of any that fall on or after the current caret position
    const selectedNodeContentMap = selectedNodeMap.get('content') || '';
    console.log('content JS ', selectedNodeContentMap);
    console.log('content DOM', selectedNodeContentDom);
    const [diffStart, diffLength] = getDiffStartAndLength(selectedNodeContentMap, selectedNodeContentDom);
    // TODO: handle cut/paste
    // TODO: handle select & type or select & delete
    // TODO: 'Del' does it work at the edge of 2 selections?  Probably not.
    if (diffLength === 0) {
      return;
    }
    selectedNodeMap = selectedNodeMap.set('content', selectedNodeContentDom);
    selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, diffStart, diffLength);
    console.log('DOM SYNC diff: ', diffStart, ' diffLen: ', diffLength, 'length: ', selectedNodeContentDom.length);
    this.documentModel.update(selectedNodeMap);
    this.commitUpdates(
      selectedNodeId,
      diffStart + diffLength,
      false,
      this.props.match.params.id !== NEW_POST_URL_ID
    );
  }
  
  /**
   * Move caret for special user input cases
   * @param evt
   */
  handleCaret(evt) {
    if (this.cancelledEvent || evt.isPropagationStopped()) {
      return;
    }
    const domNode = getCaretNode();
    if (domNode && (domNode.tagName === 'PRE'
      // when clicking on a section, the caret will be on an input in the edit image or quote menu, ignore
      || domNode.dataset.isMenu === 'true' /* TODO: why string? */)) {
      // TODO
      return;
    }
    const selectedNodeId = getCaretNodeId(domNode);
    const selectedNodeMap = this.documentModel.getNode(selectedNodeId);
    if (!selectedNodeMap) {
      console.warn('CARET no node, bad selection: ', domNode);
      return;
    }
    if (selectedNodeMap.get('type') === NODE_TYPE_SECTION_SPACER) {
      evt.stopPropagation();
      evt.preventDefault();
      const shouldFocusOnPrevious = evt.keyCode === KEYCODE_UP_ARROW;
      const focusNodeId = shouldFocusOnPrevious
        ? this.documentModel.getPreviousFocusNodeId(selectedNodeId)
        : this.documentModel.getNextFocusNodeId(selectedNodeId);
      setCaret(focusNodeId, -1, shouldFocusOnPrevious);
    } else if (selectedNodeMap.get('type') === NODE_TYPE_ROOT) {
      evt.stopPropagation();
      evt.preventDefault();
      setCaret(this.documentModel.getNextFocusNodeId(selectedNodeId));
    }
  }
  
  handleKeyDown = (evt) => {
    //console.debug('KeyDown code: ', evt.keyCode, 'Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  handleKeyUp = (evt) => {
    //console.debug('KeyUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleSyncFromDom(evt);
    this.handleCaret(evt);
    this.manageInsertMenu(evt);
    this.manageFormatSelectionMenu(evt);
    this.cancelledEvent = null;
  }
  
  handleMouseUp = (evt) => {
    //console.debug('MouseUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleCaret(evt);
    this.manageInsertMenu();
    this.manageFormatSelectionMenu();
    // close edit section menus by default, this.sectionEdit() callback will fire after this to override
    this.sectionEditClose();
  }
  
  handlePaste = (evt) => {
    const selectedNode = getCaretNode();
    if (!selectedNode) {
      return;
    }
    const selectedNodeType = getCaretNodeType(selectedNode);
    const selectedNodeId = getCaretNodeId(selectedNode);
    
    const [caretPosition] = getOffsetInParentContent();
    // split selectedNodeContent at caret
    const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(selectedNode.textContent);
    const domLines = evt.clipboardData.getData('text/plain').split('\n');
    
    evt.stopPropagation();
    evt.preventDefault();
    
    let focusNodeId;
    let focusIdx = selectedNodeContent.length;
    switch (selectedNodeType) {
      case NODE_TYPE_PRE: {
        [
          focusNodeId,
          focusIdx
        ] = handlePasteCode(this.documentModel, selectedNodeId, caretPosition, selectedNodeContent, domLines);
        break;
      }
      default: { /*NOOP*/
      }
    }
    if (focusNodeId) {
      this.commitUpdates(focusNodeId, focusIdx);
    }
  }
  
  manageInsertMenu() {
    const range = getRange();
    const selectedNode = getCaretNode();
    const selectedType = getCaretNodeType(selectedNode);
    
    // save current nodeId because the selection will disappear when the insert menu is shown
    this.insertMenuSelectedNodeId = getCaretNodeId(selectedNode);
    
    if (range && range.collapsed && selectedType === NODE_TYPE_P && !this.activeElementHasContent()) {
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
    const selectedNodeId = this.insertMenuSelectedNodeId;
    let focusNodeId;
    
    // lists get added to content sections, keep current section
    switch (sectionType) {
      case NODE_TYPE_OL: {
        focusNodeId = insertList(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_SECTION_CODE: {
        focusNodeId = insertCodeSection(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_SECTION_SPACER: {
        focusNodeId = insertSpacer(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_SECTION_H1: {
        focusNodeId = insertH1(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_SECTION_H2: {
        focusNodeId = insertH2(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_SECTION_IMAGE: {
        const {
          imageId,
          width,
          height,
        } = await this.uploadFile(firstFile);
        focusNodeId = insertPhoto(
          this.documentModel,
          selectedNodeId,
          Map({
            url: imageId,
            width,
            height,
          }),
        );
        break;
      }
      case NODE_TYPE_SECTION_QUOTE: {
        focusNodeId = insertQuote(this.documentModel, selectedNodeId);
        break;
      }
      default: {
        console.error('insertSection - unknown type! ', sectionType);
      }
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
  
  replaceImageFile = async ([firstFile]) => {
    const { editImageSectionNode } = this.state;
    const {
      imageId,
      width,
      height,
    } = await this.uploadFile(firstFile);
    const updatedImageSectionNode = editImageSectionNode
      .setIn(['meta', 'url'], imageId)
      .setIn(['meta', 'width'], width)
      .setIn(['meta', 'height'], height);
    this.documentModel.update(updatedImageSectionNode);
    await this.commitUpdates();
    this.setState({
      editImageSectionNode: updatedImageSectionNode,
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
  
  // TODO: bug - selection highlighting disappears on user input on format selection menu
  manageFormatSelectionMenu(evt) {
    const range = getRange();
    const isEscKey = evt && evt.keyCode === KEYCODE_ESC;
    const selectedNode = getCaretNode();
    if (!range || range.collapsed || !selectedNode || isEscKey) {
      this.setState({
        formatSelectionNode: Map(),
        formatSelectionModel: Selection(),
        formatSelectionMenuTopOffset: 0,
        formatSelectionMenuLeftOffset: 0,
      })
      return;
    }
    const [startOffset, endOffset] = getOffsetInParentContent();
    console.info('SELECTION: ', startOffset, endOffset, range, range.getBoundingClientRect());
    
    const rect = range.getBoundingClientRect();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeModel = this.documentModel.getNode(selectedNodeId);
    //const
    this.setState({
      formatSelectionNode: selectedNodeModel,
      formatSelectionModel: getSelection(selectedNodeModel, startOffset, endOffset),
      formatSelectionMenuTopOffset: selectedNode.offsetTop,
      formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2,
    });
  }
  
  getLinkUrlForwardedRef = (ref) => {
    if (!ref) return;
    this.inputRef = ref;
    const { formatSelectionModel } = this.state;
    if (formatSelectionModel.get(SELECTION_ACTION_LINK)) {
      ref.focus();
    }
  }
  
  handleSelectionAction = (action) => {
    const {
      formatSelectionModel,
      formatSelectionNode,
    } = this.state;
    const previousActionValue = formatSelectionModel.get(action);
    
    console.info('HANDLE SELECTION ACTION: ', action, formatSelectionModel.toJS());
    
    if ([SELECTION_ACTION_H1, SELECTION_ACTION_H2].includes(action)) {
      const sectionType = action === SELECTION_ACTION_H1 ? NODE_TYPE_SECTION_H1 : NODE_TYPE_SECTION_H2;
      const selectedNodeId = formatSelectionNode.get('id');
      let focusNodeId;
      // list item -> H1 or H2
      if (formatSelectionNode.get('type') === NODE_TYPE_LI) {
        focusNodeId = splitListReplaceListItemWithSection(this.documentModel, selectedNodeId, sectionType);
      } else if (formatSelectionNode.get('type') === NODE_TYPE_P) {
        // paragraph -> H1 or H2
        focusNodeId = paragraphToTitle(this.documentModel, selectedNodeId, sectionType);
      } else if (formatSelectionNode.get('type') === sectionType) {
        // H1 or H2 -> paragraph
        focusNodeId = titleToParagraph(this.documentModel, selectedNodeId);
      } else {
        // H1 -> H2 or H2 -> H1
        focusNodeId = this.documentModel.update(formatSelectionNode.set('type', sectionType));
      }
      
      this.setState({
        formatSelectionNode: Map(),
        formatSelectionModel: Selection(),
      }, async () => {
        await this.commitUpdates(focusNodeId);
      });
      return;
    }
    
    let updatedSelectionModel = formatSelectionModel.set(action, !previousActionValue);
    // selection can be either italic or siteinfo, not both
    if (action === SELECTION_ACTION_ITALIC && updatedSelectionModel.get(SELECTION_ACTION_ITALIC)) {
      updatedSelectionModel = updatedSelectionModel.remove(SELECTION_ACTION_SITEINFO);
    }
    if (action === SELECTION_ACTION_SITEINFO && updatedSelectionModel.get(SELECTION_ACTION_SITEINFO)) {
      updatedSelectionModel = updatedSelectionModel.remove(SELECTION_ACTION_ITALIC);
    }
    // clear URL text if not link anymore
    if (action === SELECTION_ACTION_LINK && !updatedSelectionModel.get(SELECTION_ACTION_LINK)) {
      updatedSelectionModel = updatedSelectionModel.remove(SELECTION_LINK_URL);
    }
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
      if (updatedSelectionModel.get(SELECTION_ACTION_LINK) && this.inputRef) {
        this.inputRef.focus();
      }
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
  
  render() {
    const {
      post,
      root,
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
    
    return (
      <React.Fragment>
        <Header>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">✍ filbert</LogoLinkStyled>
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
        <HeaderSpacer />
        <Article>
          {root && (
            <React.Fragment>
              {shouldShowPublishPostMenu && (<PublishPostForm
                post={post}
                updatePost={this.updatePost}
                publishPost={this.publishPost}
                savePost={this.savePost}
                close={this.togglePostMenu}
                successMessage={shouldShowPostSuccess}
                errorMessage={shouldShowPostError}
              />)}
              <div
                contentEditable={true}
                suppressContentEditableWarning={true}
                onKeyDown={this.handleKeyDown}
                onKeyUp={this.handleKeyUp}
                onMouseUp={this.handleMouseUp}
                onPaste={this.handlePaste}
              >
                <ContentNode post={post} node={root} nodesByParentId={nodesByParentId} isEditing={this.sectionEdit} />
              </div>
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
          )}
        </Article>
        <Footer />
      </React.Fragment>
    )
  }
}
