import React from 'react';
import { List, Map } from 'immutable';
import { Redirect } from 'react-router-dom';

import EditPipeline from './edit-pipeline';
import {
  apiGet,
  apiPost,
} from '../../common/fetch';
import {
  cleanText, cleanTextOrZeroLengthPlaceholder,
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
  ROOT_NODE_PARENT_ID, NODE_TYPE_SECTION_H2, NODE_TYPE_SECTION_CODE, ZERO_LENGTH_CHAR, NODE_TYPE_ROOT,
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
        return this.newPost();
      }
      return this.loadPost();
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
      const focusNodeId = this.editPipeline.getPreviousFocusNodeId(this.editPipeline.rootId);
      this.setState({
        root: this.editPipeline.root,
        nodesByParentId: this.editPipeline.nodesByParentId,
        shouldShow404: false
      }, () => {
        setCaret(focusNodeId)
        this.manageInsertMenu();
        window.scrollTo(0, 0);
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
    
    const range = getRange();
    if (!range) {
      console.warn('BACKSPACE no range');
      return;
    }
    
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('BACKSPACE - bad selection, no id ', selectedNode);
      return;
    }
    const selectedNodeContent = cleanText(selectedNode.textContent);
    
    console.info('BACKSPACE node: ', selectedNode, ' content: ', selectedNodeContent);
    
    if (range.startOffset > 0 && cleanText(selectedNodeContent)) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    
    evt.stopPropagation();
    evt.preventDefault();
  
    /**
     * // TODO: make these into sets of atomic commands that are added to a queue, then make a 'flush' command to process this queue.  Right now, live updates are happening and it's wack-a-mole galore
     * THINGS TO CONSIDER FOR DELETE (in order):
     * 1) only-child of first section - noop until there's special 'rootIsEmpty' placeholder logic
     * 2) delete the current selected node - always if 'this far'
     * 3) delete the previous section (if it's a SPACER or other terminal node)?
     * 4) merge the current section's children (could be 0) into previous section (current section will be deleted)
     * 5) merge the current selected node's text into the previous node?
     * 6) selected node is/was an only-child, delete current section
     */
  
    
    
    const selectedSectionId = this.editPipeline.getSection(selectedNodeId).get('id');
    let prevSection = this.editPipeline.getPrevSibling(selectedSectionId);
    
    // only child of first section - noop
    if (this.editPipeline.isOnlyChild(selectedNodeId) && prevSection.size === 0) {
      return;
    }
    
    let prevSibling = this.editPipeline.getPrevSibling(selectedNodeId);
    let didDeletePrevSection = false;
    // save these locally before updates
    const isOnlyChild = this.editPipeline.isOnlyChild(selectedNodeId);
    // handles CONTENT only
    const isFirstChild = this.editPipeline.isFirstChild(selectedNodeId);
    // need to pick the node or the section to get the right previous!
    const selectedSectionIsFirstChildOfRoot = this.editPipeline.isFirstChild(selectedSectionId);
    let focusNodeId = this.editPipeline.getPreviousFocusNodeId(selectedSectionIsFirstChildOfRoot ? selectedNodeId : selectedSectionId);
  
    // CodeSection - custom 'terminal' section logic
    if (selectedNode.tagName === 'PRE') {
      const name = selectedNode.getAttribute('name');
      const [selectedSectionId, idx] = name.split('-');
      const lineIdx = parseInt(idx, 10);
      const selectedSection = this.editPipeline.getNode(selectedSectionId);
      const meta = selectedSection.get('meta');
      let lines = meta.get('lines');
    
      if (lines.size === 1) {
        // delete the section
        this.editPipeline.delete(selectedSectionId);
      } else {
        this.editPipeline.update(
          selectedSection.set('meta',
            meta.set('lines',
              lines.delete(lineIdx)
            )
          )
        );
      }
    
      console.info('BACKSPACE - code section content: ', selectedNodeContent, selectedSectionId, lineIdx);
      focusNodeId = `${selectedSectionId}-${lineIdx - 1 > 0 ? lineIdx - 1 : 0}`;
    } else {
      // delete current node
      this.editPipeline.delete(selectedNodeId);
    }
    
    // delete previous section (SPACER, etc)
    if (isFirstChild && prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
      const spacerId = prevSection.get('id');
      focusNodeId = this.editPipeline.getPreviousFocusNodeId(prevSection.get('id'));
      prevSection = this.editPipeline.getPrevSibling(spacerId);
      prevSibling = this.editPipeline.getLastChild(prevSection.get('id'));
      didDeletePrevSection = true;
      this.editPipeline.delete(spacerId);
    }
    
    // merge current section's children
    // TODO: merge & convert section types H1 -> Content, Content -> H1, etc.
    if (isFirstChild && prevSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
      this.editPipeline.mergeSections(prevSection.get('id'), selectedSectionId);
      if (!didDeletePrevSection) {
        // TODO: this is confusing.  Given a sectionId, getPreviousFocusNodeId will look for a previous/next section.  But here, we want to look for the first/last child of current section.  This will already have happened by 'delete previous section' code
        focusNodeId = this.editPipeline.getPreviousFocusNodeId(prevSection.get('id'));
      }
    }
  
    let caretOffset = -1;
    // merge current node's text into previous sibling
    if (cleanText(selectedNodeContent)) {
      if (selectedNodeId === selectedSectionId) {
        // H1 or H2 - aka, sections that have text nodes directly
        prevSibling = this.editPipeline.getLastChild(prevSection.get('id'));
      }
      const prevSiblingText = this.editPipeline.getText(prevSibling.get('id'));
      this.editPipeline.replaceTextNode(prevSibling.get('id'), `${prevSiblingText}${selectedNodeContent}`);
      caretOffset = prevSiblingText.length;
      focusNodeId = prevSibling.get('id');
    }
    
    // delete section? merging will have already deleted it
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
    const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(selectedNode.textContent);
    
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('ENTER - bad selection, no id ', selectedNode);
      return;
    }
  
    console.info('ENTER node: ', selectedNode);
    console.info('ENTER node content: ', selectedNodeContent);
    console.info('ENTER node content left: ', contentLeft);
    console.info('ENTER node content right: ', contentRight);
    
    const selectedNodeType = getCaretNodeType();
    // split selectedNodeContent at caret
    const contentLeft = selectedNodeContent.substring(0, range.endOffset);
    const contentRight = selectedNodeContent.substring(range.endOffset);
    
    let focusNodeId;
  
    /**
     * CodeSection
     */
  
    if (selectedNode.tagName === 'PRE') {
      const name = selectedNode.getAttribute('name');
      const [selectedSectionId, idx] = name.split('-');
      const lineIndex = parseInt(idx, 10);
      const selectedSection = this.editPipeline.getNode(selectedSectionId);
      const meta = selectedSection.get('meta');
      let lines = meta.get('lines');
    
      this.editPipeline.update(
        selectedSection.set('meta',
          meta.set('lines',
            lines
              .set(lineIndex, selectedNodeContent)
              .insert(lineIndex + 1, ZERO_LENGTH_CHAR)
          )
        )
      );
    
      console.info('ENTER - code section content: ', selectedNodeContent, selectedSectionId, lineIndex);
      focusNodeId = `${selectedSectionId}-${lineIndex + 1}`;
    }
    
    /**
     * insert a new P after the current one
     */
    if (selectedNodeType === NODE_TYPE_P) {
      this.editPipeline.replaceTextNode(selectedNodeId, contentLeft);
      const pId = this.editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P);
      this.editPipeline.replaceTextNode(pId, contentRight);
      focusNodeId = pId;
    }
    /**
     * insert a new P tag (and a Content Section if the next section isn't one)
     */
    if ([NODE_TYPE_SECTION_H1, NODE_TYPE_SECTION_H2].includes(selectedNodeType)) {
      this.editPipeline.replaceTextNode(selectedNodeId, contentLeft);
      const nextSibling = this.editPipeline.getNextSibling(selectedNodeId);
      let nextSiblingId;
      if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
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
    this.commitUpdates(focusNodeId, 0);
  }
  
  handleSyncFromDom = () => {
    if (this.props.postId === NEW_POST_URL_ID) {
      // doesn't work with a 'new' post
      return;
    }
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.warn('DOM SYNC - bad selection, no id ', selectedNode);
      return;
    }
    const selectedNodeContent = cleanText(selectedNode.textContent);
    if (selectedNode.tagName === 'PRE') {
      const [selectedSectionId, idx] = selectedNodeId.split('-');
      const lineIndex = parseInt(idx, 10);
      const selectedSection = this.editPipeline.getNode(selectedSectionId);
      const meta = selectedSection.get('meta');
      let lines = meta.get('lines');
      const currentLineContent = lines.get(lineIndex);
      if (currentLineContent === selectedNodeContent) {
        return;
      }
      this.editPipeline.update(
        selectedSection.set('meta',
          meta.set('lines', lines.set(lineIndex, selectedNodeContent))
        )
      );
    } else if (!this.editPipeline.replaceTextNode(selectedNodeId, selectedNodeContent)) {
      return;
    }
    console.info('DOM SYNC ', selectedNode);
    this.saveContentBatchDebounce()
  }
  
  handleCaret = (evt) => {
    if (evt.isPropagationStopped()) {
      return;
    }
    const domNode = getCaretNode();
    if (domNode.tagName === 'PRE') {
      // TODO
      return;
    }
    const selectedNodeId = getCaretNodeId();
    const selectedNode = this.editPipeline.getNode(selectedNodeId);
    if (!selectedNode) {
      console.warn('CARET no node, bad selection: ', getCaretNode());
      return;
    }
    console.info('CARET - node', getCaretNode());
    if (selectedNode.get('type') === NODE_TYPE_SECTION_SPACER) {
      evt.stopPropagation();
      evt.preventDefault();
      const shouldFocusOnPrevious = evt.keyCode === UP_ARROW;
      const focusNodeId = shouldFocusOnPrevious
        ? this.editPipeline.getPreviousFocusNodeId(selectedNodeId)
        : this.editPipeline.getNextFocusNodeId(selectedNodeId);
      setCaret(focusNodeId);
    } else if (selectedNode.get('type') === NODE_TYPE_ROOT) {
      evt.stopPropagation();
      evt.preventDefault();
      setCaret(this.editPipeline.getNextFocusNodeId(selectedNodeId));
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
  
  handlePaste = (evt) => {
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const domLines = evt.clipboardData.getData('text/plain').split('\n');
    if (getCaretNodeType() === NODE_TYPE_SECTION_CODE) {
      const selectedSection = this.editPipeline.getNode(selectedNodeId);
      const meta = selectedSection.get('meta');
  
      this.editPipeline.update(
        selectedSection.set('meta',
          meta.set('lines', List(domLines))
        )
      );
      this.commitUpdates();
    }
    if (selectedNode.tagName === 'PRE') {
    
    }
    console.log('PASTE ', domLines, selectedNode);
    evt.stopPropagation();
    evt.preventDefault();
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
        setCaret(this.insertMenuSelectedNodeId);
      }
    });
  }
  
  /**
   * INSERT SECTIONS
   */
  insertSection = (sectionType) => {
    const selectedNodeId = this.insertMenuSelectedNodeId;
    const selectedSectionId = this.editPipeline.getSection(selectedNodeId).get('id');
    // splitting the current section even if selectedNodeId is first or last child
    this.editPipeline.splitSection(selectedSectionId, selectedNodeId);
    // meta for custom terminal sections?
    const newSectionMeta = sectionType === NODE_TYPE_SECTION_CODE
      ? Map({ lines: List([ZERO_LENGTH_CHAR]) })
      : Map();
    // insert the section
    const newSectionId = this.editPipeline.insertSectionAfter(selectedSectionId, sectionType, newSectionMeta);
    let focusNodeId;
    if (sectionType === NODE_TYPE_SECTION_SPACER) {
      // TODO: all 'terminal' sections
      //  1) move caret ahead to new section
      // focus *after* new section
      focusNodeId = this.editPipeline.getNextFocusNodeId(newSectionId);
    } else {
      // don't need this empty P tag
      if (this.editPipeline.isOnlyChild(selectedNodeId)) {
        this.editPipeline.delete(selectedSectionId);
      } else {
        this.editPipeline.delete(selectedNodeId);
      }
      focusNodeId = newSectionId;
    }
    
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
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp} onMouseUp={this.handleMouseUp} onPaste={this.handlePaste}
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
            <InsertSectionItem onClick={() => this.insertSection(NODE_TYPE_SECTION_CODE)}>code</InsertSectionItem>
            <InsertSectionItem>list</InsertSectionItem>
            <InsertSectionItem onClick={() => this.insertSection(NODE_TYPE_SECTION_SPACER)}>spacer</InsertSectionItem>
            <InsertSectionItem onClick={() => this.insertSection(NODE_TYPE_SECTION_H1)}>H1</InsertSectionItem>
            <InsertSectionItem onClick={() => this.insertSection(NODE_TYPE_SECTION_H2)}>H2</InsertSectionItem>
            <InsertSectionItem>quote</InsertSectionItem>
            <InsertSectionItem>post link</InsertSectionItem>
          </InsertSectionMenuItemsContainer>
        </InsertSectionMenu>
      </React.Fragment>
    );
  }
}
