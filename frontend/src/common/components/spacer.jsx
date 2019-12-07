import React from 'react';
import { NODE_TYPE_SPACER } from '../constants';
import { SpacerSection } from './shared-styled-components';

export default class Spacer extends React.PureComponent {
  render() {
    console.debug("Spacer RENDER", this);
    const {
      node,
      isEditing,
      setEditNodeId,
    } = this.props;
    const id = node.get('id');
    return (
      <SpacerSection data-type={NODE_TYPE_SPACER} name={id}
                     isEditMode={setEditNodeId}
                     isEditing={isEditing}
                     onClick={() => setEditNodeId && setEditNodeId(id)} />
    )
  }
}