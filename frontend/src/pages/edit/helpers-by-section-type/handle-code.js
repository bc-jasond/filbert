import { List } from 'immutable';
import {
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_SPACER,
} from '../../../common/constants';
import { cleanText, deleteContentRange } from '../../../common/utils';

function getPreCodeSectionIdAndIndex(selectedNodeId) {
  if (!selectedNodeId.includes('-')) {
    throw new Error(`CodeSection -> Pre id malformed: ${selectedNodeId}`);
  }
  const [sectionId, lineIdx] = selectedNodeId.split('-');
  return [sectionId, parseInt(lineIdx, 10)];
}

export function handleBackspaceCode(documentModel, selectedNodeId, caretPositionStart, diffLength = 0) {
  const [selectedSectionId, lineIndex] = getPreCodeSectionIdAndIndex(selectedNodeId);
  const selectedSection = documentModel.getNode(selectedSectionId);
  let lines = selectedSection.getIn(['meta', 'lines'], List());
  const currentLineContent = lines.get(lineIndex);
  
  documentModel.update(
    selectedSection.setIn(['meta', 'lines'], lines.set(lineIndex, deleteContentRange(currentLineContent, caretPositionStart, diffLength)))
  );
}

export function handleBackspaceCodeStructuralChange(documentModel, selectedNodeId) {
  const [selectedSectionId, lineIdx] = getPreCodeSectionIdAndIndex(selectedNodeId);
  let prevSection = documentModel.getPrevSibling(selectedSectionId);
  let prevFocusNodeId = documentModel.getPreviousFocusNodeId(selectedSectionId);
  const selectedSection = documentModel.getNode(selectedSectionId);
  const lines = selectedSection.getIn(['meta', 'lines'], List());
  const lineContent = cleanText(lines.get(lineIdx, ''));
  let prevLineContent = '';
  
  // delete the previous section?  Currently, only if CODE SECTION is empty and previous is a SPACER
  if (lines.size === 1 && lineContent.length === 0 && prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
    const spacerId = prevSection.get('id');
    prevFocusNodeId = documentModel.getPreviousFocusNodeId(spacerId);
    documentModel.delete(spacerId);
  }
  if (lines.size === 1 && lineContent.length === 0) {
    // delete CODE section - merge 2 CONTENT sections?
    prevSection = documentModel.getPrevSibling(selectedSectionId);
    const nextSection = documentModel.getNextSibling(selectedSectionId);
    documentModel.delete(selectedSectionId);
    if (prevSection.get('type') === NODE_TYPE_SECTION_CONTENT && nextSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
      documentModel.mergeSections(prevSection, nextSection);
    }
  } else if (lineIdx > 0) {
    // merge lines of code
    prevLineContent = lines.get(lineIdx - 1);
    documentModel.update(
      selectedSection.setIn(['meta', 'lines'],
        lines
          .delete(lineIdx)
          .set(lineIdx - 1, `${prevLineContent}${lineContent}`)
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
  return [prevFocusNodeId, documentModel.getNode(prevFocusNodeId).get('content', '').length];
}

export function handleEnterCode(documentModel, selectedNodeId, caretPosition, content) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  console.info('ENTER "code section" content left: ', contentLeft, 'content right: ', contentRight);
  const [selectedSectionId, lineIndex] = getPreCodeSectionIdAndIndex(selectedNodeId);
  const selectedSection = documentModel.getNode(selectedSectionId);
  let lines = selectedSection.getIn(['meta', 'lines'], List());
  
  if (cleanText(contentLeft).length === 0 && lineIndex === (lines.size - 1)) {
    if (lines.size > 1) {
      // remove last line of code - leave at least one line
      documentModel.update(
        selectedSection.setIn(['meta', 'lines'], lines.pop())
      );
    }
    // create a P tag (and optionally a CONTENT SECTION) after the OL - only if empty LI is last child (allows empty LIs in the middle of list)
    const nextSibling = documentModel.getNextSibling(selectedSectionId);
    let nextSiblingId;
    if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
      nextSiblingId = nextSibling.get('id');
    } else {
      // create a ContentSection
      nextSiblingId = documentModel.insertSectionAfter(selectedSectionId, NODE_TYPE_SECTION_CONTENT);
    }
    // add to existing content section
    return documentModel.insert(nextSiblingId, NODE_TYPE_P, 0, contentRight);
  }
  
  documentModel.update(
    selectedSection.setIn(
      ['meta', 'lines'],
      lines
        .set(lineIndex, contentLeft)
        .insert(lineIndex + 1, contentRight)
    )
  );
  
  console.info('ENTER - code section content: ', contentLeft, contentRight, selectedSectionId, lineIndex);
  return `${selectedSectionId}-${lineIndex + 1}`;
}

export function handlePasteCode(documentModel, selectedNodeId, caretPosition, clipboardText) {
  const clipboardLines = clipboardText.split('\n');
  const [selectedSectionId, selectedLineIdx] = getPreCodeSectionIdAndIndex(selectedNodeId);
  const selectedSection = documentModel.getNode(selectedSectionId);
  const lines = selectedSection.getIn(['meta', 'lines'], List());
  const selectedLine = lines.get(selectedLineIdx);
  const selectedLineLeft = selectedLine.substring(0, caretPosition);
  const selectedLineRight = selectedLine.substring(caretPosition);
  console.info('PASTE - code section selectedLine: ', selectedLineLeft, selectedLineRight, selectedSectionId, selectedLineIdx, clipboardLines);
  if (clipboardLines.length === 1) {
    documentModel.update(
      selectedSection.setIn(
        ['meta', 'lines'],
        lines
          .set(selectedLineIdx, `${selectedLineLeft}${clipboardLines[0]}${selectedLineRight}`)
      )
    );
    return [`${selectedSectionId}-${selectedLineIdx}`, selectedLineLeft.length + clipboardLines[0].length];
  }
  // clipboardLines.length > 1
  const firstClipboardLine = clipboardLines.shift();
  const lastClipboardLine = clipboardLines.pop();
  documentModel.update(
    selectedSection.setIn(
      ['meta', 'lines'],
      lines
        .set(selectedLineIdx, `${selectedLineLeft}${firstClipboardLine}`)
        // delete the empty line
        .splice(selectedLineIdx + 1, selectedLine.length > 0 ? 0 : 1, ...clipboardLines)
        .insert(selectedLineIdx + clipboardLines.length + 1, `${lastClipboardLine}${selectedLineRight}`)
    )
  );
  return [`${selectedSectionId}-${selectedLineIdx + clipboardLines.length + 1}`, lastClipboardLine.length];
}

export function handleDomSyncCode(documentModel, selectedNodeId, newContent, caretPositionStart) {
  const [selectedSectionId, lineIndex] = getPreCodeSectionIdAndIndex(selectedNodeId);
  const selectedSection = documentModel.getNode(selectedSectionId);
  let lines = selectedSection.getIn(['meta', 'lines'], List());
  const currentLineContent = lines.get(lineIndex);
  const updatedLineContent = `${currentLineContent.slice(0, caretPositionStart)}${newContent}${currentLineContent.slice(caretPositionStart)}`;
  documentModel.update(
    selectedSection.setIn(['meta', 'lines'], lines.set(lineIndex, updatedLineContent))
  );
}

export function insertCodeSection(documentModel, selectedNodeId) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  const placeholderParagraphWasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  if (!documentModel.isLastChild(selectedNodeId)) {
    documentModel.splitSection(selectedSectionId, selectedNodeId);
  }
  const newSectionId = documentModel.insertSectionAfter(
    selectedSectionId,
    NODE_TYPE_SECTION_CODE,
  );
  documentModel.delete(selectedNodeId);
  if (placeholderParagraphWasOnlyChild) {
    documentModel.delete(selectedSectionId);
  }
  return newSectionId;
}