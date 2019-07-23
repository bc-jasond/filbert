import {
  NODE_TYPE_OL,
  NODE_TYPE_P, NODE_TYPE_SECTION_CODE, NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER
} from '../../common/constants';

export function handleBackspaceParagraph(documentModel, updateManager, selectedNodeId) {
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
      updateManager.delete(spacerSectionId);
    }
  
    switch (prevSection.get('type')) {
      case NODE_TYPE_SECTION_H1:
      case NODE_TYPE_SECTION_H2: {
        updateManager.update(prevSection.set('content', `${prevSection.get('content')}${selectedNode.get('content')}`));
        updateManager.delete(selectedNodeId);
        if (wasOnlyChild) {
          updateManager.delete(selectedSection.get('id'));
        }
        return [prevSection.get('id'), prevSection.get('content').length];
      }
      case NODE_TYPE_SECTION_CONTENT: {
        // TODO: merge CONTENT sections
        let lastChild = documentModel.getLastChild(prevSection.get('id'))
        if (lastChild.get('type') === NODE_TYPE_OL) {
          // get last LI
          lastChild = documentModel.getLastChild(lastChild.get('id'));
        }
        // lastChild must be P
        updateManager.update(lastChild.set('content', `${lastChild.get('content')}${selectedNode.get('content')}`));
        updateManager.delete(selectedNodeId);
        documentModel.mergeSections(prevSection, selectedSection);
        return [lastChild.get('id'), lastChild.get('content').length];
      }
      case NODE_TYPE_SECTION_CODE: {
        const meta = prevSection.get('meta');
        const lines = meta.get('lines');
        const lastLine = lines.last();
  
        updateManager.update(
          prevSection.set('meta',
            meta.set('lines',
              lines
                .pop()
                .push(`${lastLine}${selectedNode.get('content')}`)
            )
          )
        );
        updateManager.delete(selectedNodeId);
        if (wasOnlyChild) {
          updateManager.delete(selectedSection.get('id'));
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

export function handleEnterParagraph(documentModel, updateManager, selectedNodeId, contentLeft, contentRight) {
  updateManager.update(documentModel.getNode(selectedNodeId).set('content', contentLeft));
  return documentModel.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P, contentRight);
}
