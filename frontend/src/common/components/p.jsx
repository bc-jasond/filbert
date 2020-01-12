import React from 'react';
import FormattedSelections from './formatted-selections';
import { PStyled } from './shared-styled-components';

export default class P extends React.PureComponent {
  render() {
    console.debug('P RENDER', this);
    const {
      props: { node }
    } = this;
    return (
      <PStyled data-type={node.get('type')} name={node.get('id')}>
        <FormattedSelections node={node} />
      </PStyled>
    );
  }
}
