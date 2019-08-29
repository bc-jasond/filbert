import { List, Map } from 'immutable';

import {
  NODE_TYPE_OL,
  NODE_TYPE_P, NODE_TYPE_SECTION_CODE, NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER
} from '../../common/constants';
import { splitSelectionsAtCaretOffset } from './edit-selection-helpers';

export function handleBackspaceParagraph(documentModel, selectedNodeId) {
  const selectedSection = documentModel.getSection(selectedNodeId);
  const selectedNode = documentModel.getNode(selectedNodeId);
  const wasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  let prevSection;
  if (documentModel.isFirstChild(selectedNodeId)) {
    prevSection = documentModel.getPrevSibling(selectedSection.get('id'));
    // delete a spacer?
    if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
      const spacerSectionId = prevSection.get('id');
      prevSection = documentModel.getPrevSibling(spacerSectionId);
      documentModel.delete(spacerSectionId);
    }
    
    switch (prevSection.get('type')) {
      case NODE_TYPE_SECTION_H1:
      case NODE_TYPE_SECTION_H2: {
        documentModel.update(prevSection.set('content', `${prevSection.get('content')}${selectedNode.get('content')}`));
        documentModel.delete(selectedNodeId);
        if (wasOnlyChild) {
          documentModel.delete(selectedSection.get('id'));
        }
        return [prevSection.get('id'), prevSection.get('content').length];
      }
      case NODE_TYPE_SECTION_CONTENT: {
        // TODO: merge CONTENT sections
        let lastChild = documentModel.getLastChild(prevSection.get('id'));
        if (lastChild.get('type') === NODE_TYPE_OL) {
          // get last LI
          lastChild = documentModel.getLastChild(lastChild.get('id'));
        }
        // lastChild must be P
        documentModel.mergeParagraphs(lastChild.get('id'), selectedNodeId);
        documentModel.mergeSections(prevSection, selectedSection);
        return [lastChild.get('id'), lastChild.get('content').length];
      }
      case NODE_TYPE_SECTION_CODE: {
        const lines = prevSection.getIn(['meta', 'lines'], List());
        const lastLine = lines.last();
        
        documentModel.update(
          prevSection.setIn(
            ['meta', 'lines'],
            lines
              .pop()
              .push(`${lastLine}${selectedNode.get('content')}`)
          )
        );
        documentModel.delete(selectedNodeId);
        if (wasOnlyChild) {
          documentModel.delete(selectedSection.get('id'));
        }
        return [`${prevSection.get('id')}-${lines.size - 1}`, lastLine.length];
      }
    }
  }
  // merge Ps within the same CONTENT section
  let prevSibling = documentModel.getPrevSibling(selectedNodeId);
  if (prevSibling.get('type') === NODE_TYPE_OL) {
    prevSibling = documentModel.getLastChild(prevSibling.get('id'));
  }
  documentModel.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), prevSibling.get('content').length];
}

export function handleEnterParagraph(documentModel, selectedNodeId, caretPosition, content) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  const rightNodeId = documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P, contentRight);
  
  let leftNode = documentModel.getNode(selectedNodeId);
  let rightNode = documentModel.getNode(rightNodeId);
  [leftNode, rightNode] = splitSelectionsAtCaretOffset(leftNode, rightNode, caretPosition);
  console.info('ENTER "paragraph" content left: ', contentLeft, 'content right: ', contentRight, 'left selections: ', leftNode.getIn(['meta', 'selections'], List()).toJS(), 'right selections: ', rightNode.getIn(['meta', 'selections'], List()).toJS());
  documentModel.update(leftNode.set('content', contentLeft));
  documentModel.update(rightNode);
  return rightNodeId;
}

export function titleToParagraph(documentModel, selectedNodeId) {
  const titleSection = documentModel.getNode(selectedNodeId);
  // change title section to content section
  documentModel.update(titleSection.set('type', NODE_TYPE_SECTION_CONTENT));
  // insert paragraph
  return documentModel.insert(selectedNodeId, NODE_TYPE_P, 0, titleSection.get('content'));
}

export function paragraphToTitle(documentModel, selectedNodeId, sectionType) {
  const paragraph = documentModel.getNode(selectedNodeId);
  const section = documentModel.getSection(selectedNodeId);
  const sectionId = section.get('id');
  const content = paragraph.get('content');
  const paragraphWasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  const paragraphIdx = documentModel
    .getChildren(sectionId)
    .findIndex(s => s.get('id') === selectedNodeId);
  const sectionIdx = documentModel
    .getChildren(documentModel.rootId)
    .findIndex(s => s.get('id') === sectionId);
  
  documentModel.delete(selectedNodeId);
  // non-split scenario - just update existing section
  if (paragraphWasOnlyChild) {
    return documentModel.update(section
      .set('type', sectionType)
      .set('content', content)
    );
  }
  const sectionOffset = documentModel.splitSectionForFormatChange(sectionId, paragraphIdx);
  return documentModel.insertSection(sectionType, sectionIdx + sectionOffset, content);
}