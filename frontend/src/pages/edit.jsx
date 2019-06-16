import Immutable from 'immutable';
import React from 'react';
import { List, Map } from 'immutable';
import styled from 'styled-components';
import { css } from 'styled-components';
import { grey } from '../common/css';
import {
  apiGet,
  apiPost,
} from '../common/fetch';
import { HeaderButtonMixin } from '../common/layout-styled-components';
import {
  getMapWithId,
  cleanText,
} from '../common/utils';
import {
  getCaretNode,
  setCaret,
} from '../common/dom';

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
  RIGHT_ARROW, NODE_TYPE_SECTION_SPACER, ZERO_LENGTH_CHAR,
} from '../common/constants';

import ContentNode from '../common/content-node.component';
import Page404 from './404';

const InsertSectionMenu = styled.div`
  position: absolute;
  overflow: hidden;
  height: 56px;
  width: ${p => p.isOpen ? '640' : '50'}px;
  display: ${p => p.shouldShowInsertMenu ? 'block' : 'none'};
  top: ${p => p.insertMenuTopOffset - 13}px;
  left: ${p => p.insertMenuLeftOffset - 68}px;
`;
const lineMixin = css`
  z-index: 2;
  position: absolute;
  display: block;
  content: '';
  height: 2px;
  width: 20px;
  background-color: ${grey};
  transition: transform .2s ease-in-out;
`;
const InsertSectionMenuButton = styled.button`
  position: absolute;
  top: 18px;
  z-index: 3;
  width: 24px;
  height: 24px;
  display: block;
  cursor: pointer;
  border: 0;
  outline: 0;
  &:before {
    ${lineMixin}
    transform: rotateZ(0deg);
    ${p => p.isOpen && `
      transform: rotateZ(225deg);
    `}
  }
  &:after {
    ${lineMixin}
    transform: rotateZ(90deg);
    ${p => p.isOpen && `
      transform: rotateZ(-45deg);
    `}
  }
`;
const InsertSectionMenuItemsContainer = styled.div`
  position: absolute;
  top: 18px;
  height: 24px;
  left: 48px;
  display: block;
  transition: left .2s ease-in-out, display .2 ease-in-out;
  ${p => !p.isOpen && `
    left: -100%;
    display: none;
    transition: none;
  `}
`;
const InsertSectionItem = styled.span`
  ${HeaderButtonMixin};
`;

