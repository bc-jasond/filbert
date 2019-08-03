import React from 'react';
import { List, Map } from 'immutable';
import { Redirect } from 'react-router-dom';

import {
  apiGet,
  apiPost,
} from '../../common/fetch';
import {
  cleanText,
  cleanTextOrZeroLengthPlaceholder,
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
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_IMAGE,
  ENTER_KEY,
  BACKSPACE_KEY,
  UP_ARROW,
  NEW_POST_URL_ID,
  ROOT_NODE_PARENT_ID,
  NODE_TYPE_ROOT,
  NODE_TYPE_P,
  NODE_TYPE_OL,
  NODE_TYPE_LI,
  ESC_KEY,
  NODE_TYPE_PRE,
} from '../../common/constants';

import ContentNode from '../../common/content-node.component';
import EditDocumentModel from './edit-document-model';
import EditUpdateManager from './edit-update-manager';

import {
  handleBackspaceCode,
  handleDomSyncCode,
  handleEnterCode,
  insertCodeSection
} from './handle-code';
import { insertPhoto } from './handle-image';
import {
  handleBackspaceList,
  handleEnterList,
  insertList
} from './handle-list';
import {
  handleBackspaceParagraph,
  handleEnterParagraph
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
  getSelection,
  createSelection,
  mergeSelections,
  adjustSelectionsOffsets,
  mergeSelectionsWithSameFormats,
} from './edit-selection-helpers';

import InsertSectionMenu from './insert-section-menu';
import EditSectionForm from './edit-section-form';
import FormatSelectionMenu from './format-selection-menu';

