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
  getNode,
} from '../common/blog-content.model';

const Fieldset = styled.fieldset`
  margin-bottom: 8px;
  padding: 16px;
  border: 1px solid grey;
  // margin-left: ${p => p.isLeaf ? '16px' : '0'};
`;
const Legend = styled.legend``;
const H3 = styled.h3`
  display: inline-block;
  font-size: 24px;
`;
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
  visibility: ${p => p.hide ? 'hidden' : 'visible'}
`;
const AddChildContainer = styled.div`
  display: ${p => p.show ? 'static' : 'none'};
`;

const withDebounce = WrappedComponent =>
  class DebouncedGroup extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        timer: null,
        value: props.value,
      }
    }
    
    handleChange = (e) => {
      const { cb, noDebounce } = this.props;
      this.setState({ value: e.currentTarget.value })
      if (noDebounce) {
        cb(e.currentTarget.value);
        return;
      }
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (!cb) return;
        cb(this.state.value)
      }, 1000);
    }
    
    render() {
      const { name, component } = this.props;
      const { value } = this.state;
      return (
        <InputContainer>
          <Label htmlFor={name}>{name}</Label>
          <WrappedComponent name={name} value={value} onChange={this.handleChange} />
        </InputContainer>
      )
    }
  }


const InputGroup = withDebounce(Input);
const TextareaGroup = withDebounce(Textarea);

class Node extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      showAdd: false,
      showAddSibling: false,
      newNodeType: '',
      newNodePosition: 0,
      newSiblingNodeType: '',
    }
  }
  
  // TODO: once I have ids I can remove this and only keep state in the root node, instead of every node
  static getDerivedStateFromProps(props, state) {
    return { ...state, ...props };
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
    const { node } = this.state;
    
    this.setState({ node });
    root.save();
  }
  
  render() {
    const {
      root,
      parentSave,
    } = this.props;
    const {
      node,
      showAdd,
      showAddSibling,
      newNodeType,
      newNodePosition,
      newSiblingNodeType,
    } = this.state;
    
    return (
      <React.Fragment>
        <Fieldset isLeaf={!node.canHaveChildren()}>
          <Legend><H3>{node.type}</H3> (id: {node.id}, child count: {node.childNodes.length},
            parent: {node.parent && node.parent.type})</Legend>
          {/*<InputGroup name="id" value={node.id} readOnly />*/}
          
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
            <Button hide={!node.canHaveChildren()} onClick={() => this.setState({ showAdd: !showAdd })}>➕ Add a
              Child</Button>
            <Button hide={node.type === NODE_TYPE_ROOT}
                    onClick={() => this.setState({ showAddSibling: !showAddSibling })}>➕ Add a Sibling</Button>
            <Button onClick={() => {
              if (confirm('Delete?')) {
                root.delete(node);
              }
            }}>🗑 Delete</Button>
          </InputContainer>
          <AddChildContainer show={node.canHaveChildren() && showAdd}>
            <InputGroup name="child type" value={newNodeType} noDebounce
                        cb={(newValue) => this.setState({ newNodeType: newValue })} />
            <InputGroup name="position" value={newNodePosition} noDebounce
                        cb={(newValue) => this.setState({ newNodePosition: newValue })} />
            <Button onClick={() => {
              const newNode = getNode({ type: newNodeType }, node);
              node.childNodes.splice(0, 0, newNode);
              this.setAndSave();
            }}>Beginning</Button>
            <Button onClick={() => {
              const newNode = getNode({ type: newNodeType }, node);
              node.childNodes.splice(-1, 0, newNode);
              this.setAndSave();
            }}>End</Button>
            <Button onClick={() => {
              const newNode = getNode({ type: newNodeType }, node);
              node.childNodes.splice(newNodePosition, 0, newNode);
              this.setAndSave();
            }}>Add to Position</Button>
          </AddChildContainer>
          <AddChildContainer show={node.type !== NODE_TYPE_ROOT && showAddSibling}>
            <InputGroup name="sibling type" value={newSiblingNodeType} noDebounce
                        cb={(newValue) => this.setState({ newSiblingNodeType: newValue })} />
            <Button onClick={() => {
              const newNode = getNode({ type: newSiblingNodeType }, node.parent);
              const idx = node.parent.childNodes.indexOf(node);
              node.parent.childNodes.splice(idx, 0, newNode);
              parentSave();
            }}>Before</Button>
            <Button onClick={() => {
              const newNode = getNode({ type: newSiblingNodeType }, node.parent);
              const idx = node.parent.childNodes.indexOf(node);
              node.parent.childNodes.splice(idx + 1, 0, newNode);
              parentSave();
            }}>After</Button>
          </AddChildContainer>
        </Fieldset>
        {node.childNodes.map((node, index) => (<Node key={index} node={node} root={root} parentSave={this.setAndSave} />))}
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
      this.setState({ blogPost: this.state.blogPost });
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