export default class EditPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      allNodesByParentId: Map(),
      root: null,
      shouldShow404: false,
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false,
      insertMenuTopOffset: 0,
      insertMenuLeftOffset: 0,
    }
  }
  
  async componentDidMount() {
    try {
      await this.loadPost();
    } catch (err) {
      console.error('EDIT - load post error:', err);
    }
  }
  
  allNodesByParentIdStaging = Map();
  updatedNodes = {}; // TODO: add a debounced save timer per element
  focusNodeId;
  
  allNodes() {
    return this.allNodesByParentIdStaging.size > 0 ? this.allNodesByParentIdStaging : this.state.allNodesByParentId;
  }
  
  /**
   * get content from textNode child
   */
  getContent(parentId) {
    const { allNodesByParentId } = this.state;
    // TODO: DFS through nodes until a NODE_TYPE_TEXT is reached
    return allNodesByParentId.get(parentId).get(0).get('content');
  }
  
  getMapWithId(obj) {
    return getMapWithId(obj).set('post_id', this.props.postId);
  }
  
  saveContentBatch = async () => {
    try {
      const updated = Object.values(this.updatedNodes);
      if (updated.length === 0) return;
      const result = await apiPost('/content', updated);
      this.updatedNodes = {};
      console.info('Save Batch', result);
    } catch (err) {
      console.error('Content Batch Update Error: ', err);
    }
  }
  
  loadPost = async () => {
    try {
      const { post, contentNodes } = await apiGet(`/edit/${this.props.postId}`);
      const allNodesByParentId = Immutable.fromJS(contentNodes);
      // TODO: don't use 'null' as root node indicator
      const root = allNodesByParentId.get('null').get(0);
      // TODO: write a 'getFirstNode' method
      this.focusLastChild(allNodesByParentId.get(root.get('id')));
      this.setState({ root, allNodesByParentId, shouldShow404: false }, () => {
        setCaret(this.focusNodeId)
      })
    } catch (err) {
      console.error(err);
      this.setState({ root: null, allNodesByParentId: Map(), shouldShow404: true })
    }
  }
  
  focusLastChild(children) {
    let currentLast = children.last().get('id');
    while (this.allNodes().get(currentLast, List()).size > 0) {
      if (this.getNode(currentLast).get('type') === NODE_TYPE_P) break;
      currentLast = this.allNodes().get(currentLast).last().get('id')
    }
    this.focusNodeId = currentLast;
  }
  
  commitUpdates(placeCaretAtBeginning = false) {
    if (this.allNodesByParentIdStaging.size === 0) {
      return;
    }
    // optimistically save updated nodes
    this.saveContentBatch();
    // roll with state changes TODO: roll back on save failure?
    this.setState({
      allNodesByParentId: this.allNodesByParentIdStaging,
      shouldShowInsertMenu: false,
      insertMenuIsOpen: false
    }, () => {
      setCaret(this.focusNodeId, placeCaretAtBeginning);
      this.allNodesByParentIdStaging = Map();
      this.manageInsertMenu();
    })
  }
  
  getNode(nodeId) {
    const { root } = this.state;
    if (root.get('id') === nodeId) return root;
    
    const queue = [this.state.root.get('id')]
    while (queue.length) {
      const currentList = this.allNodes().get(queue.shift(), List());
      const node = currentList.find(node => node.get('id') === nodeId);
      if (node) {
        return node;
      }
      currentList.forEach(n => {
        queue.push(n.get('id'));
      })
    }
    return null;
  }
  
  getParent(nodeId) {
    const queue = [this.state.root.get('id')]
    while (queue.length) {
      const parentId = queue.shift();
      const currentList = this.allNodes().get(parentId, List());
      const node = currentList.find(node => node.get('id') === nodeId);
      if (node) {
        return this.getNode(parentId);
      }
      currentList.forEach(n => {
        queue.push(n.get('id'));
      })
    }
    return null;
  }
  getNextSibling(nodeId) {}
  getPrevSibling(nodeId) {}
  isFirstChild(nodeId) {}
  isLastChild(nodeId) {}
  
  deleteFromParent(parentId, node = null, idx = -1, shouldRecurse = true) {
    let shouldUpdateFocusNodeId = false;
    let children = this.allNodes().get(parentId, List());
    if (node === null && idx === -1) {
      throw new Error('deleteFromParent - must provide either a node or an index');
    }
    if (idx === -1) {
      // delete a node at idx
      // TODO: is this the last child of `parentId` ?  Then remove parent from it's parent list?
      idx = children.findIndex(n => n.get('id') === node.get('id'))
    }
    // find node and delete it from children
    const deletedNode = children.get(idx)
    if (!deletedNode) {
      throw new Error('deleteFromParent - node not found!');
    }
    this.updatedNodes[deletedNode.get('id')] = { action: 'delete', node: deletedNode };
    children = children.delete(idx);
    if (shouldRecurse) {
      // keep deleting empty parent sections
      while (children.size === 0) {
        // delete the parent list
        this.allNodesByParentIdStaging = this.allNodes().delete(parentId)
        // delete the parent from it's parent
        children = this.allNodes().get(this.getParent(parentId).get('id'))
        idx = children.findIndex(n => n.get('id') === parentId);
        const deletedNode = children.get(idx);
        this.updatedNodes[deletedNode.get('id')] = { action: 'delete', node: deletedNode };
        children = children.delete(idx)
        parentId = this.getParent(parentId).get('id');
      }
      // delete section before?
      if (idx > 0) {
        shouldUpdateFocusNodeId = true;
        const prevSection = children.get(idx - 1);
        if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
          this.updatedNodes[prevSection.get('id')] = { action: 'delete', node: prevSection };
          children = children.delete(idx - 1);
        }
      }
      if (shouldUpdateFocusNodeId) {
        this.focusLastChild(children);
      }
    }
    // reindex 'position' for all children, also set postId TODO: clean this up
    children = children.map((child, idx) => child.set('position', idx).set('post_id', this.props.postId));
    this.allNodesByParentIdStaging = this.allNodes().set(parentId, children);
  }
  
  updateNodeInPlace(parentId, node) {
    let children = this.allNodes().get(parentId, List());
    const idx = children.find(n => n.get('id') === node.get('id'));
    // replace at index
    children = children.set(idx, node);
    this.updatedNodes[node.get('id')] = {
      action: 'update',
      node,
    };
    this.allNodesByParentIdStaging = this.allNodes().set(parentId, children);
  }
  
  insertNodeIntoParentList(parentId, node, idx = -1) {
    let children = this.allNodes().get(parentId, List());
    node = node.set('parent_id', parentId);
    if (idx === -1) {
      // push to end
      node = node.set('position', children.size);
      children = children.push(node);
    } else {
      // insert at index
      node = node.set('position', idx)
      children = children.insert(idx, node);
    }
    this.updatedNodes[node.get('id')] = {
      action: 'update',
      node,
    };
    // reindex 'position' for all children, set postId TODO: clean this up
    children = children.map((child, idx) => child.set('position', idx).set('post_id', this.props.postId));
    this.allNodesByParentIdStaging = this.allNodes().set(parentId, children);
  }
  
  activeElementHasContent() {
    const cleaned = cleanText(this.activeElement.textContent)
    return cleaned.length > 0 && cleaned.charAt(0) !== ZERO_LENGTH_CHAR;
  }
  
  /**
   * update/sync current model and DOM
   */
  // TODO: fix this - assuming that there's only one child and it's a text node
  updateElementContent(nodeId) {
    let textNode = this.allNodes()
      .get(nodeId, List([
        this.getMapWithId({
          type: NODE_TYPE_TEXT,
          parent_id: nodeId,
          position: 0
        })
      ]))
      .first();
    textNode = textNode.set('content', cleanText(this.activeElement.textContent));
    this.deleteFromParent(nodeId, null, 0, false)
    this.insertNodeIntoParentList(nodeId, textNode)
  }
  
  resetDomAndModelReferences() {
    /**
     * DOM refs
     */
    this.activeElement = getCaretNode();
    this.nodeId = this.activeElement.getAttribute('name');
    this.activeType = this.activeElement.dataset.type;
    this.activeParent = this.activeElement.parentElement;
    this.parentId = this.activeParent.getAttribute('name');
    this.parentType = this.activeParent.dataset.type;
    /**
     * MODEL refs
     */
    this.siblings = this.allNodes()
      .get(this.parentId, List());
    this.current = this.siblings
      .find(node => node.get('id') === this.nodeId);
    this.currentIdx = this.siblings.indexOf(this.current);
    this.currentIsLastSibling = this.currentIdx === this.siblings.size - 1;
    this.prevSibling = this.siblings.get(this.currentIdx - 1);
  }
  
  handleBackspace = (evt) => {
    if (evt.keyCode !== BACKSPACE_KEY) {
      return;
    }
    
    const {
      root,
      allNodesByParentId
    } = this.state;
    
    this.resetDomAndModelReferences();
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
    if (range.startOffset > 0 && this.activeElementHasContent()) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    evt.stopPropagation();
    evt.preventDefault();
    
    if (!this.activeElementHasContent()) {
      this.focusNodeId = this.prevSibling.get('id');
      // current element (P tag) is 'empty'
      this.deleteFromParent(this.parentId, this.current);
      this.commitUpdates();
      return;
    }
    
    /**
     * first child of root (h1)?
     */
    if (this.parentType === NODE_TYPE_ROOT) {
      return;
    }

    /**
     * first child of first ContentSection of root? -> noop()
     */
    if (this.parentType === NODE_TYPE_SECTION_CONTENT) {
      const isFirstRootChild = allNodesByParentId.get(root.get('id'))
        .findIndex(node => node.get('id') === this.parentId) === 0;
      if (isFirstRootChild) {
        return;
      }
    }
    
    /**
     * only child of Section? --> delete current section (and previous section if it's 'special')
     */
    if (this.currentIdx === 0 && this.siblings.size === 1) {
      
      return;
    }
  
    /**
     * first child of section - merge, if previous section
     */
    if (this.currentIdx === 0) {
      // TODO - merge sections
      return;
    }
    
    /**
     * merge sibling (P tags only so far)
     */
    if (this.activeElementHasContent()) {
      const prevSiblingLastChild = allNodesByParentId
        .get(this.prevSibling.get('id'))
        .last();
      const currentFirstChild = allNodesByParentId
        .get(this.current.get('id'), List([Map({ type: NODE_TYPE_TEXT, content: this.activeElement.textContent })]))
        .first();
      // merged text node
      const mergedSiblingLastChild = prevSiblingLastChild.set('content', cleanText(`${prevSiblingLastChild.get('content')}${currentFirstChild.get('content')}`));
      // replace original text node
      this.updateNodeInPlace(this.prevSibling.get('id'), mergedSiblingLastChild);
      // remove 'deleted' P tag
      this.deleteFromParent(this.parentId, null, this.currentIdx, false);
      this.focusNodeId = this.prevSibling.get('id');
      this.commitUpdates();
    }
  }
  
  handleEnter = (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
      return;
    }
    
    const {
      root,
    } = this.state;
    
    evt.stopPropagation();
    evt.preventDefault();
    
    this.resetDomAndModelReferences();
    
    this.updateElementContent(this.current.get('id'));
    
    /**
     * insert a new element, default to P tag
     */
    const p = this.getMapWithId({ type: NODE_TYPE_P });
    this.focusNodeId = p.get('id');
    if (this.activeType === NODE_TYPE_P) {
      this.insertNodeIntoParentList(this.parentId, p, this.currentIdx + 1);
      this.commitUpdates();
      return;
    }
    if (this.activeType === NODE_TYPE_SECTION_H1) {
      const nextSibling = this.siblings.get(this.currentIdx + 1, null);
      if (!nextSibling) {
        // create a ContentSection
        const content = this.getMapWithId({ type: NODE_TYPE_SECTION_CONTENT });
        this.insertNodeIntoParentList(content.get('id'), p, 0);
        this.insertNodeIntoParentList(root.get('id'), content);
      } else {
        // update existing ContentSection
        this.insertNodeIntoParentList(nextSibling.get('id'), p, 0);
      }
      this.commitUpdates();
      return;
    }
  }
  
  manageInsertMenu() {
    this.resetDomAndModelReferences();
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
    if (range.collapsed && this.activeType === NODE_TYPE_P && !this.activeElementHasContent()) {
      this.setState({
        shouldShowInsertMenu: true,
        insertMenuTopOffset: this.activeElement.offsetTop,
        insertMenuLeftOffset: this.activeElement.offsetLeft,
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
    if (![UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(evt.keyCode)) {
      return;
    }
    this.manageInsertMenu();
  }
  
  handleMouseUp = () => {
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
      allNodesByParentId,
    } = this.state;
    const newSpacerSection = this.getMapWithId({ type: NODE_TYPE_SECTION_SPACER, parent_id: root.get('id') });
    const newContentSection = this.getMapWithId({ type: NODE_TYPE_SECTION_CONTENT, parent_id: root.get('id') });
    const newP = this.getMapWithId({ type: NODE_TYPE_P, parent_id: newContentSection.get('id')});
    // TODO: add placeholder subsection for Content, etc
    const currentSectionIdx = allNodesByParentId
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
      allNodesByParentId,
      shouldShow404,
      shouldShowInsertMenu,
      insertMenuIsOpen,
      insertMenuTopOffset,
      insertMenuLeftOffset,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    
    return !root ? null : (
      <React.Fragment>
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp} onMouseUp={this.handleMouseUp}
             contentEditable={true} suppressContentEditableWarning={true}>
          <ContentNode node={root} allNodesByParentId={allNodesByParentId} />
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
