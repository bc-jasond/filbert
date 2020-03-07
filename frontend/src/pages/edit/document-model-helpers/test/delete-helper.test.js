import { overrideConsole } from '../../../../common/test-helpers';
import DocumentModel from '../../document-model';
import { doDelete } from '../delete';

overrideConsole();
const doc = new DocumentModel();

describe('Document Model -> Delete helper', () => {
  test('doDelete - validates minimum input of startNodeId', () => {
    let result = doDelete(doc, { startNodeId: null });
    expect(result).toEqual({});
    expect(console.warn).toHaveBeenCalledTimes(1);
    result = doDelete(doc, {});
    expect(result).toEqual({});
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
});
