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
  cleanText,
  cleanTextOrZeroLengthPlaceholder,
  getCanonicalFromTitle,
  imageUrlIsId,
  getCharFromEvent,
} from '../../common/utils';
import {
  getRange,
  getCaretNode,
  getCaretNodeId,
  getCaretNodeType,
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
  SELECTION_LINK_URL,
  POST_ACTION_REDIRECT_TIMEOUT,
} from '../../common/constants';
import { lineHeight } from "../../common/css";

import ContentNode from '../../common/content-node.component';
import EditDocumentModel from './edit-document-model';
import EditUpdateManager from './edit-update-manager';

import {
  handleBackspaceCode,
  handleBackspaceCodeStructuralChange,
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
  handlePasteParagraph,
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

  documentModel = new EditDocumentModel();
  updateManager = new EditUpdateManager();
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
    this.setState({post: Map()});
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
      },() => {
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

  activeElementHasContent() {
    const cleaned = cleanText(getCaretNode().textContent);
    return cleaned.length > 0;
  }

  handleBackspace = async (evt) => {
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
    const [caretPositionStart, _] = getOffsetInParentContent();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    console.info('BACKSPACE node: ', selectedNode, ' content: ', selectedNodeContent);

    evt.stopPropagation();
    evt.preventDefault();

    if (range.startOffset > 0 && selectedNodeContent) {
      //  not at beginning of node text and node text isn't empty
      //  it's just a "normal" backspace, not a 'structural change' backspace
      //
      // NOTE: highlight (diffLength >= 1) could span across nodes and become structural
      const diffLength = Math.max(1, range.endOffset - range.startOffset);
      switch (selectedNode.tagName) {
        case 'PRE': {
          console.debug('BACKSPACE PRE ', selectedNode);
          handleBackspaceCode(this.documentModel, selectedNodeId, caretPositionStart, diffLength);
          break;
        }
        default: {
          let selectedNodeMap = this.documentModel.getNode(selectedNodeId);
          const beforeContentMap = selectedNodeMap.get('content') || '';
          let updatedContentMap;
          if (diffLength === 1) {
            updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart - 1)}${beforeContentMap.slice(caretPositionStart)}`;
          } else {
            // clear the selected format node when deleting the highlighted selection
            // NOTE: must wait for state have been set or setCaret will check stale values
            await new Promise(resolve => {
              this.setState({formatSelectionNode: Map()}, resolve)
            });
            updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart)}${beforeContentMap.slice(caretPositionStart + diffLength)}`;
          }
          selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
          selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, caretPositionStart, -diffLength);
          this.documentModel.update(selectedNodeMap);
        }
      }
      // TODO: This is a hack.  Calling setState here will force all changed nodes to rerender.
      //  The browser will then place the caret at the beginning of the textContent... 😞
      this.commitUpdates(selectedNodeId, diffLength === 1 ? caretPositionStart - 1 : caretPositionStart);
      return;
    }

    /**
     * TODO: make these into sets of atomic commands that are added to a queue,
     *  then make a 'flush' command to process this queue.
     *  Right now, live updates are happening and it's clobber city
     *
     *  UPDATE: immutablejs has helped make this situation more predictable but,
     *  it still isn't conducive to an undo/redo workflow, so leaving the TODO
     *
     *  UPDATE 2: this is a lot more stable after grouping handlers by Node Types.
     *  Splitting out the "DocumentModel" and the "UpdateManager" concerns will help enable undo/redo history.
     *  This will all be revisited during undo/redo.
     *
     * AN INCOMPLETE LIST OF THINGS TO CONSIDER FOR DELETE (in order, maybe):
     * 1) only-child of first "Section" - noop until there's special 'rootIsEmpty' placeholder logic.  If user deletes last paragraph or title "Section", they will be left with a blank screen and can't proceed
     * 2) delete the current selected "Node" - always if 'this far'
     * 3) delete the previous "Section" (if it's a SPACER or other terminal "Node")?
     * 4) merge the current "Section"'s children (could be 0) into previous "Section" (current "Section" will be deleted)
     * 5) merge the current selected "Node"'s text into the previous "Node"?
     * 6) selected "Node" is/was an only-child, delete current "Section"
     */
    let focusNodeId;
    let caretOffset;
    switch (selectedNodeType) {
      case NODE_TYPE_P: {
        [focusNodeId, caretOffset] = handleBackspaceParagraph(this.documentModel, selectedNodeId);
        break;
      }
      case NODE_TYPE_PRE: {
        [focusNodeId, caretOffset] = handleBackspaceCodeStructuralChange(this.documentModel, selectedNodeId);
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
  handleSyncToDom(evt) {
    // don't send updates for control keys
    if (isControlKey(evt.keyCode)
      // stopped by another handler like Backspace or Enter
      || evt.isPropagationStopped()) {
      return;
    }
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('To DOM SYNC - bad selection, no id ', selectedNode);
      return;
    }
    evt.stopPropagation();
    evt.preventDefault();

    // TODO: handle start != end (range is not collapsed)
    const [caretPositionStart, caretPositionEnd]  = getOffsetInParentContent();
    const newChar = getCharFromEvent(evt);
    const diffLength = newChar.length;

    switch (selectedNode.tagName) {
      case 'PRE': {
        console.debug('To DOM SYNC PRE ', selectedNode);
        handleDomSyncCode(this.documentModel, selectedNodeId, newChar, caretPositionStart);
        break;
      }
      default: {
        let selectedNodeMap = this.documentModel.getNode(selectedNodeId);
        const beforeContentMap = selectedNodeMap.get('content') || '';
        const updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart)}${newChar}${beforeContentMap.slice(caretPositionStart)}`;

        console.info('To DOM SYNC diff: ', caretPositionStart, ' diffLen: ', diffLength, 'length: ', updatedContentMap.length);
        selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
        // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
        selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, caretPositionStart, diffLength);
        this.documentModel.update(selectedNodeMap);
      }
    }
    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we place it back with JS
    this.commitUpdates(selectedNodeId, caretPositionStart + diffLength);
  }

  handleSyncFromDom(evt) {
    // Stop all updates to the contenteditable div!
    evt.stopPropagation();
    evt.preventDefault();

    if (evt.type !== 'input') {
      return;
    }

    // NOTE: following for emojis keyboard insert only...
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('From DOM SYNC - bad selection, no id ', selectedNode);
      return;
    }
    const emoji = getCharFromEvent(evt);
    // TODO: handle start != end (range is not collapsed)
    const [caretPositionStart, caretPositionEnd]  = getOffsetInParentContent();
    switch (selectedNode.tagName) {
      case 'PRE': {
        console.debug('From DOM SYNC PRE ', selectedNode);
        handleDomSyncCode(this.documentModel, selectedNodeId, emoji, caretPositionStart - emoji.length);
        break;
      }
      default: {
        let selectedNodeMap = this.documentModel.getNode(selectedNodeId);
        const beforeContentMap = selectedNodeMap.get('content') || '';
        const updatedContentMap = `${beforeContentMap.slice(0, caretPositionStart - emoji.length)}${emoji}${beforeContentMap.slice(caretPositionStart - emoji.length)}`;
        const diffLength = emoji.length;

        console.info('From DOM SYNC diff - this should be an emoji: ', emoji, ' caret start: ', caretPositionStart, ' diffLen: ', diffLength, 'length: ', updatedContentMap.length);
        selectedNodeMap = selectedNodeMap.set('content', updatedContentMap);
        // if paragraph has selections, adjust starts and ends of any that fall on or after the current caret position
        selectedNodeMap = adjustSelectionOffsetsAndCleanup(selectedNodeMap, caretPositionStart, diffLength);
        this.documentModel.update(selectedNodeMap);
      }
    }

    // NOTE: Calling setState (via commitUpdates) here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    this.commitUpdates(selectedNodeId, caretPositionStart);
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
    if (!domNode) return;
    if (domNode.tagName === 'PRE'
      // when clicking on a section, the caret will be on an input in the edit image or quote menu, ignore
      || domNode.dataset.isMenu === 'true' /* TODO: why string? */) {
      // TODO
      return;
    }
    // TODO: clicking on the <article> tag comes back as the header-spacer???
    //  if we're clicking on the document container, focus the end of the last node
    if (domNode.id === 'header-spacer') {
      setCaret(this.documentModel.rootId, -1, true);
      return;
    }
    const selectedNodeId = getCaretNodeId(domNode);
    const selectedNodeMap = this.documentModel.getNode(selectedNodeId);
    if (!selectedNodeMap.get('id')) {
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
  
  // MAIN "ON" EVENT CALLBACKS

  handleKeyDown = (evt) => {
    // any control keys being held down?
    if (evt.metaKey || isControlKey(evt.keyCode)) {
      return;
    }
    //console.debug('KeyDown code: ', evt.keyCode, 'Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleBackspace(evt);
    // TODO this.handleDel(evt); // currently, no support for the 'Del' key
    this.handleEnter(evt);
    this.handleSyncToDom(evt);
  }

  handleKeyUp = (evt) => {
    // any control keys being held down?
    if (evt.metaKey) {
      return;
    }
    //console.debug('KeyUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleSyncFromDom(evt);
    this.handleCaret(evt);
    this.manageInsertMenu(evt);
    this.manageFormatSelectionMenu(evt);
  }

  handleMouseUp = (evt) => {
    //console.debug('MouseUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleCaret(evt);
    this.manageInsertMenu();
    this.manageFormatSelectionMenu(evt);
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

    const [caretPositionStart, _] = getOffsetInParentContent();
    // split selectedNodeContent at caret
    const clipboardText = evt.clipboardData.getData('text/plain');

    evt.stopPropagation();
    evt.preventDefault();

    let focusNodeId;
    let focusIdx = caretPositionStart;
    switch (selectedNodeType) {
      case NODE_TYPE_PRE: {
        [
          focusNodeId,
          focusIdx,
        ] = handlePasteCode(this.documentModel, selectedNodeId, caretPositionStart, clipboardText);
        break;
      }
      case NODE_TYPE_P: {
        [
          focusNodeId,
          focusIdx,
        ] = handlePasteParagraph(this.documentModel, selectedNodeId, caretPositionStart, clipboardText);
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
    // Top Offset (from top of document) - needs a heuristic!
    // start with the top offset of the paragraph
    const paragraphTop = selectedNode.offsetTop;
    // get a percentage of where the start of the selection is relative to the length of the content
    const percentageOfText = (startOffset / selectedNode.textContent.length);
    // take that percentage from height of the paragraph
    const percentageOffset = selectedNode.offsetHeight * percentageOfText;
    // get closest clean division of the height of the selection (this sort of works)

    let offsetByLineHeight = 0;
    while (true) {
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
      await this.commitUpdates(focusNodeId);
      this.setState({
        formatSelectionNode: Map(),
        formatSelectionModel: Selection(),
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
    await this.commitUpdates();
    this.setState({
      formatSelectionNode: updatedNode,
      formatSelectionModel: updatedSelectionModel
    }, () => {
      // TODO: selection highlight will be lost after rendering - create new range and add to window.selection
      if (updatedSelectionModel.get(SELECTION_ACTION_LINK) && this.inputRef) {
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