import Page404 from '../404';

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
      editSectionId: null,
      editSectionType: null,
      editSectionMeta: Map(),
      editSectionMetaFormTopOffset: 0,
      editSectionMetaFormLeftOffset: 0,
      formatSelectionNode: Map(),
      formatSelectionModel: Map(),
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
  
  documentModel = new EditDocumentModel();
  updateManager = new EditUpdateManager();
  commitTimeoutId;
  cancelledEvent; // to coordinate noops between event types keydown, keyup
  
  saveContentBatch = async () => {
    try {
      const updated = this.updateManager.updates(this.documentModel);
      if (updated.length === 0) return;
      console.info('Save Batch', updated);
      const result = await apiPost('/content', updated);
      this.updateManager.clearUpdates();
      console.info('Save Batch result', result);
    } catch (err) {
      console.error('Content Batch Update Error: ', err);
    }
  }
  
  saveContentBatchDebounce() {
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(this.saveContentBatch, 500);
  }
  
  newPost() {
    const postPlaceholder = Map({ id: NEW_POST_URL_ID });
    this.updateManager.init(postPlaceholder);
    this.documentModel.init(postPlaceholder, this.updateManager);
    this.updateManager.stageNodeUpdate(this.documentModel.rootId);
    const focusNodeId = this.documentModel.insertSection(NODE_TYPE_SECTION_H1, 0);
    this.setState({
      root: this.documentModel.nodesByParentId.get(ROOT_NODE_PARENT_ID).first(),
      nodesByParentId: this.documentModel.nodesByParentId,
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
    this.updateManager.addPostIdToUpdates(postId);
    await this.saveContentBatch();
    this.setState({ shouldRedirectWithId: postId })
  }
  
  loadPost = async () => {
    try {
      const { post, contentNodes } = await apiGet(`/edit/${this.props.postId}`);
      this.updateManager.init(post);
      this.documentModel.init(post, this.updateManager, contentNodes);
      const focusNodeId = this.documentModel.getPreviousFocusNodeId(this.documentModel.rootId);
      this.setState({
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
      console.error(err);
      this.setState({ root: null, nodesByParentId: Map(), shouldShow404: true })
    }
  }
  
  commitUpdates = async (focusNodeId, offset = -1, shouldFocusLastChild) => {
    if (this.props.postId === NEW_POST_URL_ID) {
      await this.saveNewPost();
      return;
    } else {
      // optimistically save updated nodes - look ma, no errors!
      await this.saveContentBatchDebounce();
    }
    
    return new Promise((resolve, reject) => {
      // roll with state changes TODO: handle errors - roll back?
      this.setState({
        nodesByParentId: this.documentModel.nodesByParentId,
        shouldShowInsertMenu: false,
        insertMenuIsOpen: false,
        editSectionId: null,
        formatSelectionNode: Map(),
        formatSelectionModel: Map(),
      }, () => {
        setCaret(focusNodeId, offset, shouldFocusLastChild);
        this.manageInsertMenu();
        resolve();
      });
    })
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
  
  handleEnter = (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
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
    
    const selectedNode = getCaretNode();
    console.info('ENTER node: ', selectedNode);
    const selectedNodeType = getCaretNodeType();
    // split selectedNodeContent at caret
    const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(selectedNode.textContent);
    const contentLeft = selectedNodeContent.substring(0, range.endOffset);
    const contentRight = selectedNodeContent.substring(range.endOffset);
    console.info('ENTER node content left: ', contentLeft);
    console.info('ENTER node content right: ', contentRight);
    
    let focusNodeId;
    
    switch (selectedNodeType) {
      case NODE_TYPE_PRE: {
        focusNodeId = handleEnterCode(this.documentModel, selectedNode, contentLeft, contentRight);
        break;
      }
      case NODE_TYPE_LI: {
        focusNodeId = handleEnterList(this.documentModel, selectedNodeId, contentLeft, contentRight);
        break;
      }
      case NODE_TYPE_P: {
        focusNodeId = handleEnterParagraph(this.documentModel, selectedNodeId, contentLeft, contentRight);
        break;
      }
      case NODE_TYPE_SECTION_H1:
      case NODE_TYPE_SECTION_H2: {
        focusNodeId = handleEnterTitle(this.documentModel, selectedNodeId, contentLeft, contentRight);
        break;
      }
      default: {
        console.error("Can't handle ENTER!", selectedNodeType);
        return;
      }
    }
    this.commitUpdates(focusNodeId, 0);
  }
  
  handleSyncFromDom = () => {
    if (this.cancelledEvent || this.props.postId === NEW_POST_URL_ID) {
      // doesn't work with a 'new' post
      return;
    }
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    if (selectedNodeId === 'null' || !selectedNodeId) {
      console.error('DOM SYNC - bad selection, no id ', selectedNode);
      return;
    }
    const selectedNodeMap = this.documentModel.getNode(selectedNodeId);
    const selectedNodeContent = cleanText(selectedNode.textContent);
    if (selectedNode.tagName === 'PRE') {
      handleDomSyncCode(this.documentModel, selectedNodeId, selectedNodeContent);
    } else {
      this.documentModel.update(selectedNodeMap.set('content', selectedNodeContent));
    }
    console.debug('DOM SYNC ', selectedNode);
    this.saveContentBatchDebounce()
  }
  
  handleCaret = (evt) => {
    if (this.cancelledEvent || evt.isPropagationStopped()) {
      return;
    }
    const domNode = getCaretNode();
    if (domNode && domNode.tagName === 'PRE') {
      // TODO
      return;
    }
    const selectedNodeId = getCaretNodeId();
    const selectedNodeMap = this.documentModel.getNode(selectedNodeId);
    if (!selectedNodeMap) {
      console.warn('CARET no node, bad selection: ', getCaretNode());
      return;
    }
    console.debug('CARET - node', getCaretNode());
    if (selectedNodeMap.get('type') === NODE_TYPE_SECTION_SPACER) {
      evt.stopPropagation();
      evt.preventDefault();
      const shouldFocusOnPrevious = evt.keyCode === UP_ARROW;
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
    console.debug('KeyDown Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleBackspace(evt);
    this.handleEnter(evt);
    // this.handleCaret(evt);
  }
  
  handleKeyUp = (evt) => {
    console.debug('KeyUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleSyncFromDom(evt);
    this.handleCaret(evt);
    this.manageInsertMenu(evt);
    this.manageFormatSelectionMenu(evt);
    this.cancelledEvent = null;
  }
  
  handleMouseUp = (evt) => {
    console.debug('MouseUp Node: ', getCaretNode(), ' offset ', getCaretOffset())
    this.handleCaret(evt);
    this.manageInsertMenu();
    this.manageFormatSelectionMenu();
  }
  
  handlePaste = (evt) => {
    const selectedNode = getCaretNode();
    const selectedNodeId = getCaretNodeId();
    const domLines = evt.clipboardData.getData('text/plain').split('\n');
    if (getCaretNodeType() === NODE_TYPE_SECTION_CODE) {
      const selectedSection = this.documentModel.getNode(selectedNodeId);
      const meta = selectedSection.get('meta');
      
      this.documentModel.update(
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
    const range = getRange();
    if (!range) {
      return;
    }
    const selectedNode = getCaretNode();
    const selectedType = getCaretNodeType();
    
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
  insertSection = async (sectionType) => {
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
        focusNodeId = insertPhoto(this.documentModel, selectedNodeId);
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
    if ([NODE_TYPE_SECTION_QUOTE, NODE_TYPE_SECTION_IMAGE].includes(sectionType)) {
      this.sectionEdit(focusNodeId)
    }
  }
  
  updateMetaProp = (propName, value) => {
    const { editSectionMeta } = this.state;
    this.setState({ editSectionMeta: editSectionMeta.set(propName, value) })
  }
  sectionEdit = (sectionId) => {
    console.log('SECTION CALLBACK ', sectionId);
    const [sectionDomNode] = document.getElementsByName(sectionId);
    const section = this.documentModel.getNode(sectionId);
    
    this.setState({
      editSectionId: sectionId,
      editSectionType: section.get('type'),
      editSectionMeta: section.get('meta', Map()),
      editSectionMetaFormTopOffset: sectionDomNode.offsetTop,
      editSectionMetaFormLeftOffset: sectionDomNode.offsetLeft,
    });
    
    // 1. open edit menu
    // 2. position it based on the section
    // 3. save and close
    // 4. cancel and close
  }
  sectionEditClose = () => {
    this.setState({
      editSectionId: null,
      editSectionType: null,
      editSectionMeta: Map(),
    });
  }
  sectionSaveMeta = (sectionId) => {
    const { editSectionMeta } = this.state;
    const section = this.documentModel.getNode(sectionId);
    this.documentModel.update(section.set('meta', editSectionMeta));
    this.commitUpdates(sectionId);
  }
  sectionDelete = (sectionId) => {
    if (confirm('Delete Section?')) {
      const focusNodeId = this.documentModel.getNextFocusNodeId(sectionId);
      this.documentModel.delete(sectionId);
      this.commitUpdates(focusNodeId);
    }
  }
  
  manageFormatSelectionMenu(evt) {
    const range = getRange();
    const isEscKey = evt && evt.keyCode === ESC_KEY;
    const selectedNode = getCaretNode();
    if (!range || range.collapsed || !selectedNode || isEscKey) {
      this.setState({
        formatSelectionNode: Map(),
        formatSelectionModel: Map(),
        formatSelectionMenuTopOffset: 0,
        formatSelectionMenuLeftOffset: 0,
        formatSelectionStart: 0,
        formatSelectionEnd: 0,
      })
      return;
    }
    console.info('SELECTION: ', range, range.getBoundingClientRect());
    const rect = range.getBoundingClientRect();
    const selectedNodeId = getCaretNodeId();
    const selectedNodeModel = this.documentModel.getNode(selectedNodeId);
    const selections = selectedNodeModel.get('meta', Map()).get('selections', Map())
    //const
    this.setState({
      formatSelectionNode: selectedNodeModel,
      formatSelectionModel: getSelection(selections, range.startOffset, range.endOffset),
      formatSelectionMenuTopOffset: selectedNode.offsetTop,
      formatSelectionMenuLeftOffset: (rect.left + rect.right) / 2,
      formatSelectionStart: range.startOffset,
      formatSelectionEnd: range.endOffset,
    });
  }
  
  handleSelectionAction = (action, nodeModel, start, end) => {
    const nodeId = nodeModel.get('id');
    console.info('HANDLE SELECTION ACTION: ', action, nodeId, start, end);
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
      editSectionId,
      editSectionType,
      editSectionMeta,
      editSectionMetaFormTopOffset,
      editSectionMetaFormLeftOffset,
      formatSelectionNode,
      formatSelectionMenuTopOffset,
      formatSelectionMenuLeftOffset,
      formatSelectionStart,
      formatSelectionEnd,
      formatSelectionModel,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    if (shouldRedirectWithId) return (<Redirect to={`/edit/${shouldRedirectWithId}`} />);
    
    return root && (
      <React.Fragment>
        <div onKeyDown={this.handleKeyDown} onKeyUp={this.handleKeyUp} onMouseUp={this.handleMouseUp}
             onPaste={this.handlePaste}
             contentEditable={true} suppressContentEditableWarning={true}>
          <ContentNode node={root} nodesByParentId={nodesByParentId} isEditing={this.sectionEdit} />
        </div>
        {shouldShowInsertMenu && (<InsertSectionMenu
          insertMenuTopOffset={insertMenuTopOffset}
          insertMenuLeftOffset={insertMenuLeftOffset}
          toggleInsertMenu={this.toggleInsertMenu}
          insertMenuIsOpen={insertMenuIsOpen}
          insertSection={this.insertSection}
        />)}
        {editSectionId && (<EditSectionForm
          editSectionId={editSectionId}
          editSectionType={editSectionType}
          editSectionMeta={editSectionMeta}
          editSectionMetaFormTopOffset={editSectionMetaFormTopOffset}
          editSectionMetaFormLeftOffset={editSectionMetaFormLeftOffset}
          updateMetaProp={this.updateMetaProp}
          sectionSaveMeta={this.sectionSaveMeta}
          sectionDelete={this.sectionDelete}
          close={this.sectionEditClose}
        />)}
        {formatSelectionNode.get('id') && (<FormatSelectionMenu
          offsetTop={formatSelectionMenuTopOffset}
          offsetLeft={formatSelectionMenuLeftOffset}
          nodeModel={formatSelectionNode}
          selectionModel={formatSelectionModel}
          selectionAction={(action) => this.handleSelectionAction(
            action,
            formatSelectionNode,
            formatSelectionStart,
            formatSelectionEnd)}
        />)}
      </React.Fragment>
    );
  }
}
