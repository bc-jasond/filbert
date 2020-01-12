/* eslint-disable import/prefer-default-export */
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

export function selectionFormatAction(
  documentModel,
  nodeArg,
  selection,
  action
) {
  const previousActionValue = selection.get(action);

  console.info('HANDLE SELECTION ACTION: ', action, selection.toJS());

  let node = nodeArg;
  if (action === SELECTION_ACTION_H1) {
    node = node
      .set(
        'type',
        node.get('type') === NODE_TYPE_H1 ? NODE_TYPE_P : NODE_TYPE_H1
      )
      .deleteIn(['meta', 'selections']);
  } else if (action === SELECTION_ACTION_H2) {
    node = node
      .set(
        'type',
        node.get('type') === NODE_TYPE_H2 ? NODE_TYPE_P : NODE_TYPE_H2
      )
      .deleteIn(['meta', 'selections']);
  }
  if (!node.equals(nodeArg)) {
    documentModel.update(node);
    return {
      startNodeId: node.get('id'),
      updatedNode: node,
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
