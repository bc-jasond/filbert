import { Map } from 'immutable';
import {
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_P,
  type,
  formatSelections,
  setType,
  setFormatSelections,
  update,
} from '@filbert/document';
import {
  italic,
  link,
  replaceSelection,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  setItalic,
  setLinkUrl,
  setSiteinfo,
  siteinfo,
} from '@filbert/selection';

export function doFormatSelection(
  documentModel,
  nodeModel,
  formatSelection,
  action
) {
  let historyLogEntry;
  const previousActionValue = formatSelection.get(action);

  console.info('HANDLE SELECTION ACTION: ', action, formatSelection.toJS());

  // these first 2 actions change the nodeModel type
  if (action === SELECTION_ACTION_H1) {
    nodeModel = setType(
      nodeModel,
      type(nodeModel) === NODE_TYPE_H1 ? NODE_TYPE_P : NODE_TYPE_H1
    );
    nodeModel = setFormatSelections(nodeModel, undefined);
    ({ documentModel, historyLogEntry } = update(documentModel, nodeModel));
    return {
      documentModel,
      historyLogEntry,
      updatedSelection: Map(),
    };
  }
  if (action === SELECTION_ACTION_H2) {
    nodeModel = setType(
      nodeModel,
      type(nodeModel) === NODE_TYPE_H2 ? NODE_TYPE_P : NODE_TYPE_H2
    );
    nodeModel = setFormatSelections(nodeModel, undefined);
    ({ documentModel, historyLogEntry } = update(documentModel, nodeModel));
    return {
      documentModel,
      historyLogEntry,
      updatedSelection: Map(),
    };
  }
  // toggle value
  formatSelection = formatSelection.set(action, !previousActionValue);
  // formatSelection can be either italic or siteinfo, not both
  if (action === SELECTION_ACTION_ITALIC && italic(formatSelection)) {
    formatSelection = setSiteinfo(formatSelection, false);
  }
  if (action === SELECTION_ACTION_SITEINFO && siteinfo(formatSelection)) {
    formatSelection = setItalic(formatSelection, false);
  }
  // clear URL text if not link anymore
  if (action === SELECTION_ACTION_LINK && !link(formatSelection)) {
    formatSelection = setLinkUrl(formatSelection, undefined);
  }
  nodeModel = setFormatSelections(
    nodeModel,
    replaceSelection(formatSelections(nodeModel), formatSelection)
  );
  ({ documentModel, historyLogEntry } = update(documentModel, nodeModel));
  return {
    documentModel,
    historyLogEntry,
    updatedSelection: formatSelection,
  };
}
