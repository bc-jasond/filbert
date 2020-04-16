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
  NODE_TYPE_SPACER,
} from '../constants';
import {
  CodeSectionStyled,
  ContentSectionStyled,
  Ol,
} from './shared-styled-components';
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

export default React.memo(
  ({ nodesById, currentEditNode = Map(), setEditNodeId = () => {} }) => {
    let current = DocumentModel.getFirstNode(nodesById);

    function next() {
      current = nodesById?.get?.(current.get('next_sibling_id')) || Map();
    }

    function getParagraphs() {
      if (current.get('type') !== NODE_TYPE_P) {
        return null;
      }
      const paragraphs = [];
      while (current.get('type') === NODE_TYPE_P) {
        paragraphs.push(<P key={current.get('id')} node={current} />);
        next();
      }
      return paragraphs;
    }

    function getOrderedList() {
      if (current.get('type') !== NODE_TYPE_LI) {
        return null;
      }
      const listItems = [];
      while (current.get('type') === NODE_TYPE_LI) {
        listItems.push(<Li key={current.get('id')} node={current} />);
        next();
      }
      return <Ol key={getChildIds(listItems)}>{listItems}</Ol>;
    }

    function getContentSection() {
      const contentNodes = [];
      let p;
      let li;
      do {
        p = getParagraphs();
        li = getOrderedList();
        if (p) {
          contentNodes.push(...p);
        }
        if (li) {
          contentNodes.push(li);
        }
      } while (p || li);
      return (
        <ContentSectionStyled key={getChildIds(contentNodes)}>
          {contentNodes}
        </ContentSectionStyled>
      );
    }

    function getCodeSection() {
      const preNodes = [];
      while (current.get('type') === NODE_TYPE_PRE) {
        preNodes.push(<Pre key={current.get('id')} node={current} />);
        next();
      }
      return (
        <CodeSectionStyled key={getChildIds(preNodes)}>
          {preNodes}
        </CodeSectionStyled>
      );
    }
    const children = [];
    while (current.get('id')) {
      let shouldCallNext = true;
      const currentType = current.get('type');
      if (currentType === NODE_TYPE_P || currentType === NODE_TYPE_LI) {
        children.push(getContentSection());
        shouldCallNext = false; // next() already in correct position
      } else if (currentType === NODE_TYPE_PRE) {
        children.push(getCodeSection());
        shouldCallNext = false; // next() already in correct position
      } else if (currentType === NODE_TYPE_H1) {
        children.push(
          <H1
            key={current.get('id')}
            node={current}
            shouldShowPlaceholder={
              nodesById.size === 1 &&
              cleanText(current.get('content', '')).length === 0
            }
          />
        );
      } else if (currentType === NODE_TYPE_H2) {
        children.push(<H2 key={current.get('id')} node={current} />);
      } else if (currentType === NODE_TYPE_SPACER) {
        children.push(
          <Spacer
            key={current.get('id')}
            node={current}
            isEditing={currentEditNode.get('id') === current.get('id')}
            setEditNodeId={setEditNodeId}
          />
        );
      } else if (currentType === NODE_TYPE_IMAGE) {
        children.push(
          <Image
            key={current.get('id')}
            node={current}
            isEditing={currentEditNode.get('id') === current.get('id')}
            setEditNodeId={setEditNodeId}
          />
        );
      } else if (currentType === NODE_TYPE_QUOTE) {
        children.push(
          <Quote
            key={current.get('id')}
            node={current}
            isEditing={currentEditNode.get('id') === current.get('id')}
            setEditNodeId={setEditNodeId}
          />
        );
      } else {
        console.error('Error: Unknown type! ', current.get('type'));
      }
      if (shouldCallNext) {
        next();
      }
    }
    return <Root data-type={NODE_TYPE_ROOT}>{children}</Root>;
  }
);

// these could be interesting in the editor 'add' menu but, they're currently supported with existing node types
// export const Gotcha = {} // facepalm emoji
// export const Tangent = {} // horse emoji
// export const Shrug = {} // shrug emoji
