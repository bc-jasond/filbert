import React from 'react';
import { getFormattedSelections } from './render-helpers';
import { PStyled } from './shared-styled-components';

export default class P extends React.PureComponent {
  render() {
    console.debug("P RENDER", this);
    const { node } = this.props;
    return (
      <PStyled data-type={node.get('type')} name={node.get('id')}>
        {getFormattedSelections(node)}
      </PStyled>
    )
  }
}
