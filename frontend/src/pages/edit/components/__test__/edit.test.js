import '@testing-library/jest-dom';

import React from 'react';
import { withRouter } from 'react-router';
import { render, fireEvent, screen } from '@testing-library/react';
import * as domHelpers from '../../../../common/dom';
import * as fetchHelpers from '../../../../common/fetch';
import { NEW_POST_URL_ID } from '../../../../common/constants';
import { overrideConsole } from '../../../../common/test-helpers';
import {
  firstNodeContent,
  testPostId,
  testPostWithAllTypesJS
} from '../../../../common/test-post-with-all-types';
import EditPost from '../edit';
import { newPostPlaceholderText } from '../../../../common/components/shared-styled-components';
import { renderWithRouter } from '../../../../common/test-helpers-react';

const { post, contentNodes } = testPostWithAllTypesJS;

jest.mock('../../../../common/dom');
overrideConsole();

const EditPostWithRouter = withRouter(EditPost);

const apiGetSpy = jest.spyOn(fetchHelpers, 'apiGet').mockImplementation(url => {
  if (!url.includes(testPostId)) {
    return { error: 'post not found' };
  }
  return { data: { post, contentNodes } };
});
const getHighlightedSelectionOffsetsSpy = jest
  .spyOn(domHelpers, 'getHighlightedSelectionOffsets')
  .mockImplementation(() => ({}));

describe('Edit - creates a new post', () => {
  test('expects the url to be /edit/new', async done => {
    // manually mock "with session" functionality for now
    renderWithRouter(<EditPostWithRouter params={{ id: NEW_POST_URL_ID }} />);

    // "heading" is the default ARIA role for <h1>, <h2> etc
    // since we're using a pseudo-element ::before for a placeholder, JSDOM can't find by placeholder
    const title = await screen.findByRole('heading');
    expect(title).toBeInTheDocument();
    done();
  });
});

describe('Edit - loads a post from fixture data', () => {
  test('loads post as expected', async done => {
    // manually mock "with session" functionality for now
    renderWithRouter(<EditPostWithRouter params={{ id: testPostId }} />);

    expect(apiGetSpy).toHaveBeenCalledWith(`/edit/${testPostId}`);

    // "heading" is the default ARIA role for <h1>, <h2> etc
    // since we're using a pseudo-element ::before for a placeholder, JSDOM can't find by placeholder
    const title = await screen.findByText(firstNodeContent);
    expect(title).toBeInTheDocument();
    done();
  });
});
