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
  SELECTION_LINK_URL,
} from '../../common/constants';
import { Selection } from '../../common/utils';
import { replaceSelection } from '../selection-helpers';

export function doFormatSelection(
  documentModel,
  nodeArg,
  selection,
  selectionIdx,
  action
) {
  const previousActionValue = selection.get(action);

  console.info('HANDLE SELECTION ACTION: ', action, selection.toJS());

  let node = nodeArg;
  // these first 2 actions change the node type
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
  // if we changed the node type (to an H1 or H2 or back to a P) - we're done
  if (!node.equals(nodeArg)) {
    return {
      historyState: documentModel.update(node),
      updatedSelection: Selection(),
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
  const updatedNode = replaceSelection(
    node,
    updatedSelectionModel,
    selectionIdx
  );

  return {
    historyState: documentModel.update(updatedNode),
    updatedSelection: updatedSelectionModel,
  };
}
