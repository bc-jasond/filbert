import {
  BlogPost, NodeA,
  NodeCode,
  NodeCodeSection,
  NodeContent,
  NodeH1,
  NodeH2, NodeImage, NodeItalic, NodeLi, NodeLink, NodeOl, NodeP, NodePostLink, NodeQuote, NodeSiteInfo,
  NodeSpacer, NodeStrike,
  NodeText
} from './blog-content.model.mjs';
import {
  NODE_TYPE_A,
  NODE_TYPE_CODE,
  NODE_TYPE_ITALIC,
  NODE_TYPE_LI,
  NODE_TYPE_LINK,
  NODE_TYPE_OL,
  NODE_TYPE_P,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_POSTLINK,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_SITEINFO,
  NODE_TYPE_STRIKE,
} from './constants.mjs';

import fs from 'fs';

// trim lines before and after blog 'sections' - we don't need those
function trimLine(line) {
  const middle = line.split('React.Fragment>');
  return middle[1];
}

// split a line on Tags & content (NodeText)
function tokenize(line) {
  const tokens = [];
  let token = '';
  for (let i = 0; i < line.length; i++) {
    const currentChar = line[i];
    // skip JSX interpolation
    if ((currentChar === "'" && line[i + 1] === '}')
      || (currentChar === '{' && line[i + 1] === "'")) {
      i++;
      continue;
    }
    if (currentChar === '<') {
      tokens.push(token);
      token = currentChar;
    } else if (currentChar === '>') {
      tokens.push(`${token}${currentChar}`);
      token = ''
    } else {
      token = `${token}${currentChar}`;
    }
  }
  return tokens.filter(token => token.trim().length);
}

function isTag(token) {
  return token[0] === '<' && token[token.length - 1] === '>';
}

function isClosingTag(token) {
  return isTag(token) && (token[1] === '/' || token[token.length - 2] === '/');
}

function getComponentFromToken(token, head) {
  const lower = token.toLowerCase();
  if (!isTag(token)) {
    if (head.type === NODE_TYPE_CODE) {
      head.content = token;
      return;
    }
    return new NodeText(token);
  }
  if (lower.includes(NODE_TYPE_SECTION_H1))
    return new NodeH1();
  if (lower.includes(NODE_TYPE_SECTION_H2))
    return new NodeH2();
  if (lower.includes(NODE_TYPE_SECTION_SPACER))
    return new NodeSpacer();
  if (lower.includes(NODE_TYPE_SECTION_CONTENT))
    return new NodeContent();
  if (lower.includes(NODE_TYPE_SECTION_CODE)) {
    // get all Pre tags -> lines, strip any {' or '}`
    return new NodeCodeSection([]);
  }
  if (lower.includes(NODE_TYPE_CODE)) {
    // get next token from tail and pass as `content`
    return new NodeCode('');
  }
  /*if (lower.includes(NODE_TYPE_SECTION_QUOTE))
    return new NodeQuote(quote, author, url, context);
  if (lower.includes(NODE_TYPE_SECTION_POSTLINK))
    return new NodePostLink(to, content);*/
  if ((lower.includes(`<${NODE_TYPE_P}`) || lower.includes(`</${NODE_TYPE_P}`)) && lower.length <= 4)
    return new NodeP();
  if (lower.includes(NODE_TYPE_OL) && lower.length <= 5)
    return new NodeOl();
  if (lower.includes(NODE_TYPE_LI) && lower.length <= 5)
    return new NodeLi();
  if (lower.includes(NODE_TYPE_LINK)) {
    // grab the `to` prop and pass as `content`
    let to;
    if (!isClosingTag(lower)) {
      to = token.split('="')[1].split('"')[0];
    }
    return new NodeLink([], to);
  }
  if (lower.includes(`<${NODE_TYPE_A}`) || lower.includes(`</${NODE_TYPE_A}`)) {
    // grab the `href` prop and pass as `content`
    let href;
    if (!isClosingTag(lower)) {
      href = token.split('="')[1].split('"')[0];
    }
    return new NodeA([], href);
  }
  if (lower.includes(NODE_TYPE_SITEINFO))
    return new NodeSiteInfo();
  if (lower.includes(NODE_TYPE_STRIKE))
    return new NodeStrike();
  if (lower.includes(NODE_TYPE_ITALIC))
    return new NodeItalic();
  if (lower.includes(NODE_TYPE_SECTION_IMAGE)) {
    // get all these 4 pieces of data from future nodes
    return new NodeImage(0, 0, '', '');
  }

  // throw new Error(`JSX Parse Error: ¯\\_(ツ)_/¯ Unknown Token Type: ${token}`);
}

fs.readFile('./src/pages/post-nginx.jsx', (err, data) => {
  if (err) throw err;
  let oneLine = data.toString().split('\n').join('');
  oneLine = trimLine(oneLine);
  const tokenizedLine = tokenize(oneLine);
  const blogPost = new BlogPost('display-images');
  const tagStack = [blogPost];

  tokenizedLine.forEach(token => {
    const head = tagStack[0];
    // custom behavior for code sections
    if (head.type === NODE_TYPE_SECTION_CODE) {
      if (token.includes('Pre')) return;
      if (token.includes('CodeSection')) {
        tagStack.shift();
        tagStack[0].childNodes.push(head);
        return;
      }
      tagStack[0].lines.push(token);
      return;
    }
    // end code sections
    const node = getComponentFromToken(token, head);
    if (!node) return;
    if (isClosingTag(token)) {
      if (tagStack.length === 1) {
        // at the root, must be a self-closing tag
        head.childNodes.push(node);
      } else {
        tagStack.shift();
        tagStack[0].childNodes.push(head);
      }
    } else if (isTag(token)) {
      tagStack.unshift(node);
    } else {
      // it's a `text` node, add to open node's childNodes
      head.childNodes.push(node);
    }
  })
  const raw = blogPost.toJson();
  const jsonString = JSON.stringify(raw, null, 2);
  jsonString;
});
