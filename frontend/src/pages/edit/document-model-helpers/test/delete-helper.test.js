import { overrideConsole } from '../../../../common/test-helpers';
import DocumentModel from '../../document-model';
import { doDelete } from '../delete';

overrideConsole();
const doc = new DocumentModel();

describe('Document Model -> Delete helper - no merge', () => {
  test('doDelete - validates minimum input of startNodeId', () => {
    let result = doDelete(doc, { startNodeId: null });
    expect(result).toEqual({});
    expect(console.warn).toHaveBeenCalledTimes(1);
    result = doDelete(doc, {});
    expect(result).toEqual({});
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
  test.todo(
    'doDelete - deletes one character somewhere in middle - caret collapsed'
  );
  test.todo('doDelete - deletes one character - selection');
  test.todo('doDelete - deletes selection from beginning');
  test.todo('doDelete - deletes selection through end');
  test.todo('doDelete - deletes a Meta Type node');
});
describe('Document Model -> Delete helper - should merge', () => {
  // is this desired behavior?
  test.todo('doDelete - deletes all content - should merge with TextType');
});
