import React from 'react';
import { Map } from 'immutable';
import {
  NODE_TYPE_P,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
  NODE_TYPE_POSTLINK,
  NODE_TYPE_LI,
  NODE_TYPE_PRE, NODE_TYPE_ROOT,
} from '../constants';
import {
  ContentSection,
  CodeSection,
  Ol,
} from './shared-styled-components';
import PostLink from './postlink';
import Quote from './quote';
import Image from './image';
import Spacer from './spacer';
import H2 from './h2';
import H1 from './h1';
import Pre from './pre';
import P from './p';
import Li from './li';
import {
  cleanText,
} from '../utils';
import DocumentModel from '../../pages/edit/document-model';

export default class Document extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  current;
  
  getNextPTags() {
    if (this.current.get('type') !== NODE_TYPE_P) {
      return;
    }
    const children = [];
    while (this.current.get('type') === NODE_TYPE_P) {
      children.push(<P key={this.current.get('id')} node={this.current} />)
      this.next()
    }
    return children;
  }
  
  getNextLiTags() {
    if (this.current.get('type') !== NODE_TYPE_LI) {
      return;
    }
    const children = [];
    while (this.current.get('type') === NODE_TYPE_LI) {
      children.push(<Li key={this.current.get('id')} node={this.current} />)
      this.next()
    }
    return (<Ol>{children}</Ol>);
  }
  
  getContentSectionTags() {
    const children = [];
    let p;
    let li;
    do {
      p = this.getNextPTags()
      li = this.getNextLiTags()
      if (p) {
        children.push(...p)
      }
      if (li) {
        children.push(li)
      }
    } while (p || li);
    return (<ContentSection>{children}</ContentSection>)
  }
  
  getNextPreTags() {
    const children = [];
    while (this.current.get('type') === NODE_TYPE_PRE) {
      children.push(<Pre node={this.current} />)
      this.next()
    }
    return (<CodeSection>{children}</CodeSection>);
  }
  
  next = () => {
    this.current = this.props.nodesById.get(this.current.get('next_sibling_id')) || Map();
  }
  
  render() {
    console.debug("Document RENDER", this);
    const {
      nodesById,
      currentEditNode,
      setEditNodeId,
    } = this.props;
    const children = [];
    this.current = DocumentModel.getFirstNode(nodesById);
    while (this.current.get('id')) {
      const currentType = this.current.get('type');
      if (currentType === NODE_TYPE_P
        || currentType === NODE_TYPE_LI) {
        children.push(this.getContentSectionTags());
        continue; // next() already in correct position
      }
      else if (currentType === NODE_TYPE_PRE) {
        children.push(this.getNextPreTags());
        continue; // next() already in correct position
      } else if (currentType === NODE_TYPE_H1) {
        children.push((
          <H1
            node={this.current}
            shouldShowPlaceholder={
              nodesById.size === 1
              && cleanText(this.current.get('content', '')).length === 0
            }
          />));
      } else if (currentType === NODE_TYPE_H2) {
        children.push(<H2 node={this.current} />);
      } else if (currentType === NODE_TYPE_SPACER) {
        children.push(<Spacer node={this.current} currentEditNode={currentEditNode} setEditNodeId={setEditNodeId} />);
      } else if (currentType === NODE_TYPE_IMAGE) {
        children.push(<Image node={this.current} currentEditNode={currentEditNode} setEditNodeId={setEditNodeId} />)
      } else if (currentType === NODE_TYPE_QUOTE) {
        children.push(<Quote node={this.current} currentEditNode={currentEditNode} setEditNodeId={setEditNodeId} />);
      }
      // TODO: remove this, add post-to-post linking part of a 'smart' A tag, hard-code the next/prev post into the layout?
      else if (currentType === NODE_TYPE_POSTLINK) {
        children.push(<PostLink node={this.current} />);
      } else {
        console.error('Error: Unknown type! ', this.current.get('type'));
      }
      this.next();
    }
    return (
      <div data-type={NODE_TYPE_ROOT}>{children}</div>
    )
  }
}

// opinionated section nodes - can't have children
// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji

