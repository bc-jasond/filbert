import React from 'react';
import { getFormattedSelections } from './render-helpers';
import { LiStyled } from './shared-styled-components';

export default class Li extends React.PureComponent {
  render() {
    console.debug("Li RENDER", this);
    const { node } = this.props;
    return (
      <LiStyled data-type={node.get('type')} name={node.get('id')}>
        {getFormattedSelections(node)}
      </LiStyled>
    )
  }
}
