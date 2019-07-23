import {
  NODE_TYPE_OL,
  NODE_TYPE_P, NODE_TYPE_SECTION_CODE, NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER
} from '../../common/constants';

export function handleBackspaceParagraph(editPipeline, selectedNodeId) {
  const selectedSection = editPipeline.getSection(selectedNodeId);
  const selectedNode = editPipeline.getNode(selectedNodeId);
  const wasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
  let prevSection;
  if (editPipeline.isFirstChild(selectedNodeId)) {
    prevSection = editPipeline.getPrevSibling(selectedSection.get('id'));
    // delete a spacer?
    if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
      const spacerSectionId = prevSection.get('id');
      prevSection = editPipeline.getPrevSibling(spacerSectionId);
      editPipeline.delete(spacerSectionId);
    }
  
    switch (prevSection.get('type')) {
      case NODE_TYPE_SECTION_H1:
      case NODE_TYPE_SECTION_H2: {
        editPipeline.update(prevSection.set('content', `${prevSection.get('content')}${selectedNode.get('content')}`));
        editPipeline.delete(selectedNodeId);
        if (wasOnlyChild) {
          editPipeline.delete(selectedSection.get('id'));
        }
        return [prevSection.get('id'), prevSection.get('content').length];
      }
      case NODE_TYPE_SECTION_CONTENT: {
        // TODO: merge CONTENT sections
        let lastChild = editPipeline.getLastChild(prevSection.get('id'))
        if (lastChild.get('type') === NODE_TYPE_OL) {
          // get last LI
          lastChild = editPipeline.getLastChild(lastChild.get('id'));
        }
        // lastChild must be P
        editPipeline.update(lastChild.set('content', `${lastChild.get('content')}${selectedNode.get('content')}`));
        editPipeline.delete(selectedNodeId);
        editPipeline.mergeSections(prevSection, selectedSection);
        return [lastChild.get('id'), lastChild.get('content').length];
      }
      case NODE_TYPE_SECTION_CODE: {
        const meta = prevSection.get('meta');
        const lines = meta.get('lines');
        const lastLine = lines.last();
      
        editPipeline.update(
          prevSection.set('meta',
            meta.set('lines',
              lines
                .pop()
                .push(`${lastLine}${selectedNode.get('content')}`)
            )
          )
        );
        editPipeline.delete(selectedNodeId);
        if (wasOnlyChild) {
          editPipeline.delete(selectedSection.get('id'));
        }
        return [`${prevSection.get('id')}-${lines.size - 1}`, lastLine.length];
      }
    }
  }
  // merge Ps within the same CONTENT section
  let prevSibling = editPipeline.getPrevSibling(selectedNodeId);
  if (prevSibling.get('type') === NODE_TYPE_OL) {
    prevSibling = editPipeline.getLastChild(prevSibling.get('id'));
  }
  editPipeline.mergeParagraphs(prevSibling.get('id'), selectedNodeId);
  return [prevSibling.get('id'), prevSibling.get('content').length];
}

export function handleEnterParagraph(editPipeline, selectedNodeId, contentLeft, contentRight) {
  editPipeline.update(editPipeline.getNode(selectedNodeId).set('content', contentLeft));
  return editPipeline.insertSubSectionAfter(selectedNodeId, NODE_TYPE_P, contentRight);
}

export function insertParagraph() {}