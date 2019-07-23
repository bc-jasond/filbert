import {
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER
} from '../../common/constants';

export function handleBackspaceTitle(documentModel, updateManager, selectedNodeId) {
  if (documentModel.isFirstChild(selectedNodeId)) {
    // don't delete the first section, noop()
    return;
  }
  const selectedNode = documentModel.getNode(selectedNodeId);
  let prevSection = documentModel.getPrevSibling(selectedNodeId);
  // delete previous section (SPACER, etc)
  if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
    const spacerId = prevSection.get('id');
    prevSection = documentModel.getPrevSibling(spacerId);
    updateManager.delete(spacerId);
  }
  switch (prevSection.get('type')) {
    case NODE_TYPE_SECTION_H1:
    case NODE_TYPE_SECTION_H2: {
      updateManager.update(prevSection.set('content', `${prevSection.get('content')}${selectedNode.get('content')}`));
      updateManager.delete(selectedNodeId);
      return [prevSection.get('id'), prevSection.get('content').length];
    }
    case NODE_TYPE_SECTION_CONTENT: {
      let lastChild = documentModel.getLastChild(prevSection.get('id'));
      if (lastChild.get('type') === NODE_TYPE_OL) {
        // get last LI
        lastChild = documentModel.getLastChild(lastChild.get('id'));
      }
      // lastChild must be P
      updateManager.update(lastChild.set('content', `${lastChild.get('content')}${selectedNode.get('content')}`));
      const nextSection = documentModel.getNextSibling(selectedNodeId);
      updateManager.delete(selectedNodeId);
      if (nextSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
        documentModel.mergeSections(prevSection, nextSection);
      }
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
      
      return [`${prevSection.get('id')}-${lines.size - 1}`, lastLine.length];
    }
  }
}

/**
 * insert a new P tag (and a Content Section if the next section isn't one)
 */
export function handleEnterTitle(documentModel, updateManager, selectedNodeId, contentLeft, contentRight) {
  updateManager.update(documentModel.getNode(selectedNodeId).set('content', contentLeft));
  const nextSibling = documentModel.getNextSibling(selectedNodeId);
  let nextSiblingId;
  if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
    nextSiblingId = nextSibling.get('id');
  } else {
    // create a ContentSection
    nextSiblingId = documentModel.insertSectionAfter(selectedNodeId, NODE_TYPE_SECTION_CONTENT);
  }
  // add to existing content section
  return documentModel.insert(nextSiblingId, NODE_TYPE_P, 0, contentRight);
}

function insertTitle(documentModel, updateManager, selectedNodeId, sectionType) {
  const selectedSectionId = documentModel.getSection(selectedNodeId).get('id');
  const placeholderParagraphWasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  if (!documentModel.isLastChild(selectedNodeId)) {
    documentModel.splitSection(selectedSectionId, selectedNodeId);
  }
  const newSectionId = documentModel.insertSectionAfter(
    selectedSectionId,
    sectionType,
  );
  updateManager.delete(selectedNodeId);
  if (placeholderParagraphWasOnlyChild) {
    updateManager.delete(selectedSectionId);
  }
  return newSectionId;
}

export const insertH1 = (documentModel, updateManager, selectedNodeId) => insertTitle(documentModel, updateManager, selectedNodeId, NODE_TYPE_SECTION_H1);
export const insertH2 = (documentModel, updateManager, selectedNodeId) => insertTitle(documentModel, updateManager, selectedNodeId, NODE_TYPE_SECTION_H2);
