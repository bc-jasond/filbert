import React from 'react';
import styled from 'styled-components';

import { monospaced } from '../common/fonts.css';

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
  NEW_POST_ID,
} from '../common/constants';
import blogPostFromJson, {
  BlogPost,
  getNodeFromJson,
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
const Button = styled.button`
  cursor: pointer;
  min-height: 36px;
  margin: 8px;
`;
const AddChildContainer = styled.div`
  display: ${p => p.show ? 'static' : 'none'};
`;

const InputGroup = ({ name, value, cb }) => (
  <InputContainer>
    <Label htmlFor={name}>{name}</Label>
    <Input name={name} value={value} onChange={(e) => {
      if (!cb) return;
      cb(e.currentTarget.value)
    }} />
  </InputContainer>
)

const TextareaGroup = ({ name, value, cb }) => (
  <InputContainer>
    <Label htmlFor={name}>{name}</Label>
    <Textarea name={name} value={value} onChange={(e) => {
      if (!cb) return;
      cb(e.currentTarget.value)
    }} />
  </InputContainer>
)


class Node extends React.Component {
  constructor(props) {
    super(props);
    
    this.debounce;
    this.state = {
      showAdd: false,
      newNodeType: '',
      newNodePosition: 0,
    }
  }
  
  // TODO: once I have ids I can remove this and only keep state in the root node, instead of every node
  static getDerivedStateFromProps(props, state) {
    return {...state, ...props};
  }
  
  shouldShowContent() {
    return [
      NODE_TYPE_TEXT,
      NODE_TYPE_CODE,
      NODE_TYPE_LINK,
      NODE_TYPE_A
    ].includes(this.state.node.type);
  }
  
  setAndSave = () => {
    const { root } = this.props;
    const { node, debounce } = this.state;
    
    clearTimeout(debounce);
    this.setState({
      node,
      debounce: setTimeout(() => {
        root.save();
      }, 1000)
    });
  }
  
  render() {
    const { root } = this.props;
    const {
      node,
      showAdd,
      newNodeType,
      newNodePosition,
    } = this.state;
    
    return (
      <React.Fragment>
        <Fieldset>
          <Legend>{node.type} (id: {node.id}, child count: {node.childNodes.length})</Legend>
          <InputGroup name="id" value={node.id} readOnly />
          <InputGroup name="type" value={node.type} readOnly />
          {this.shouldShowContent() && (
            <TextareaGroup name="content" value={node.content} cb={(newValue) => {
              node.content = newValue;
              this.setAndSave();
            }} />
          )}
          {node.type === NODE_TYPE_ROOT && (
            <React.Fragment>
              <InputGroup name="canonical" value={node.canonical} cb={(newValue) => {
                node.canonical = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="tags" value={node.tags} cb={(newValue) => {
                node.tags = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="publishedDate" value={node.publishedDate} cb={(newValue) => {
                node.publishedDate = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="author" value={node.author} cb={(newValue) => {
                node.author = newValue;
                this.setAndSave();
              }} />
            </React.Fragment>
          )}
          {node.type === NODE_TYPE_SECTION_CODE && (
            <InputGroup name="lines" value={node.lines} cb={(newValue) => {
              node.lines = newValue;
              this.setAndSave();
            }} />
          )}
          {node.type === NODE_TYPE_SECTION_IMAGE && (
            <React.Fragment>
              <InputGroup name="width" value={node.width} cb={(newValue) => {
                node.width = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="height" value={node.height} cb={(newValue) => {
                node.height = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="url" value={node.url} cb={(newValue) => {
                node.url = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="caption" value={node.caption} cb={(newValue) => {
                node.caption = newValue;
                this.setAndSave();
              }} />
            </React.Fragment>
          )}
          {node.type === NODE_TYPE_SECTION_QUOTE && (
            <React.Fragment>
              <InputGroup name="quote" value={node.quote} cb={(newValue) => {
                node.quote = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="author" value={node.author} cb={(newValue) => {
                node.author = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="url" value={node.url} cb={(newValue) => {
                node.url = newValue;
                this.setAndSave();
              }} />
              <InputGroup name="context" value={node.context} cb={(newValue) => {
                node.context = newValue;
                this.setAndSave();
              }} />
            </React.Fragment>
          )}
          {node.type === NODE_TYPE_SECTION_POSTLINK && (
            <InputGroup name="to" value={node.to} cb={(newValue) => {
              node.to = newValue;
              this.setAndSave();
            }} />
          )}
          <InputContainer>
            <Button>Move Up</Button>
            <Button>Move Down</Button>
            <Button onClick={() => this.setState({showAdd: !showAdd})}>➕ Add a Child</Button>
            <Button onClick={() => {
              if (confirm('Delete?')) {
                root.delete(node);
              }
            }}>🗑 Delete</Button>
          </InputContainer>
          <AddChildContainer show={showAdd}>
            <InputGroup name="type" value={newNodeType} cb={(newValue) => this.setState({newNodeType: newValue})}/>
            <InputGroup name="position" value={newNodePosition} cb={(newValue) => this.setState({newNodePosition: newValue})}/>
            <Button onClick={() => {
              const newNode = getNodeFromJson({type: newNodeType});
              node.childNodes.splice(newNodePosition, 0, newNode);
              this.setAndSave();
            }}>Add</Button>
          </AddChildContainer>
        </Fieldset>
        {node.childNodes.map((node, index) => (<Node key={index} node={node} root={root} />))}
      </React.Fragment>
    );
  }
}

const JsonContainer = styled.div`
  font-family: ${monospaced};
  font-size: 12px;
  display: ${p => p.show ? 'static' : 'none'};
  position: absolute;
  top: 100px;
  left: 0;
  margin: 24px;
`;
const EditorContainer = styled.div`
  display: ${p => p.hide ? 'none' : 'static'};
  padding: 24px;
`;
const BlogPostActions = styled.div`
  position: fixed;
  right: 0;
  padding: 32px;
  z-index: 1;
`;

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    
    const currentPostData = JSON.parse(localStorage.getItem(NEW_POST_ID));
    this.state = {
      showJson: false,
      blogPost: currentPostData ? blogPostFromJson(currentPostData) : new BlogPost(NEW_POST_ID),
    };
  }
  
  delete = (node) => {
    const nodeStack = [this.state.blogPost];
    let didDelete = false;
    
    while (nodeStack.length) {
      const current = nodeStack.pop();
      if (current.deleteChildNode(node)) {
        didDelete = true;
        break;
      } else if (current.childNodes.length) {
        nodeStack.push(...current.childNodes);
      }
    }
    
    if (didDelete) {
      this.save();
      this.setState({blogPost: this.state.blogPost});
    }
  }
  
  save = () => {
    localStorage.setItem(NEW_POST_ID, JSON.stringify(this.state.blogPost))
  }
  
  render() {
    const {
      showJson,
      blogPost
    } = this.state;
    
    return (
      <React.Fragment>
        <BlogPostActions>
          <Button onClick={() => {
            if (!showJson) {
              window.getSelection().selectAllChildren(window.document.getElementById('json-container'));
            }
            this.setState({ showJson: !showJson });
          }}>JSON</Button>
          <Button onClick={this.save}>Save</Button>
          <Button onClick={() => {
            if (confirm('New Post?')) {
              localStorage.setItem(`${NEW_POST_ID}.BAK`, localStorage.getItem(NEW_POST_ID));
              localStorage.removeItem(NEW_POST_ID);
              this.setState({ blogPost: new BlogPost(NEW_POST_ID) })
            }
          }}>New</Button>
          <Button onClick={() => {
            if (confirm('Restore?')) {
              localStorage.setItem(NEW_POST_ID, localStorage.getItem(`${NEW_POST_ID}.BAK`));
              const data = JSON.parse(localStorage.getItem(NEW_POST_ID));
              this.setState({ blogPost: blogPostFromJson(data) })
            }
          }}>Restore</Button>
        </BlogPostActions>
        <JsonContainer id="json-container" show={showJson}>{JSON.stringify(blogPost)}</JsonContainer>
        <EditorContainer hide={showJson}>
          <Node node={blogPost} root={this} />
        </EditorContainer>
      </React.Fragment>
    );
  }
}