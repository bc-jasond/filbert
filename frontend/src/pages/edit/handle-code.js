import { List, Map } from 'immutable';
import {
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_SPACER,
  ZERO_LENGTH_CHAR
} from '../../common/constants';
import { cleanText } from '../../common/utils';

export function handleBackspaceCode(editPipeline, selectedNodeId) {
  const [selectedSectionId, idx] = selectedNodeId.split('-');
  const lineIdx = parseInt(idx, 10);
  const prevSection = editPipeline.getPrevSibling(selectedSectionId);
  let prevFocusNodeId = editPipeline.getPreviousFocusNodeId(selectedSectionId);
  const selectedSection = editPipeline.getNode(selectedSectionId);
  const meta = selectedSection.get('meta');
  const lines = meta.get('lines');
  const lineContent = cleanText(lines.get(lineIdx));
  let prevLineContent = '';
  
  // delete the previous section?  Currently, only if CODE SECTION is empty and previous is a SPACER
  if (lines.size === 1 && lineContent.length === 0 && prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
    prevFocusNodeId = editPipeline.getPreviousFocusNodeId(prevSection.get('id'));
    editPipeline.delete(prevSection.get('id'))
  }
  if (lines.size === 1 && lineContent.length === 0) {
    editPipeline.delete(selectedSectionId);
  } else if (lineIdx > 0) {
    // merge lines of code
    prevLineContent = lines.get(lineIdx - 1);
    editPipeline.update(
      selectedSection.set('meta',
        meta.set('lines',
          lines
            .delete(lineIdx)
            .set(lineIdx - 1, `${prevLineContent}${lineContent}`)
        )
      )
    )
  } else {
    //TODO: support convert/merge into other sections
    return [];
  }
  
  console.info('BACKSPACE - code section content: ', selectedSectionId, lineIdx);
  if (lineIdx > 0) {
    // a PRE was deleted, focus previous PRE
    return [`${selectedSectionId}-${lineIdx - 1}`, prevLineContent.length];
  }
  // the CODE_SECTION was deleted, focus previous section
  return [prevFocusNodeId, editPipeline.getNode(prevFocusNodeId).get('content').length];
}

export function handleEnterCode(editPipeline, selectedNode, contentLeft, contentRight) {
  const name = selectedNode.getAttribute('name');
  const [selectedSectionId, idx] = name.split('-');
  const lineIndex = parseInt(idx, 10);
  const selectedSection = editPipeline.getNode(selectedSectionId);
  const meta = selectedSection.get('meta');
  let lines = meta.get('lines');
  
  if (cleanText(contentLeft).length === 0 && lineIndex === (lines.size - 1)) {
    // remove last line of code
    editPipeline.update(
      selectedSection.set('meta',
        meta.set('lines',
          lines.pop()
        )
      )
    );
    
    // create a P tag (and optionally a CONTENT SECTION) after the OL - only if empty LI is last child (allows empty LIs in the middle of list)
    const nextSibling = editPipeline.getNextSibling(selectedSectionId);
    let nextSiblingId;
    if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
      nextSiblingId = nextSibling.get('id');
    } else {
      // create a ContentSection
      nextSiblingId = editPipeline.insertSectionAfter(selectedSectionId, NODE_TYPE_SECTION_CONTENT);
    }
    // add to existing content section
    return editPipeline.insert(nextSiblingId, NODE_TYPE_P, 0, contentRight);
  }
  
  editPipeline.update(
    selectedSection.set('meta',
      meta.set('lines',
        lines
          .set(lineIndex, contentLeft)
          .insert(lineIndex + 1, contentRight)
      )
    )
  );
  
  console.info('ENTER - code section content: ', contentLeft, contentRight, selectedSectionId, lineIndex);
  return `${selectedSectionId}-${lineIndex + 1}`;
}

export function handleDomSyncCode(editPipeline, selectedNodeId, selectedNodeContent) {
  const [selectedSectionId, idx] = selectedNodeId.split('-');
  const lineIndex = parseInt(idx, 10);
  const selectedSection = editPipeline.getNode(selectedSectionId);
  const meta = selectedSection.get('meta');
  let lines = meta.get('lines');
  const currentLineContent = lines.get(lineIndex);
  if (currentLineContent === selectedNodeContent) {
    return;
  }
  editPipeline.update(
    selectedSection.set('meta',
      meta.set('lines', lines.set(lineIndex, selectedNodeContent))
    )
  );
}

export function insertCodeSection(editPipeline, selectedNodeId) {
  const selectedSectionId = editPipeline.getSection(selectedNodeId).get('id');
  const placeholderParagraphWasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
  if (!editPipeline.isLastChild(selectedNodeId)) {
    editPipeline.splitSection(selectedSectionId, selectedNodeId);
  }
  const newSectionId = editPipeline.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_CODE,
    Map({ lines: List([ZERO_LENGTH_CHAR]) }),
  );
  editPipeline.delete(selectedNodeId);
  if (placeholderParagraphWasOnlyChild) {
    editPipeline.delete(selectedSectionId);
  }
  return newSectionId;
}
