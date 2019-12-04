import { List} from 'immutable';
import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE, NODE_TYPE_CODE,
  NODE_TYPE_H1,
  NODE_TYPE_H2
} from '../../../common/constants';
import { getNodeId } from '../../../common/dom';
import { deleteContentRange } from '../../../common/utils';
import { handleBackspaceCode, handleBackspaceCodeStructuralChange } from './by-section-type/handle-code';
import { handleBackspaceList } from './by-section-type/handle-list';
import { handleBackspaceTextType } from './handle-text-type';
import { handleBackspaceTitle } from './by-section-type/handle-title';
import { adjustSelectionOffsetsAndCleanup } from '../selection-helpers';

/**
 * @returns {Array[] | Array[focusNodeId, caretOffset, shouldFocusLastChild]}
 */
export function doDelete(documentModel, selectionOffsets) {
  const [
    [startNodeCaretStart, startNodeCaretEnd, startNode],
    middle,
    end,
  ] = selectionOffsets;
  const startNodeId = getNodeId(startNode);
  if (startNodeId === 'null' || !startNodeId) {
    console.warn('doDelete() bad selection, no id ', startNode);
    return [];
  }
  
  console.info('doDelete()', selectionOffsets)
  /**
   * Backspace scenarios:
   *
   * 1) caret is collapsed OR
   * 2) caret highlights 1 or more characters
   * 3) startNodeCaretStart === 0
   * 4) startNodeCaretEnd === selectedNodeMap.get('content').length
   * 5) caret start and end nodes are different (multi-node selection)
   * 6) there are middle nodes (this is easy, just delete them)
   * 7) merge (heal) content from two different nodes
   * 8) startNode is completely selected
   * 9) endNode is completely selected
   * 10) startNode and endNode are the same type
   */
  
  // there are completely highlighted nodes in the middle of the selection - just delete them
  if (middle) {
    middle.forEach(nodeId => {
      documentModel.delete(nodeId);
    });
  }
  
  /**
   * the selection spans more than one node
   * 1 - delete the highlighted text
   * 2 - set the currentNodeId to the endNode
   * 3 - set flag to continue to "structural" updates below.  This will heal endNode and startNode
   */
  // default the selectedNode to "startNode" - it can change to endNode below
  let selectedNodeId = startNodeId;
  let doesMergeParagraphs = false;
  if (end) {
    // since we're spanning more than one node, we might merge (if we don't delete the "end" node)
    doesMergeParagraphs = true;
    const [endNodeCaretStart, endNodeCaretEnd, endNode] = end;
    let endNodeId = getNodeId(endNode);
    // TODO: abstract this into a helper
    let endNodeMap = documentModel.getNode(endNodeId);
    const endNodeContent = endNodeMap.get('content');
    const endDiffLength = endNodeCaretEnd - endNodeCaretStart;
    // Set this to update focusNode
    selectedNodeId = endNodeId;
    // all of the endNode's content has been selected, delete it and set the selectedNodeId to the next sibling
    if (endDiffLength === endNodeContent.length) {
      documentModel.delete(endNodeId);
    } else {
      // only some of endNode's content has been selected, delete that content
      endNodeMap = endNodeMap.set('content', deleteContentRange(endNodeContent, 0, endDiffLength));
      endNodeMap = adjustSelectionOffsetsAndCleanup(endNodeMap, endNodeContent, endNodeCaretEnd, endDiffLength === 0 ? -1 : -endDiffLength);
      documentModel.update(endNodeMap);
    }
  }
  
  // TODO: abstract this into a helper
  let startNodeMap = documentModel.getNode(startNodeId);
  const startNodeContent = startNodeMap.get('content');
  
  const startDiffLength = startNodeCaretEnd - startNodeCaretStart;
  if ((startNodeCaretStart > 0 && startNodeContent) || startDiffLength > 0) {
    //  not at beginning of node text and node text isn't empty OR
    //  there's one or more chars of highlighted text
    //
    // NOTE: need to distinguish between collapsed caret backspace and highlight 1 char backspace
    //  the former removes a character behind the caret and the latter removes one in front...
    
    // all of the startNode's content has been selected, delete it
    if (startDiffLength === startNodeContent.length) {
      documentModel.delete(startNodeId);
    } else {
      // only some of endNode's content has been selected, delete that content
      startNodeMap = startNodeMap.set('content', deleteContentRange(startNodeContent, startNodeCaretStart, startDiffLength));
      startNodeMap = adjustSelectionOffsetsAndCleanup(startNodeMap, startNodeContent, startNodeCaretEnd, startDiffLength === 0 ? -1 : -startDiffLength);
      documentModel.update(startNodeMap);
    }
    
    // NOTE: Calling setState here will force all changed nodes to rerender.
    //  The browser will then place the caret at the beginning of the textContent... 😞 so we replace it with JS
    // ALSO: reaching this code means we don't need to continue to the "structural" handlers below.
    //  We'll place the caret where the selection ended and the user can hit backspace again to "heal" or merge sections
    if (!doesMergeParagraphs) {
      return [selectedNodeId, startDiffLength === 0 ? startNodeCaretStart - 1 : startNodeCaretStart];
    }
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
   *  UPDATE 3: wow, so much easier using a linked list data structure to represent the document, le sigh 🤦‍♀️
   */
  if (documentModel.isMetaType(selectedNodeId)) {
    console.info("doDelete() TODO: support MetaType sections")
  }
  const [focusNodeId, caretOffset] = handleBackspaceTextType(documentModel, selectedNodeId);
  return [focusNodeId, caretOffset, true];
}