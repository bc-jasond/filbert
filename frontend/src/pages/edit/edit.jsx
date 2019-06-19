import React from 'react';
import { Map } from 'immutable';
import { Redirect } from 'react-router-dom';
import EditPipeline from './edit-pipeline';
import {
  apiGet,
  apiPost,
} from '../../common/fetch';
import {
  cleanText,
  hasContent,
} from '../../common/utils';
import {
  getCaretNode,
  getCaretNodeId,
  getCaretNodeType,
  getCaretOffset,
  getFirstHeadingContent,
  setCaret,
} from '../../common/dom';

import {
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  ENTER_KEY,
  BACKSPACE_KEY,
  UP_ARROW,
  NODE_TYPE_SECTION_SPACER,
  ZERO_LENGTH_CHAR,
  NEW_POST_URL_ID,
  ROOT_NODE_PARENT_ID,
} from '../../common/constants';

import ContentNode from '../../common/content-node.component';
import Page404 from '../404';

import {
  InsertSectionMenu,
  InsertSectionMenuButton,
  InsertSectionMenuItemsContainer,
  InsertSectionItem,
} from './edit-styled-components';

export default class EditPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      nodesByParentId: Map(),
      root: null,
      shouldShow404: false,
      shouldRedirectWithId: false,
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false,
      insertMenuTopOffset: 0,
      insertMenuLeftOffset: 0,
    }
  }
  
  async componentDidMount() {
    try {
      const { postId } = this.props;
      if (postId === NEW_POST_URL_ID) {
        this.newPost();
      } else {
        await this.loadPost();
      }
    } catch (err) {
      console.error('EDIT - load post error:', err);
    }
  }
  
  editPipeline = new EditPipeline();
  commitTimeoutId;
  focusNodeId;
  
  saveContentBatch = async () => {
    try {
      const updated = this.editPipeline.updates();
      if (updated.length === 0) return;
      console.info('Save Batch', updated);
      const result = await apiPost('/content', updated);
      this.editPipeline.clearUpdates();
      console.info('Save Batch result', result);
    } catch (err) {
      console.error('Content Batch Update Error: ', err);
    }
  }
  
  saveContentBatchDebounce() {
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 1000);
  }
  
  newPost() {
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.editPipeline.init(postPlaceholder);
    const focusNodeId = this.editPipeline.insertSection(NODE_TYPE_SECTION_H1, 0);
    this.setState({
      root: this.editPipeline.nodesByParentId.get(ROOT_NODE_PARENT_ID).first(),
      nodesByParentId: this.editPipeline.nodesByParentId,
    }, () => {
      setCaret(focusNodeId);
    });
  }
  
  saveNewPost = async () => {
    const title = getFirstHeadingContent();
    // get canonical
    const canonical = title;
    // POST to /post
    const { postId } = await apiPost('/post', { title, canonical });
    // update post id for all updates
    this.editPipeline.addPostIdToUpdates(postId);
    await this.saveContentBatch();
    this.setState({ shouldRedirectWithId: postId })
  }
  
  loadPost = async () => {
    try {
      const { post, contentNodes } = await apiGet(`/edit/${this.props.postId}`);
      this.editPipeline.init(post, contentNodes);
      const focusNodeId = this.editPipeline.getLastChildForCaret(this.editPipeline.root);
      this.setState({
        root: this.editPipeline.root,
        nodesByParentId: this.editPipeline.nodesByParentId,
        shouldShow404: false
      }, () => {
        setCaret(focusNodeId)
        this.manageInsertMenu();
      })
    } catch (err) {
      console.error(err);
      this.setState({ root: null, nodesByParentId: Map(), shouldShow404: true })
    }
  }
  
  commitUpdates = async (offset = -1) => {
    if (this.props.postId === NEW_POST_URL_ID) {
      await this.saveNewPost();
    } else {
      // optimistically save updated nodes - look ma, no errors!
      await this.saveContentBatchDebounce();
    }
    // roll with state changes TODO: handle errors - roll back?
    this.setState({
      nodesByParentId: this.editPipeline.nodesByParentId,
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false
    }, () => {
      setCaret(this.focusNodeId, offset);
      this.manageInsertMenu();
    });
  }
  
  activeElementHasContent() {
    const cleaned = cleanText(getCaretNode().textContent)
    return cleaned.length > 0 && cleaned.charAt(0) !== ZERO_LENGTH_CHAR;
  }
  
  handleBackspace = (evt) => {
    if (evt.keyCode !== BACKSPACE_KEY) {
      return;
    }
    
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeType = getCaretNodeType();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    
    console.info('BACKSPACE node ', selectedNode);
    console.info('BACKSPACE node content ', selectedNodeContent);
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
    if (range.startOffset > 0 && hasContent(selectedNodeContent)) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    const section = this.editPipeline.getSection(selectedNodeId);
    let prevSection = this.editPipeline.getPrevSibling(section.get('id'));
    let caretOffset = -1;
    
    /**
     * THINGS TO CONSIDER FOR DELETE (in order):
     * 1) delete the previous section (if it's a SPACER or other terminal node)?
     * 2) merge the current section's children (could be 0) into previous section AND delete current section
     * 3) merge the current selected node's text into the previous node?
     * 4) ALWAYS delete the current selected node
     */
    
    // #1 - delete previous section (SPACER, etc)
    if (this.editPipeline.isFirstChild(selectedNodeId) && prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
      const spacerId = prevSection.get('id');
      prevSection = this.editPipeline.getPrevSibling(prevSection.get('id'));
      this.editPipeline.delete(spacerId);
    }
    
    // #2 - merge current section's children
    if (this.editPipeline.isFirstChild(selectedNodeId) && prevSection && prevSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
      this.editPipeline.mergeSections(prevSection.get('id'), section.get('id'));
    }
    
    // #3 - merge current node's text into previous sibling
    if (hasContent(selectedNodeContent) && !this.editPipeline.isFirstChild(selectedNodeId)) {
      const prevSibling = this.editPipeline.getPrevSibling(selectedNodeId);
      const prevSiblingText = this.editPipeline.getText(prevSibling.get('id'));
      this.editPipeline.replaceTextNode(prevSibling.get('id'), `${prevSiblingText}${selectedNodeContent}`);
      caretOffset = prevSiblingText.length;
      this.focusNodeId = prevSibling.get('id');
    }
    
    // #4 - always delete current node
    this.editPipeline.delete(selectedNodeId);
    
    this.commitUpdates(caretOffset);
  }
  
  handleEnter = (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeType = getCaretNodeType();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    // split selectedNodeContent at caret
    const contentLeft = selectedNodeContent.substring(0, range.endOffset);
    const contentRight = selectedNodeContent.substring(range.endOffset);
    
    console.info('ENTER node: ', selectedNode);
    console.info('ENTER node content: ', selectedNodeContent);
    console.info('ENTER node content left: ', contentLeft);
    console.info('ENTER node content right: ', contentRight);
    
    /**
     * sync content from selected DOM node to the model
     */
    this.editPipeline.replaceTextNode(selectedNodeId, contentLeft);
    
    /**
     * insert a new element, default to P tag
     */
    if (selectedNodeType === NODE_TYPE_P) {
      const pId = this.editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P);
      this.editPipeline.replaceTextNode(pId, contentRight);
      this.focusNodeId = pId;
    }
    if (selectedNodeType === NODE_TYPE_SECTION_H1) {
      const nextSibling = this.editPipeline.getNextSibling(selectedNodeId);
      let nextSiblingId;
      if (nextSibling && nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
        nextSiblingId = nextSibling.get('id');
      } else {
        // create a ContentSection
        nextSiblingId = this.editPipeline.insertSectionAfter(selectedNodeId, NODE_TYPE_SECTION_CONTENT);
      }
      // add to existing content section
      const pId = this.editPipeline.insert(nextSiblingId, NODE_TYPE_P, 0);
      this.editPipeline.replaceTextNode(pId, contentRight);
      this.focusNodeId = pId;
    }
    this.commitUpdates(0);
  }
  
  handleSyncFromDom = () => {
    if (this.props.postId === NEW_POST_URL_ID) {
      // doesn't work with a 'new' post
      return;
    }
    
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    if (!this.editPipeline.replaceTextNode(selectedNodeId, selectedNodeContent)) {
      return;
    }
    this.focusNodeId = selectedNodeId;
    this.saveContentBatchDebounce()
  }
  
  handleCaret = (evt) => {
    if (evt.isPropagationStopped()) {
      return;
    }
    const selectedNodeId = getCaretNodeId();
    const selectedNode = this.editPipeline.getNode(selectedNodeId);
    console.info('handleCaret - node', getCaretNode());
    if (selectedNode.get('type') === NODE_TYPE_SECTION_SPACER) {
      evt.stopPropagation();
      evt.preventDefault();
      const section = evt.keyCode === UP_ARROW
        ? this.editPipeline.getPrevSibling(selectedNodeId)
        : this.editPipeline.getNextSibling(selectedNodeId);
      const focusNodeId = this.editPipeline.getLastChildForCaret(section);
      setCaret(focusNodeId);
    }
  }
  
  handleKeyDown = (evt) => {
    console.info('KeyDown Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleBackspace(evt);
    this.handleEnter(evt);
    this.handleCaret(evt);
  }
  
  handleKeyUp = (evt) => {
    console.info('KeyUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleSyncFromDom(evt);
    this.handleCaret(evt);
    this.manageInsertMenu();
  }
  
  handleMouseUp = (evt) => {
    console.info('MouseUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleCaret(evt);
    this.manageInsertMenu();
  }
  
  manageInsertMenu() {
    const selectedNode = getCaretNode();
    const selectedType = getCaretNodeType();
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    // save current nodeId because the selection will disappear when the insert menu is shown
    this.insertMenuSelectedNodeId = getCaretNodeId();
    
    if (range.collapsed && selectedType === NODE_TYPE_P && !this.activeElementHasContent()) {
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
        setCaret(this.nodeId);
      }
    });
  }
  
  /**
   * INSERT SECTIONS
   */
  insertSpacer = () => {
    const selectedNodeId = this.insertMenuSelectedNodeId;
    const selectedSectionId = this.editPipeline.getParent(selectedNodeId).get('id');
    // current is last child of section - insert the spacer and a new Content Section + P
    if (this.editPipeline.isLastChild(selectedNodeId)) {
      if (!this.editPipeline.isOnlyChild(selectedNodeId)) {
        this.editPipeline.delete(selectedNodeId);
      }
      const spacerId = this.editPipeline.insertSectionAfter(selectedSectionId, NODE_TYPE_SECTION_SPACER);
      const contentId = this.editPipeline.insertSectionAfter(spacerId, NODE_TYPE_SECTION_CONTENT);
      const pId = this.editPipeline.insert(contentId, NODE_TYPE_P, 0);
      this.focusNodeId = pId
    }
    this.commitUpdates();
  }
  
  render() {
    const {
      root,
      nodesByParentId,
      shouldShow404,
      shouldRedirectWithId,
      shouldShowInsertMenu,
      insertMenuIsOpen,
      insertMenuTopOffset,
      insertMenuLeftOffset,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    if (shouldRedirectWithId) return (<Redirect to={`/edit/${shouldRedirectWithId}`} />);
    
    return !root ? null : (
      <React.Fragment>
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp} onMouseUp={this.handleMouseUp}
             contentEditable={true} suppressContentEditableWarning={true}>
          <ContentNode node={root} nodesByParentId={nodesByParentId} />
        </div>
        <InsertSectionMenu name="insert-section-menu" isOpen={insertMenuIsOpen}
                           shouldShowInsertMenu={shouldShowInsertMenu}
                           insertMenuTopOffset={insertMenuTopOffset}
                           insertMenuLeftOffset={insertMenuLeftOffset}>
          <InsertSectionMenuButton onClick={this.toggleInsertMenu}
                                   isOpen={insertMenuIsOpen} />
          <InsertSectionMenuItemsContainer autocomplete="off" autocorrect="off" autocapitalize="off"
                                           spellcheck="false" isOpen={insertMenuIsOpen}>
            <InsertSectionItem>photo</InsertSectionItem>
            <InsertSectionItem>code</InsertSectionItem>
            <InsertSectionItem>list</InsertSectionItem>
            <InsertSectionItem onClick={this.insertSpacer}>spacer</InsertSectionItem>
            <InsertSectionItem>quote</InsertSectionItem>
            <InsertSectionItem>post link</InsertSectionItem>
          </InsertSectionMenuItemsContainer>
        </InsertSectionMenu>
      </React.Fragment>
    );
  }
}
