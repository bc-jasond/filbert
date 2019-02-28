import React from 'react';
import styled from 'styled-components';

import {
  NODE_TYPE_TEXT,
  NODE_TYPE_CODE,
  NODE_TYPE_LINK,
  NODE_TYPE_A,
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_POSTLINK,
} from '../common/constants';
import blogPostFromJson, {
  BlogPost,
} from '../common/blog-content.model';

const Fieldset = styled.fieldset`
  margin-bottom: 8px;
  padding: 16px;
  border: 1px solid grey;
`;
const Legend = styled.legend``;
const InputContainer = styled.div`
  margin-bottom: 8px;
`;
const Label = styled.label`
  margin-right: 8px;
`;
const Input = styled.input``;
const Textarea = styled.textarea`
  width: 100%
`;
const Button = styled.button``;

const InputGroup = ({ name, value }) => (
  <InputContainer>
    <Label htmlFor={name}>{name}</Label>
    <Input name={name} value={value} />
  </InputContainer>
)

const TextareaGroup = ({ name, value }) => (
  <InputContainer>
    <Label htmlFor={name}>{name}</Label>
    <Textarea name={name} value={value} />
  </InputContainer>
)


const Node = ({ node }) => {
  function shouldShowContent() {
    return [
      NODE_TYPE_TEXT,
      NODE_TYPE_CODE,
      NODE_TYPE_LINK,
      NODE_TYPE_A
    ].includes(node.type);
  }
  
  return (
    <React.Fragment>
      <Fieldset>
        <Legend>{node.type} (id: {node.id}, child count: {node.childNodes.length})</Legend>
        <InputGroup name="id" value={node.id} />
        <InputGroup name="type" value={node.type} />
        {shouldShowContent() && (
          <TextareaGroup name="content" value={node.content} />
        )}
        {node.type === NODE_TYPE_ROOT && (
          <React.Fragment>
            <InputGroup name="canonical" value={node.canonical} />
            <InputGroup name="tags" value={node.tags} />
            <InputGroup name="publishedDate" value={node.publishedDate} />
            <InputGroup name="author" value={node.author} />
          </React.Fragment>
        )}
        {node.type === NODE_TYPE_SECTION_CODE && (
          <InputGroup name="lines" value={node.lines} />
        )}
        {node.type === NODE_TYPE_SECTION_IMAGE && (
          <React.Fragment>
            <InputGroup name="width" value={node.width} />
            <InputGroup name="height" value={node.height} />
            <InputGroup name="url" value={node.url} />
            <InputGroup name="caption" value={node.caption} />
          </React.Fragment>
        )}
        {node.type === NODE_TYPE_SECTION_QUOTE && (
          <React.Fragment>
            <InputGroup name="quote" value={node.quote} />
            <InputGroup name="author" value={node.author} />
            <InputGroup name="url" value={node.url} />
            <InputGroup name="context" value={node.context} />
          </React.Fragment>
        )}
        {node.type === NODE_TYPE_SECTION_POSTLINK && (
          <InputGroup name="to" value={node.to} />
        )}
        <InputContainer>
          <Button>Move Up</Button>
          <Button>Move Down</Button>
          <Button>➕ Add a Child</Button>
        </InputContainer>
      </Fieldset>
      {node.childNodes.map(node => (<Node node={node} />))}
    </React.Fragment>
  );
}

const EditorContainer = styled.div`
  padding: 24px;
`;

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    const newPostId = 'dubaniewicz-new-post';
    const currentPostData = JSON.parse(localStorage.getItem(newPostId));
    this.state = {
      blogPost: currentPostData ? blogPostFromJson(currentPostData) : new BlogPost(newPostId),
    };
  }
  
  render() {
    const {
      blogPost
    } = this.state;
    
    return (
      <EditorContainer>
        <Node node={blogPost} />
      </EditorContainer>
    );
  }
}