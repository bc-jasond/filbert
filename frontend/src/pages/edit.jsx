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
  RIGHT_ARROW,
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
  width: 24px;
  background-color: ${grey};
  transition: transform .2s ease-in-out;
`;
const InsertSectionMenuButton = styled.button`
  position: absolute;
  top: 16px;
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
  top: 16px;
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
      console.log('EDIT - load post error:', err);
    }
  }
  
  allNodesByParentIdStaging = Map();
  updatedNodes = {}; // TODO: add a debounced save timer per element
  
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
      console.log('Content Batch Update Error: ', err);
    }
  }
  
  loadPost = async () => {
    try {
      const { post, contentNodes } = await apiGet(`/edit/${this.props.postId}`);
      const allNodesByParentId = Immutable.fromJS(contentNodes);
      // TODO: don't use 'null' as root node indicator
      const root = allNodesByParentId.get('null').get(0);
      // TODO: write a 'getFirstNode' method
      const firstNode = allNodesByParentId.get(root.get('id')).get(0);
      this.setState({ root, allNodesByParentId, shouldShow404: false }, () => {
        setCaret(firstNode.get('id'), true)
      })
    } catch (err) {
      console.log(err);
      this.setState({ root: null, allNodesByParentId: Map(), shouldShow404: true })
    }
  }
  
  commitUpdates(focusElementId, placeCaretAtBeginning = false) {
    if (this.allNodesByParentIdStaging.size === 0) {
      return;
    }
    // optimistically save updated nodes
    this.saveContentBatch();
    // roll with state changes TODO: roll back on save failure?
    this.setState({ allNodesByParentId: this.allNodesByParentIdStaging }, () => {
      setCaret(focusElementId, placeCaretAtBeginning);
      this.allNodesByParentIdStaging = Map();
    })
  }
  
  updateParentList(parentId, node = null, idx = -1) {
    const allNodesByParentId = this.allNodesByParentIdStaging.size > 0 ? this.allNodesByParentIdStaging : this.state.allNodesByParentId;
    let children = allNodesByParentId.get(parentId, List());
    if (node === null && idx === -1) {
      throw new Error('updateParentList - must provide either a node or an index');
    }
    if (node === null) {
      // delete a node at idx
      // TODO: is this the last child of `parentId` ?  Then remove parent from it's parent list?
      const deletedNode = children.get(idx);
      this.updatedNodes[deletedNode.get('id')] = { action: 'delete', node: deletedNode };
      children = children.delete(idx)
    } else if (idx === -1) {
      // push to end of list
      this.updatedNodes[node.get('id')] = {
        action: 'update',
        node: node.set('parent_id', parentId).set('position', children.size)
      };
      children = children.push(node);
    } else {
      // insert at index
      this.updatedNodes[node.get('id')] = {
        action: 'update',
        node: node.set('parent_id', parentId).set('position', idx)
      };
      children = children.insert(idx, node);
    }
    // reindex 'position' for all children, set postId TODO: clean this up
    children = children.map((child, idx) => child.set('position', idx).set('post_id', this.props.postId));
    this.allNodesByParentIdStaging = allNodesByParentId.set(parentId, children);
  }
  
  activeElementHasContent() {
    return cleanText(this.activeElement.textContent).length > 0;
  }
  
  /**
   * update/sync current model and DOM
   */
  updateActiveElement() {
    const { allNodesByParentId } = this.state;
    // TODO: fix this - assuming that there's only one child and it's a text node
    const textNode = allNodesByParentId
      .get(this.current.get('id'), List([
        this.getMapWithId({
          type: NODE_TYPE_TEXT,
          parent_id: this.current.get('id'),
          position: 0
        })
      ]))
      .first();
    this.updateParentList(this.current.get('id'), textNode.set('content', cleanText(this.activeElement.textContent)));
    // if there was existing content, clear the DOM to avoid duplication
    if (textNode.get('content', '').length > 0) {
      this.activeElement.textContent = '';
    }
  }
  
  resetDomAndModelReferences() {
    const { allNodesByParentId } = this.state;
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
    this.siblings = allNodesByParentId
      .get(this.parentId, List());
    this.current = this.siblings
      .find(node => node.get('id') === this.nodeId);
    this.currentIdx = this.siblings.indexOf(this.current);
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
      // current element (P tag) is 'empty', just remove it
      this.updateParentList(this.parentId, null, this.currentIdx);
      this.commitUpdates(this.prevSibling.get('id'));
      return;
    }
    
    /**
     * first child of root (h1)? OR first child of first ContentSection of root? -> noop()
     */
    if (this.parentType === NODE_TYPE_ROOT) {
      return;
    }
    if (this.parentType === NODE_TYPE_SECTION_CONTENT) {
      const isFirstRootChild = allNodesByParentId.get(root.get('id'))
        .findIndex(node => node.get('id') === this.parentType) === 0;
      if (isFirstRootChild) {
        return;
      }
    }
    
    /**
     * first child of Section?
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
      // remove original text node
      this.updateParentList(this.prevSibling.get('id'), null, 0);
      // add merged text node to P tag
      this.updateParentList(this.prevSibling.get('id'), mergedSiblingLastChild);
      // remove 'deleted' P tag
      this.updateParentList(this.parentId, null, this.currentIdx);
      this.commitUpdates(this.prevSibling.get('id'));
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
    
    this.updateActiveElement();
    
    /**
     * insert a new element, default to P tag
     */
    const p = this.getMapWithId({ type: NODE_TYPE_P });
    if (this.activeType === NODE_TYPE_P) {
      this.updateParentList(this.parentId, p, this.currentIdx + 1);
      this.commitUpdates(p.get('id'));
      return;
    }
    if (this.activeType === NODE_TYPE_SECTION_H1) {
      const nextSibling = this.siblings.get(this.currentIdx + 1, null);
      if (!nextSibling) {
        // create a ContentSection
        const content = this.getMapWithId({ type: NODE_TYPE_SECTION_CONTENT });
        this.updateParentList(content.get('id'), p, 0);
        this.updateParentList(root.get('id'), content);
      } else {
        // update existing ContentSection
        this.updateParentList(nextSibling.get('id'), p, 0);
      }
      this.commitUpdates(p.get('id'));
      return;
    }
  }
  
  handleInsertMenu = (evt) => {
    if (evt.type !== 'mouseup'
      && (![UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].includes(evt.keyCode))) {
      return;
    }
    
    this.resetDomAndModelReferences();
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
    if (range.collapsed && !this.activeElementHasContent()) {
      this.setState({
        shouldShowInsertMenu: true,
        insertMenuTopOffset: this.activeElement.offsetTop,
        insertMenuLeftOffset: this.activeElement.offsetLeft,
      });
      return;
    }
    
    this.setState({ shouldShowInsertMenu: false });
  }
  
  handleKeyDown = evt => {
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  handleKeyUp = evt => {
    this.handleInsertMenu(evt);
  }
  
  handleMouseUp = evt => {
    this.handleInsertMenu(evt);
  }
  
  toggleInsertMenu = () => {
    const { insertMenuIsOpen } = this.state;
    this.setState({ insertMenuIsOpen: !insertMenuIsOpen }, () => {
      if (insertMenuIsOpen) {
        setCaret(this.nodeId);
      }
    });
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
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp} onMouseUp={this.handleMouseUp} contentEditable={true}>
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
            <InsertSectionItem>spacer</InsertSectionItem>
            <InsertSectionItem>quote</InsertSectionItem>
            <InsertSectionItem>post link</InsertSectionItem>
          </InsertSectionMenuItemsContainer>
        </InsertSectionMenu>
      </React.Fragment>
    );
  }
}
