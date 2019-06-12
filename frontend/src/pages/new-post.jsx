import React from 'react';
import { Redirect } from 'react-router-dom';
import { List, Map } from 'immutable';
import {
  apiPost,
} from '../common/fetch';
import {
  getMapWithId,
  cleanText,
} from '../common/utils';
import {
  getCaretNode,
  setCaret,
} from '../common/dom';

import {
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_TEXT,
  NODE_TYPE_P,
  ENTER_KEY,
  BACKSPACE_KEY,
} from '../common/constants';

import ContentNode from '../common/content-node.component';

export default class NewPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      postId: null,
      root: null,
      allNodesByParentId: Map(),
      shouldRedirectWithId: false,
    }
  }
  
  async componentDidMount() {
    const { allNodesByParentId } = this.state;
    const root = getMapWithId({ type: NODE_TYPE_ROOT });
    const h1 = getMapWithId({ type: NODE_TYPE_SECTION_H1, parent_id: root.get('id') });
    this.setState({
      root,
      allNodesByParentId: allNodesByParentId
        .set('null', List([root]))
        .set(root.get('id'), List([h1]))
    }, () => {
      setCaret(h1.get('id'), true)
    })
  }
  
  history = [];
  updatedNodes = {}; // TODO: add a debounced save timer per element
  
  /**
   * get content from textNode child
   */
  getContent(parentId) {
    const { allNodesByParentId } = this.state;
    // TODO: DFS through nodes until a NODE_TYPE_TEXT is reached
    return allNodesByParentId.get(parentId).get(0).get('content');
  }
  
  saveNewPost = async () => {
    const {
      root,
      allNodesByParentId
    } = this.state;
    // get title from H1
    // TODO: might not be first child...
    const headingId = allNodesByParentId.get(root.get('id')).get(0).get('id');
    const title = this.getContent(headingId);
    // get canonical
    const canonical = title;
    // POST to /post
    const { postId } = await apiPost('/post', { title, canonical });
    // forEach allNodesByParentId, update postId, position - add to updatedNodes batch list
    Object.entries(allNodesByParentId.toJS()).forEach(([parentId, children]) => {
      children.forEach((childNode, idx) => {
        childNode.post_id = postId;
        childNode.position = idx;
        childNode.meta = {};
        childNode.content = childNode.content || null;
        childNode.parent_id = parentId === 'null' ? null : parentId;
        // add updated nodes keyed off of 'id' to the update list
        this.updatedNodes[childNode.id] = { action: 'update', node: childNode };
      })
    })
    await this.saveContentBatch();
    this.setState({ postId, shouldRedirectWithId: true })
  }
  
  saveContentBatch = async () => {
    try {
      const result = await apiPost('/content', Object.values(this.updatedNodes))
      this.updatedNodes = {};
      console.info('Save Batch', result);
    } catch (err) {
      console.log('Content Batch Update Error: ', err);
    }
  }
  
  commitUpdates() {
    if (!this.history.length) {
      return;
    }
    this.setState({ allNodesByParentId: this.history.pop() }, () => {
      this.history = [];
      // create a new post and redirect
      this.saveNewPost();
    })
  }
  
  updateParentList(parentId, node = null, idx = -1) {
    const allNodesByParentId = this.history.pop() || this.state.allNodesByParentId;
    const children = allNodesByParentId.get(parentId, List());
    if (node === null && idx === -1) {
      throw new Error('updateParentList - must provide either a node or an index');
    }
    if (node === null) {
      // delete a node at idx
      // TODO: is this the last child of `parentId` ?  Then remove parent from it's parent list
      // TODO: reindex 'position' for all children
      this.history.push(allNodesByParentId.set(parentId, children.delete(idx)))
      return;
    }
    if (idx === -1) {
      // push to end of list
      this.history.push(allNodesByParentId.set(parentId, children.push(node)))
      return
    }
    this.history.push(allNodesByParentId.set(parentId, children.insert(idx, node)));
    // TODO: reindex 'position'
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
        getMapWithId({
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
    
    this.resetDomAndModelReferences();
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    
    if (range.startOffset > 0 && this.activeElementHasContent()) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    evt.stopPropagation();
    evt.preventDefault();
  }
  
  handleEnter = async (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
      return;
    }
  
    const { root } = this.state;
    
    evt.stopPropagation();
    evt.preventDefault();
    
    this.resetDomAndModelReferences();
    
    this.updateActiveElement();
  
    // create a ContentSection
    const content = getMapWithId({ type: NODE_TYPE_SECTION_CONTENT, parent_id: root.get('id') });
    const p = getMapWithId({ type: NODE_TYPE_P, parent_id: content.get('id') });
    this.updateParentList(content.get('id'), p, 0);
    this.updateParentList(root.get('id'), content);
    
    // commit updates
    this.commitUpdates();
  }
  
  handleChange = evt => {
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  render() {
    const {
      postId,
      root,
      allNodesByParentId,
      shouldRedirectWithId,
    } = this.state;
    
    if (shouldRedirectWithId) return (<Redirect to={`/edit/${postId}`} />);
    
    return !root ? null : (
      <div onKeyDown={this.handleChange} contentEditable={true}>
        <ContentNode node={root} allNodesByParentId={allNodesByParentId} />
      </div>
    );
  }
}
