import React from 'react';
import FormattedSelections from './formatted-selections';
import { LiStyled } from './shared-styled-components';

export default class Li extends React.PureComponent {
  render() {
    console.debug('Li RENDER', this);
    const {
      props: { node },
    } = this;
    return (
      <LiStyled data-type={node.get('type')} name={node.get('id')}>
        <FormattedSelections node={node} />
      </LiStyled>
    );
  }
}
