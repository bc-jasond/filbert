import '@testing-library/jest-dom';

import React from 'react';
import { withRouter } from 'react-router';
import { render, fireEvent, screen } from '@testing-library/react';
import * as domHelpers from '../../../../common/dom';
import { NEW_POST_URL_ID } from '../../../../common/constants';
import EditPost from '../edit';
import { newPostPlaceholderText } from '../../../../common/components/shared-styled-components';
import { renderWithRouter } from '../../../../common/test-helpers-react';

jest.mock('../../../../common/dom');

const EditPostWithRouter = withRouter(EditPost);

describe('Edit - creates a new post', () => {
  test('expects the url to be /edit/new', async done => {
    // manually mock React Router because it's not that big of a deal
    renderWithRouter(<EditPostWithRouter params={{ id: NEW_POST_URL_ID }} />);

    // query* functions will return the element or null if it cannot be found
    // get* functions will return the element or throw an error if it cannot be found
    const title = await screen.findByPlaceholderText(newPostPlaceholderText);
    expect(title).toBeInTheDocument();
    done();
    // // the queries can accept a regex to make your selectors more resilient to content tweaks and changes.
    // fireEvent.click(screen.getByLabelText(/show/i));
    //
    // // .toBeInTheDocument() is an assertion that comes from jest-dom
    // // otherwise you could use .toBeDefined()
    // expect(screen.getByText(testMessage)).toBeInTheDocument();
  });
});
