import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
import {
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_ROOT,
  NODE_TYPE_SPACER
} from '../constants';
import { CodeSection, ContentSection, Ol } from './shared-styled-components';
import Quote from './quote';
import Image from './image';
import Spacer from './spacer';
import H2 from './h2';
import H1 from './h1';
import Pre from './pre';
import P from './p';
import Li from './li';
import { cleanText } from '../utils';
import DocumentModel from '../../pages/edit/document-model';

const Root = styled.div`
  margin-bottom: 96px;
`;

function getChildIds(children) {
  return children.reduce((acc, c) => `${acc}${c.key}`, '');
}

export default class Document extends React.PureComponent {
  current;

  getNextPTags() {
    if (this.current.get('type') !== NODE_TYPE_P) {
      return null;
    }
    const children = [];
    while (this.current.get('type') === NODE_TYPE_P) {
      children.push(<P key={this.current.get('id')} node={this.current} />);
      this.next();
    }
    return children;
  }

  getNextLiTags() {
    if (this.current.get('type') !== NODE_TYPE_LI) {
      return null;
    }
    const children = [];
    while (this.current.get('type') === NODE_TYPE_LI) {
      children.push(<Li key={this.current.get('id')} node={this.current} />);
      this.next();
    }
    return <Ol key={getChildIds(children)}>{children}</Ol>;
  }

  getContentSectionTags() {
    const children = [];
    let p;
    let li;
    do {
      p = this.getNextPTags();
      li = this.getNextLiTags();
      if (p) {
        children.push(...p);
      }
      if (li) {
        children.push(li);
      }
    } while (p || li);
    return (
      <ContentSection key={getChildIds(children)}>{children}</ContentSection>
    );
  }

  getNextPreTags() {
    const children = [];
    while (this.current.get('type') === NODE_TYPE_PRE) {
      children.push(<Pre key={this.current.get('id')} node={this.current} />);
      this.next();
    }
    return <CodeSection key={getChildIds(children)}>{children}</CodeSection>;
  }

  next = () => {
    this.current =
      this.props?.nodesById?.get?.(this.current.get('next_sibling_id')) ||
      Map();
  };

  render() {
    console.debug('Document RENDER', this);
    const {
      props: { nodesById, currentEditNode = Map(), setEditNodeId }
    } = this;
    const children = [];
    this.current = DocumentModel.getFirstNode(nodesById);
    while (this.current.get('id')) {
      let shouldCallNext = true;
      const currentType = this.current.get('type');
      if (currentType === NODE_TYPE_P || currentType === NODE_TYPE_LI) {
        children.push(this.getContentSectionTags());
        shouldCallNext = false; // next() already in correct position
      } else if (currentType === NODE_TYPE_PRE) {
        children.push(this.getNextPreTags());
        shouldCallNext = false; // next() already in correct position
      } else if (currentType === NODE_TYPE_H1) {
        children.push(
          <H1
            key={this.current.get('id')}
            node={this.current}
            shouldShowPlaceholder={
              nodesById.size === 1 &&
              cleanText(this.current.get('content', '')).length === 0
            }
          />
        );
      } else if (currentType === NODE_TYPE_H2) {
        children.push(<H2 key={this.current.get('id')} node={this.current} />);
      } else if (currentType === NODE_TYPE_SPACER) {
        children.push(
          <Spacer
            key={this.current.get('id')}
            node={this.current}
            isEditing={currentEditNode.get('id') === this.current.get('id')}
            setEditNodeId={setEditNodeId}
          />
        );
      } else if (currentType === NODE_TYPE_IMAGE) {
        children.push(
          <Image
            key={this.current.get('id')}
            node={this.current}
            isEditing={currentEditNode.get('id') === this.current.get('id')}
            setEditNodeId={setEditNodeId}
          />
        );
      } else if (currentType === NODE_TYPE_QUOTE) {
        children.push(
          <Quote
            key={this.current.get('id')}
            node={this.current}
            isEditing={currentEditNode.get('id') === this.current.get('id')}
            setEditNodeId={setEditNodeId}
          />
        );
      } else {
        console.error('Error: Unknown type! ', this.current.get('type'));
      }
      if (shouldCallNext) {
        this.next();
      }
    }
    return <Root data-type={NODE_TYPE_ROOT}>{children}</Root>;
  }
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji
