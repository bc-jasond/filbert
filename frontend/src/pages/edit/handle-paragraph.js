import { List } from 'immutable';

import {
  NODE_TYPE_OL,
  NODE_TYPE_P, NODE_TYPE_SECTION_CODE, NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER
} from '../../common/constants';

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
        return [prevSection.get('id'), -1];
      }
      case NODE_TYPE_SECTION_CONTENT: {
        // TODO: merge CONTENT sections
        let lastChild = documentModel.getLastChild(prevSection.get('id'));
        if (lastChild.get('type') === NODE_TYPE_OL) {
          // get last LI
          lastChild = documentModel.getLastChild(lastChild.get('id'));
        }
        // lastChild must be P
        documentModel.update(lastChild.set('content', `${lastChild.get('content')}${selectedNode.get('content')}`));
        documentModel.delete(selectedNodeId);
        documentModel.mergeSections(prevSection, selectedSection);
        return [lastChild.get('id'), -1];
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
        return [`${prevSection.get('id')}-${lines.size - 1}`, -1];
      }
    }
  }
  // merge Ps within the same CONTENT section
  let prevSibling = documentModel.getPrevSibling(selectedNodeId);
  if (prevSibling.get('type') === NODE_TYPE_OL) {
    prevSibling = documentModel.getLastChild(prevSibling.get('id'));
  }
  documentModel.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), -1];
}

export function handleEnterParagraph(documentModel, selectedNodeId, contentLeft, contentRight) {
  documentModel.update(documentModel.getNode(selectedNodeId).set('content', contentLeft));
  return documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P, contentRight);
}
