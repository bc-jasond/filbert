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
} from '../../common/utils';
import {
  getRange,
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
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 250);
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
      const focusNodeId = this.editPipeline.getClosestFocusNodeId(this.editPipeline.rootId, false);
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
  
  commitUpdates = async (focusNodeId, offset = -1) => {
    if (this.props.postId === NEW_POST_URL_ID) {
      await this.saveNewPost();
      return;
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
      setCaret(focusNodeId, offset);
      this.manageInsertMenu();
    });
  }
  
  activeElementHasContent() {
    const cleaned = cleanText(getCaretNode().textContent);
    return cleaned.length > 0;
  }
  
  handleBackspace = (evt) => {
    if (evt.keyCode !== BACKSPACE_KEY) {
      return;
    }
    
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    
    console.info('BACKSPACE node: ', selectedNode, ' content: ', selectedNodeContent);
    
    const range = getRange();
    if (!range) {
      console.warn('BACKSPACE no range');
      return;
    }
    
    if (range.startOffset > 0 && cleanText(selectedNodeContent)) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    const selectedSectionId = this.editPipeline.getSection(selectedNodeId).get('id');
    const prevSection = this.editPipeline.getPrevSibling(selectedSectionId);
    
    let caretOffset = -1;
    
    /**
     * THINGS TO CONSIDER FOR DELETE (in order):
     * 1) only-child of first section - noop!
     * 2) only-child, delete current section
     * 3) delete the previous section (if it's a SPACER or other terminal node)?
     * 4) merge the current section's children (could be 0) into previous section AND delete current section
     * 5) merge the current selected node's text into the previous node?
     * 6) delete the current selected node?
     */
    
    // only child of first section
    if (this.editPipeline.isOnlyChild(selectedNodeId) && !prevSection) {
      return;
    }
  
    let focusNodeId = this.editPipeline.getClosestFocusNodeId(selectedNodeId);
    // save these locally before updates
    const isOnlyChild = this.editPipeline.isOnlyChild(selectedNodeId);
    const isFirstChild = this.editPipeline.isFirstChild(selectedNodeId);
    const prevSibling = this.editPipeline.getPrevSibling(selectedNodeId);
    // delete current node
    this.editPipeline.delete(selectedNodeId);
    
    // delete previous section (SPACER, etc)
    if (isFirstChild && prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
      const spacerId = prevSection.get('id');
      focusNodeId = this.editPipeline.getClosestFocusNodeId(prevSection.get('id'));
      this.editPipeline.delete(spacerId);
    }
    
    // merge current section's children
    if (isFirstChild && prevSection && prevSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
      this.editPipeline.mergeSections(prevSection.get('id'), selectedSectionId);
      focusNodeId = this.editPipeline.getClosestFocusNodeId(prevSection.get('id'));
    }
    
    // merge current node's text into previous sibling
    if (cleanText(selectedNodeContent) && !isFirstChild) {
      const prevSiblingText = this.editPipeline.getText(prevSibling.get('id'));
      this.editPipeline.replaceTextNode(prevSibling.get('id'), `${prevSiblingText}${selectedNodeContent}`);
      caretOffset = prevSiblingText.length;
      focusNodeId = prevSibling.get('id');
    }
    
    // delete section?
    if (isOnlyChild) {
      this.editPipeline.delete(selectedSectionId);
    }
    
    this.commitUpdates(focusNodeId, caretOffset);
  }
  
  handleEnter = (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    const range = getRange();
    if (!range) {
      console.warn('ENTER no range');
      return;
    }
    
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
    
    let focusNodeId;
    
    /**
     * sync content from selected DOM node to the model
     */
    this.editPipeline.replaceTextNode(selectedNodeId, contentLeft);
    
    /**
     * insert a new P after the current one
     */
    if (selectedNodeType === NODE_TYPE_P) {
      const pId = this.editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P);
      this.editPipeline.replaceTextNode(pId, contentRight);
      focusNodeId = pId;
    }
    /**
     * insert a new Content Section and a P tag
     */
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
      focusNodeId = pId;
    }
    this.commitUpdates(focusNodeId,0);
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
    console.info('handleSyncFromDom', selectedNode);
    this.saveContentBatchDebounce()
  }
  
  handleCaret = (evt) => {
    if (evt.isPropagationStopped()) {
      return;
    }
    const selectedNodeId = getCaretNodeId();
    const selectedNode = this.editPipeline.getNode(selectedNodeId);
    if (!selectedNode) {
      console.warn('handleCaret no node, bad selection: ', getCaretNode());
      return;
    }
    console.info('handleCaret - node', getCaretNode());
    if (selectedNode.get('type') === NODE_TYPE_SECTION_SPACER) {
      evt.stopPropagation();
      evt.preventDefault();
      const shouldFocusOnPrevious = evt.keyCode === UP_ARROW;
      const focusNodeId = this.editPipeline.getClosestFocusNodeId(selectedNodeId, shouldFocusOnPrevious);
      setCaret(focusNodeId);
    }
  }
  
  handleKeyDown = (evt) => {
    console.debug('KeyDown Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleBackspace(evt);
    this.handleEnter(evt);
    // this.handleCaret(evt);
  }
  
  handleKeyUp = (evt) => {
    console.debug('KeyUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleSyncFromDom(evt);
    this.handleCaret(evt);
    this.manageInsertMenu();
  }
  
  handleMouseUp = (evt) => {
    console.debug('MouseUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleCaret(evt);
    this.manageInsertMenu();
  }
  
  manageInsertMenu() {
    const selectedNode = getCaretNode();
    const selectedType = getCaretNodeType();
    const range = getRange();
    if (!range) {
      return;
    }
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
    // splitting the current section even if selectedNodeId is first or last child
    this.editPipeline.splitSection(selectedSectionId, selectedNodeId);
    // insert the spacer
    const spacerId = this.editPipeline.insertSectionAfter(selectedSectionId, NODE_TYPE_SECTION_SPACER);
    const focusNodeId = this.editPipeline.getClosestFocusNodeId(spacerId, false);
    this.commitUpdates(focusNodeId);
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
    
    return root && (
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
