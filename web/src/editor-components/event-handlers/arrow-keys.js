import {
  KEYCODE_DOWN_ARROW,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_UP_ARROW,
} from '@filbert/constants';
import {
  caretIsOnEdgeOfParagraphText,
  getRange,
  setCaret,
} from '../../common/dom.mjs';
import { stopAndPrevent } from '../../common/utils';
import { Map } from 'immutable';

// Intercept arrow keys when moving into or out of MetaType nodes
// no-op otherwise to allow native browser behaviour inside contenteditable text
export async function handleArrows({
  evt,
  selectionOffsets,
  documentModel,
  sectionEdit,
  editSectionNode,
  closeAllEditContentMenus,
}) {
  // return the prev or next node if the caret is at the "edge" of a paragraph
  // and the user hits the corresponding arrow key
  function getNeighborOnArrowNavigation() {
    const { startNodeId } = selectionOffsets;
    const currentNode = documentModel.getNode(startNodeId);
    let neighborNode;
    const [
      isAtTop,
      isAtEnd,
      isAtBottom,
      isAtStart,
    ] = caretIsOnEdgeOfParagraphText();
    if (
      (evt.keyCode === KEYCODE_UP_ARROW && isAtTop) ||
      (evt.keyCode === KEYCODE_LEFT_ARROW &&
        // NOTE: if the content is empty, there will be a ZERO_LENGTH char and user would
        // have to hit left twice without this code
        (isAtStart || currentNode.content.length === 0))
    ) {
      neighborNode = documentModel.getPrev(startNodeId);
    } else if (
      (evt.keyCode === KEYCODE_DOWN_ARROW && isAtBottom) ||
      (evt.keyCode === KEYCODE_RIGHT_ARROW &&
        (isAtEnd || currentNode.content.length === 0))
    ) {
      neighborNode = documentModel.getNext(startNodeId);
    }
    return neighborNode;
  }

  if (
    ![
      KEYCODE_UP_ARROW,
      KEYCODE_DOWN_ARROW,
      KEYCODE_LEFT_ARROW,
      KEYCODE_RIGHT_ARROW,
    ].includes(evt.keyCode) ||
    // don't override user adjusting selection with arrows
    evt.shiftKey
  ) {
    return false;
  }
  console.debug('ARROW');
  const { caretStart, caretEnd } = selectionOffsets;

  // collapse range if there's highlighted selection and the user hits an arrow
  if (caretStart !== caretEnd) {
    if ([KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)) {
      // up or left - collapse to start
      getRange().collapse(true);
    } else {
      // down or right - collapse to end
      getRange().collapse(false);
    }
    stopAndPrevent(evt);
    return true;
  }

  // if there's no currently selected MetaType node
  if (!editSectionNode.id) {
    // see if we've entered one
    const neighborNode = getNeighborOnArrowNavigation(evt, selectionOffsets);
    if (!neighborNode) {
      // we won't be leaving the current node, let contenteditable handle the caret
      console.log('ARROW - not leaving current node');
      return true;
    }
    stopAndPrevent(evt);
    if (neighborNode.isMetaType()) {
      await sectionEdit(neighborNode);
      return true;
    }
    /* NOTE: unset insertMenuNode here or arrow navigation breaks
          if (
              insertMenuNode.size > 0 &&
              neighborNode.get('id') !== insertMenuNode.get('id')
          ) {
              await new Promise((resolve) => {
                  setState({ insertMenuNode: Map() }, resolve);
              });
          }*/
    setCaret({
      startNodeId: neighborNode.id,
      caretStart: [KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)
        ? -1
        : 0,
    });
    return true;
  }

  /* TODO: move this into the respective edit menus to handle their own closing and arrow nav */
  //
  // we're currently inside a selected MetaType node
  // only leave edit section menu if user hit's up / down arrow
  // user can still use tab to move vertically between inputs
  // if (
  //   shouldShowEditSectionMenu &&
  //   ![KEYCODE_UP_ARROW, KEYCODE_DOWN_ARROW].includes(evt.keyCode)
  // ) {
  //   return;
  // }
  stopAndPrevent(evt);
  if ([KEYCODE_UP_ARROW, KEYCODE_LEFT_ARROW].includes(evt.keyCode)) {
    const prevNode = documentModel.getPrev(editSectionNode);
    if (prevNode) {
      return;
    }
    if (prevNode.isMetaType()) {
      await sectionEdit(prevNode);
      return;
    }
    await closeAllEditContentMenus();
    setCaret({ startNodeId: prevNode.get('id') });
    return;
  }
  // down or right arrows
  const nextNode = documentModel.getNext(editSectionNode);
  if (!nextNode) {
    return;
  }
  if (nextNode.isMetaType()) {
    await sectionEdit(nextNode);
    return;
  }
  await closeAllEditContentMenus();
  setCaret({ startNodeId: nextNode.id, caretStart: 0 });
  return true;
}
