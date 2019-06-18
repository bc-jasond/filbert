import React from 'react';
import Immutable, { List, Map } from 'immutable';
import { Redirect } from 'react-router-dom';
import EditPipeline from './edit-pipeline';
import {
  apiGet,
  apiPost,
} from '../../common/fetch';
import {
  cleanText, hasContent,
} from '../../common/utils';
import {
  getCaretNode,
  getCaretNodeId,
  getCaretNodeType, getCaretOffset, getFirstHeadingContent,
  setCaret,
} from '../../common/dom';

import {
  NODE_TYPE_P,
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_TEXT,
  ENTER_KEY,
  BACKSPACE_KEY,
  UP_ARROW,
  DOWN_ARROW,
  LEFT_ARROW,
  RIGHT_ARROW, NODE_TYPE_SECTION_SPACER, ZERO_LENGTH_CHAR, NEW_POST_URL_ID, ROOT_NODE_PARENT_ID,
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
      await this.saveContentBatch();
    }
    // roll with state changes TODO: roll back on save failure?
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
  
    /**
     * not an only child and empty, just a simple remove
      */
    if (!hasContent(selectedNodeContent) && !this.editPipeline.isFirstChild(selectedNodeId)) {
      this.focusNodeId = this.editPipeline.getPrevSibling(selectedNodeId).get('id');
      console.info('BACKSPACE remove empty node - focus node ', this.focusNodeId);
      this.editPipeline.delete(selectedNodeId);
      this.commitUpdates();
      return;
    }
    
    /**
     * merge siblings (P tags only so far)
     */
    if (hasContent(selectedNodeContent) && !this.editPipeline.isFirstChild(selectedNodeId)) {
      const prevSibling = this.editPipeline.getPrevSibling(selectedNodeId);
      const prevSiblingText = this.editPipeline.getText(prevSibling.get('id'));
      this.editPipeline.replaceTextNode(prevSibling.get('id'), `${prevSiblingText}${selectedNodeContent}`);
      this.editPipeline.delete(selectedNodeId);
      this.focusNodeId = prevSibling.get('id');
      this.commitUpdates(prevSiblingText.length);
    }
  }
  
  handleEnter = (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
      return;
    }
    
    evt.stopPropagation();
    evt.preventDefault();
    
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeType = getCaretNodeType();
    const selectedNodeContent = cleanText(selectedNode.textContent);
    
    console.info('ENTER node ', selectedNode);
    console.info('ENTER node content ', selectedNodeContent);
    
    /**
     * sync content from selected DOM node to the model
     */
    this.editPipeline.replaceTextNode(selectedNodeId, selectedNodeContent);
    
    /**
     * insert a new element, default to P tag
     */
    if (selectedNodeType === NODE_TYPE_P) {
      const pId = this.editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P);
      this.editPipeline.replaceTextNode(pId, ZERO_LENGTH_CHAR);
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
      this.editPipeline.replaceTextNode(pId, ZERO_LENGTH_CHAR);
      this.focusNodeId = pId;
    }
    this.commitUpdates();
  }
  
  manageInsertMenu() {
    const selectedNode = getCaretNode();
    const selectedType = getCaretNodeType();
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
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
  
  handleKeyDown = evt => {
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  handleKeyUp = evt => {
    // if (![UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, BACKSPACE_KEY].includes(evt.keyCode)) {
    //   return;
    // }
    console.info('Selected Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.manageInsertMenu();
  }
  
  handleMouseUp = () => {
    console.info('Selected Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.manageInsertMenu();
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
    const {
      root,
      nodesByParentId,
    } = this.state;
    const newSpacerSection = this.getMapWithId({ type: NODE_TYPE_SECTION_SPACER, parent_id: root.get('id') });
    const newContentSection = this.getMapWithId({ type: NODE_TYPE_SECTION_CONTENT, parent_id: root.get('id') });
    const newP = this.getMapWithId({ type: NODE_TYPE_P, parent_id: newContentSection.get('id') });
    // TODO: add placeholder subsection for Content, etc
    const currentSectionIdx = nodesByParentId
      .get(root.get('id'))
      .findIndex(node => node.get('id') === this.parentId);
    // this.current is last child, insert new section after
    if (this.currentIsLastSibling) {
      this.deleteFromParent(this.parentId, null, this.currentIdx);
      this.insertNodeIntoParentList(root.get('id'), newSpacerSection, currentSectionIdx + 1);
      this.insertNodeIntoParentList(root.get('id'), newContentSection, currentSectionIdx + 2);
      this.insertNodeIntoParentList(newContentSection.get('id'), newP);
      this.focusNodeId = newP.get('id');
      this.commitUpdates();
      return;
    }
    // TODO: this.current isn't last child?  Split current section
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
