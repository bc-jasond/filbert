import {
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_SPACER
} from '../../common/constants';

export function handleBackspaceTitle(editPipeline, selectedNodeId) {
  if (editPipeline.isFirstChild(selectedNodeId)) {
    // don't delete the first section, noop()
    return;
  }
  const selectedNode = editPipeline.getNode(selectedNodeId);
  let prevSection = editPipeline.getPrevSibling(selectedNodeId);
  // delete previous section (SPACER, etc)
  if (prevSection.get('type') === NODE_TYPE_SECTION_SPACER) {
    const spacerId = prevSection.get('id');
    prevSection = editPipeline.getPrevSibling(spacerId);
    this.editPipeline.delete(spacerId);
  }
  switch (prevSection.get('type')) {
    case NODE_TYPE_SECTION_H1:
    case NODE_TYPE_SECTION_H2: {
      editPipeline.update(prevSection.set('content', `${prevSection.get('content')}${selectedNode.get('content')}`));
      editPipeline.delete(selectedNodeId);
      return [prevSection.get('id'), prevSection.get('content').length];
    }
    case NODE_TYPE_SECTION_CONTENT: {
      let lastChild = editPipeline.getLastChild(prevSection.get('id'))
      if (lastChild.get('type') === NODE_TYPE_OL) {
        // get last LI
        lastChild = editPipeline.getLastChild(lastChild.get('id'));
      }
      // lastChild must be P
      editPipeline.update(lastChild.set('content', `${lastChild.get('content')}${selectedNode.get('content')}`));
      const nextSection = editPipeline.getNextSibling(selectedNodeId);
      editPipeline.delete(selectedNodeId);
      if (nextSection.get('type') === NODE_TYPE_SECTION_CONTENT) {
        editPipeline.mergeSections(prevSection, nextSection);
      }
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
      
      return [`${prevSection.get('id')}-${lines.size - 1}`, lastLine.length];
    }
  }
}

/**
 * insert a new P tag (and a Content Section if the next section isn't one)
 */
export function handleEnterTitle(editPipeline, selectedNodeId, contentLeft, contentRight) {
  editPipeline.update(editPipeline.getNode(selectedNodeId).set('content', contentLeft));
  const nextSibling = editPipeline.getNextSibling(selectedNodeId);
  let nextSiblingId;
  if (nextSibling.get('type') === NODE_TYPE_SECTION_CONTENT) {
    nextSiblingId = nextSibling.get('id');
  } else {
    // create a ContentSection
    nextSiblingId = editPipeline.insertSectionAfter(selectedNodeId, NODE_TYPE_SECTION_CONTENT);
  }
  // add to existing content section
  return editPipeline.insert(nextSiblingId, NODE_TYPE_P, 0, contentRight);
}

function insertTitle(editPipeline, selectedNodeId, sectionType) {
  const selectedSectionId = editPipeline.getSection(selectedNodeId).get('id');
  const placeholderParagraphWasOnlyChild = editPipeline.isOnlyChild(selectedNodeId);
  if (!editPipeline.isLastChild(selectedNodeId)) {
    editPipeline.splitSection(selectedSectionId, selectedNodeId);
  }
  const newSectionId = editPipeline.insertSectionAfter(
    selectedSectionId,
    sectionType,
  );
  editPipeline.delete(selectedNodeId);
  if (placeholderParagraphWasOnlyChild) {
    editPipeline.delete(selectedSectionId);
  }
  return newSectionId;
}

export const insertH1 = (editPipeline, selectedNodeId) => insertTitle(editPipeline, selectedNodeId, NODE_TYPE_SECTION_H1);
export const insertH2 = (editPipeline, selectedNodeId) => insertTitle(editPipeline, selectedNodeId, NODE_TYPE_SECTION_H2);
