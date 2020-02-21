/* eslint-disable import/prefer-default-export */
import { List } from 'immutable';
import React from 'react';
import { getContentBySelections } from '../../pages/edit/selection-helpers';
import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_NEXT
} from '../constants';
import { cleanTextOrZeroLengthPlaceholder } from '../utils';
import {
  A,
  BoldText,
  Code,
  ItalicText,
  MiniText,
  SiteInfo,
  StrikeText
} from './shared-styled-components';

export default class FormattedSelections extends React.PureComponent {
  render() {
    console.debug('FORMATTED SELECTIONS render()', this);
    const {
      props: { node }
    } = this;
    let children = [];
    let didError = false;
    let selection = node.getIn(['meta', 'selections'], Selection());
    const contentPiecesBySelectionLength = getContentBySelections(node);
    let idx = 0;
    try {
      while (selection) {
        // re-render all selections if any one changes
        const key = selection.hashCode();
        let selectionJsx = contentPiecesBySelectionLength[idx];

        if (selection.get(SELECTION_ACTION_STRIKETHROUGH)) {
          selectionJsx = <StrikeText key={key}>{selectionJsx}</StrikeText>;
        }
        if (selection.get(SELECTION_ACTION_SITEINFO)) {
          selectionJsx = <SiteInfo key={key}>{selectionJsx}</SiteInfo>;
        }
        if (selection.get(SELECTION_ACTION_MINI)) {
          selectionJsx = <MiniText key={key}>{selectionJsx}</MiniText>;
        }
        if (selection.get(SELECTION_ACTION_ITALIC)) {
          selectionJsx = <ItalicText key={key}>{selectionJsx}</ItalicText>;
        }
        if (selection.get(SELECTION_ACTION_CODE)) {
          selectionJsx = <Code key={key}>{selectionJsx}</Code>;
        }
        if (selection.get(SELECTION_ACTION_BOLD)) {
          selectionJsx = <BoldText key={key}>{selectionJsx}</BoldText>;
        }
        if (selection.get(SELECTION_ACTION_LINK)) {
          selectionJsx = (
            <A key={key} href={selection.get('linkUrl')}>
              {selectionJsx}
            </A>
          );
        }
        children.push(selectionJsx);
        selection = selection.get(SELECTION_NEXT);
        idx += 1;
      }
    } catch (err) {
      console.warn(err);
      // selections got corrupt, just display unformatted text
      didError = true;
    }
    // if there's an error, show unformatted content
    if (didError) {
      children = [cleanTextOrZeroLengthPlaceholder(node.get('content'))];
    }
    return <>{children}</>;
  }
}
