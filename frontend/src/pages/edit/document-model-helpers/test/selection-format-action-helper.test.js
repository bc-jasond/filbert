import {
  NODE_TYPE_H1,
  NODE_TYPE_P,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LINK_URL
} from '../../../../common/constants';
import { overrideConsole } from '../../../../common/test-helpers';
import { Selection } from '../../../../common/utils';
import DocumentModel from '../../document-model';
import { selectionFormatAction } from '../selection-format-action';

import * as selectionHelpers from '../../selection-helpers';
import {
  formattedPId,
  testPostWithAllTypesJS
} from '../../test/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
const doc = new DocumentModel();

beforeEach(() => {
  doc.init(post, { stageNodeUpdate: jest.fn() }, contentNodes);
});
describe('Document Model -> selection-format-action node helper', () => {
  test('selectionFormatAction - assumes valid input', () => {});
  test('selectionFormatAction - action is SELECTION_ACTION_H1', () => {
    //converts to H1
    const result = selectionFormatAction(
      doc,
      doc.getNode(formattedPId),
      Selection(),
      0,
      SELECTION_ACTION_H1
    );
    expect(result).toMatchSnapshot();
    // converts back to P
    expect(
      selectionFormatAction(
        doc,
        result.updatedNode,
        Selection(),
        0,
        SELECTION_ACTION_H1
      )
    ).toMatchSnapshot();
  });
  test('selectionFormatAction - action is SELECTION_ACTION_H2', () => {
    //converts to H2
    const result = selectionFormatAction(
      doc,
      doc.getNode(formattedPId),
      Selection(),
      0,
      SELECTION_ACTION_H2
    );
    expect(result).toMatchSnapshot();
    // converts back to P
    expect(
      selectionFormatAction(
        doc,
        result.updatedNode,
        Selection(),
        0,
        SELECTION_ACTION_H2
      )
    ).toMatchSnapshot();
  });
  test('selectionFormatAction - enforces formatting invariants', () => {
    const spy = jest
      .spyOn(selectionHelpers, 'replaceSelection')
      .mockImplementation((...args) => args[0]);
    // can't be both siteinfo and italic
    let result = selectionFormatAction(
      doc,
      doc.getNode(formattedPId),
      Selection({ [SELECTION_ACTION_ITALIC]: true }),
      0,
      SELECTION_ACTION_SITEINFO
    );
    expect(result.updatedSelection.get(SELECTION_ACTION_ITALIC)).toBeFalsy();
    // can't be both italic and siteinfo
    result = selectionFormatAction(
      doc,
      doc.getNode(formattedPId),
      Selection({ [SELECTION_ACTION_SITEINFO]: true }),
      0,
      SELECTION_ACTION_ITALIC
    );
    expect(result.updatedSelection.get(SELECTION_ACTION_SITEINFO)).toBeFalsy();
    // clears link url if not a link
    result = selectionFormatAction(
      doc,
      doc.getNode(formattedPId),
      Selection({
        [SELECTION_ACTION_LINK]: true,
        [SELECTION_LINK_URL]: 'http://foo.bar'
      }),
      0,
      SELECTION_ACTION_LINK
    );
    expect(result.updatedSelection.get(SELECTION_ACTION_LINK)).toBeFalsy();
    expect(result.updatedSelection.get(SELECTION_LINK_URL)).toBeFalsy();
    expect(spy).toHaveBeenCalledTimes(3);
  });
  test('selectionFormatAction - if SELECTION_ACTION_ITALIC unselects SELECTION_ACTION_SITEINFO', () => {});
});
