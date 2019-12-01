import { Map } from 'immutable';
import {
  NODE_TYPE_LI, NODE_TYPE_P,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2, SELECTION_ACTION_ITALIC, SELECTION_ACTION_LINK, SELECTION_ACTION_SITEINFO, SELECTION_LINK_URL
} from '../../../common/constants';
import { splitListReplaceListItemWithSection } from './by-section-type/handle-list';
import { paragraphToTitle, titleToParagraph } from './by-section-type/handle-paragraph';
import { Selection, upsertSelection } from '../selection-helpers';

export function selectionFormatAction(documentModel, node, selection, action) {
  const previousActionValue = selection.get(action);
  
  console.info('HANDLE SELECTION ACTION: ', action, selection.toJS());
  
  if ([SELECTION_ACTION_H1, SELECTION_ACTION_H2].includes(action)) {
    const sectionType = action === SELECTION_ACTION_H1 ? NODE_TYPE_H1 : NODE_TYPE_H2;
    const selectedNodeId = node.get('id');
    let focusNodeId;
    // list item -> H1 or H2
    if (node.get('type') === NODE_TYPE_LI) {
      focusNodeId = splitListReplaceListItemWithSection(documentModel, selectedNodeId, sectionType);
    } else if (node.get('type') === NODE_TYPE_P) {
      // paragraph -> H1 or H2
      focusNodeId = paragraphToTitle(documentModel, selectedNodeId, sectionType);
    } else if (node.get('type') === sectionType) {
      // H1 or H2 -> paragraph
      focusNodeId = titleToParagraph(documentModel, selectedNodeId);
    } else {
      // H1 -> H2 or H2 -> H1
      focusNodeId = documentModel.update(node.set('type', sectionType));
    }
    return [focusNodeId, Map(), Selection()];
  }
  
  let updatedSelectionModel = selection.set(action, !previousActionValue);
  // selection can be either italic or siteinfo, not both
  if (action === SELECTION_ACTION_ITALIC && updatedSelectionModel.get(SELECTION_ACTION_ITALIC)) {
    updatedSelectionModel = updatedSelectionModel.remove(SELECTION_ACTION_SITEINFO);
  }
  if (action === SELECTION_ACTION_SITEINFO && updatedSelectionModel.get(SELECTION_ACTION_SITEINFO)) {
    updatedSelectionModel = updatedSelectionModel.remove(SELECTION_ACTION_ITALIC);
  }
  // clear URL text if not link anymore
  if (action === SELECTION_ACTION_LINK && !updatedSelectionModel.get(SELECTION_ACTION_LINK)) {
    updatedSelectionModel = updatedSelectionModel.remove(SELECTION_LINK_URL);
  }
  const updatedNode = upsertSelection(
    node,
    updatedSelectionModel,
  );
  documentModel.update(updatedNode);
  return [undefined, updatedNode, updatedSelectionModel];
}