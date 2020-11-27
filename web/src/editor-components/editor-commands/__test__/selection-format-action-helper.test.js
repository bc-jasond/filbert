import {
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_LINK_URL,
} from '../../../common/constants';
import { overrideConsole } from '../../../common/test-helpers';
import { Selection } from '../../../common/utils';
import DocumentModel from '@filbert/document/document-model';
import { doFormatSelection } from '../format-selection';

import * as selectionHelpers from '../../../../../lib/selection/selection-helpers';
import {
  formattedPId,
  testPostWithAllTypesJS,
} from '../../../common/test-post-with-all-types';

const { post, contentNodes } = testPostWithAllTypesJS;
overrideConsole();
let doc = DocumentModel();

beforeEach(() => {
  doc = DocumentModel(post.id, contentNodes);
});
describe('Document Model -> selection-format-action node helper', () => {
  test('selectionFormatAction - assumes valid input', () => {});
  test.skip('selectionFormatAction - action is SELECTION_ACTION_H1', () => {
    //converts to H1
    const result = doFormatSelection(
      doc,
      doc.getNode(formattedPId),
      Selection(),
      0,
      SELECTION_ACTION_H1
    );
    expect(result).toMatchSnapshot();
    // converts back to P
    expect(
      doFormatSelection(
        doc,
        result.updatedNode,
        Selection(),
        0,
        SELECTION_ACTION_H1
      )
    ).toMatchSnapshot();
  });
  test.skip('selectionFormatAction - action is SELECTION_ACTION_H2', () => {
    //converts to H2
    const result = doFormatSelection(
      doc,
      doc.getNode(formattedPId),
      Selection(),
      0,
      SELECTION_ACTION_H2
    );
    expect(result).toMatchSnapshot();
    // converts back to P
    expect(
      doFormatSelection(
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
    let result = doFormatSelection(
      doc,
      doc.getNode(formattedPId),
      Selection({ [SELECTION_ACTION_ITALIC]: true }),
      0,
      SELECTION_ACTION_SITEINFO
    );
    expect(result.updatedSelection.get(SELECTION_ACTION_ITALIC)).toBeFalsy();
    // can't be both italic and siteinfo
    result = doFormatSelection(
      doc,
      doc.getNode(formattedPId),
      Selection({ [SELECTION_ACTION_SITEINFO]: true }),
      0,
      SELECTION_ACTION_ITALIC
    );
    expect(result.updatedSelection.get(SELECTION_ACTION_SITEINFO)).toBeFalsy();
    // clears link url if not a link
    result = doFormatSelection(
      doc,
      doc.getNode(formattedPId),
      Selection({
        [SELECTION_ACTION_LINK]: true,
        [SELECTION_LINK_URL]: 'http://foo.bar',
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
