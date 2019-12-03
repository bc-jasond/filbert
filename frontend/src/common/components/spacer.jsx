import React from 'react';
import { NODE_TYPE_SPACER } from '../constants';
import { SpacerSection } from './shared-styled-components';

export default class Spacer extends React.PureComponent {
  render() {
    console.debug("Spacer RENDER", this);
    const {
      node,
      isEditing,
    } = this.props;
    return (
      <SpacerSection data-type={NODE_TYPE_SPACER} name={node.get('id')}
                     isEditing={isEditing}
                     onClick={() => isEditing && isEditing(id)} contentEditable={false} />
    )
  }
}