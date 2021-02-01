/* eslint-disable import/prefer-default-export */
import { NODE_TYPE_H1, NODE_TYPE_H2, NODE_TYPE_P } from '@filbert/document';
import {
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  FormatSelectionNode,
} from '@filbert/selection';

export function doFormatSelection(documentModel, nodeArg, formatSelectionNode, action) {
  const previousActionValue = formatSelectionNode.get(action);

  console.info('HANDLE SELECTION ACTION: ', action, formatSelectionNode);

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
      updatedSelection: new FormatSelectionNode(),
    };
  }

  formatSelectionNode[action] = !previousActionValue;
  // formatSelectionNode can be either italic or siteinfo, not both
  if (
    action === SELECTION_ACTION_ITALIC &&
    formatSelectionNode.italic
  ) {
    formatSelectionNode.siteinfo = false;
  }
  if (
    action === SELECTION_ACTION_SITEINFO &&
    formatSelectionNode.siteinfo
  ) {
    formatSelectionNode.italic = false;
  }
  // clear URL text if not link anymore
  if (
    action === SELECTION_ACTION_LINK &&
    !formatSelectionNode.link
  ) {
    formatSelectionNode.linkUrl = undefined;
  }
  const updatedFormatSelections = node.formatSelections.replaceSelection(formatSelectionNode);
  node.formatSelections = updatedFormatSelections;

  return {
    historyState: documentModel.update(node),
    updatedSelection: formatSelectionNode,
  };
}
