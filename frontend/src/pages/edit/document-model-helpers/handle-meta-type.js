/* eslint-disable import/prefer-default-export */
import { NODE_TYPE_P } from '../../../common/constants';

export function handleEnterMetaType(documentModel, leftNodeId) {
  // user hits enter on a selected MetaType, insert P after
  const rightNodeId = documentModel.insert(NODE_TYPE_P, leftNodeId);
  console.debug('ENTER "MetaType" id: ', leftNodeId, 'new P id: ', rightNodeId);
  return rightNodeId;
}
