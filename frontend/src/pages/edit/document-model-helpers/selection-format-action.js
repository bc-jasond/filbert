/* eslint-disable import/prefer-default-export */
import { Map } from 'immutable';
import {
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_P,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LINK_URL
} from '../../../common/constants';
import { Selection, upsertSelection } from '../selection-helpers';

export function selectionFormatAction(documentModel, node, selection, action) {
  const previousActionValue = selection.get(action);

  console.info('HANDLE SELECTION ACTION: ', action, selection.toJS());

  let newSectionType;
  if (action === SELECTION_ACTION_H1) {
    newSectionType =
      node.get('type') === NODE_TYPE_H1 ? NODE_TYPE_P : NODE_TYPE_H1;
  } else if (action === SELECTION_ACTION_H2) {
    newSectionType =
      node.get('type') === NODE_TYPE_H2 ? NODE_TYPE_P : NODE_TYPE_H2;
  }
  if (newSectionType) {
    documentModel.update(node.set('type', newSectionType));
    return {
      focusNodeId: node.get('id'),
      updatedNode: Map(),
      updatedSelection: Selection()
    };
  }

  if (!documentModel.canHaveSelections(node.get('id'))) {
    return {
      focusNodeId: node.get('id'),
      updatedNode: Map(),
      updatedSelection: Selection()
    };
  }

  let updatedSelectionModel = selection.set(action, !previousActionValue);
  // selection can be either italic or siteinfo, not both
  if (
    action === SELECTION_ACTION_ITALIC &&
    updatedSelectionModel.get(SELECTION_ACTION_ITALIC)
  ) {
    updatedSelectionModel = updatedSelectionModel.remove(
      SELECTION_ACTION_SITEINFO
    );
  }
  if (
    action === SELECTION_ACTION_SITEINFO &&
    updatedSelectionModel.get(SELECTION_ACTION_SITEINFO)
  ) {
    updatedSelectionModel = updatedSelectionModel.remove(
      SELECTION_ACTION_ITALIC
    );
  }
  // clear URL text if not link anymore
  if (
    action === SELECTION_ACTION_LINK &&
    !updatedSelectionModel.get(SELECTION_ACTION_LINK)
  ) {
    updatedSelectionModel = updatedSelectionModel.remove(SELECTION_LINK_URL);
  }
  const updatedNode = upsertSelection(node, updatedSelectionModel);
  documentModel.update(updatedNode);
  return { updatedNode, updatedSelection: updatedSelectionModel };
}
