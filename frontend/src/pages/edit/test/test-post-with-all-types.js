import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH
} from '../../../common/constants';
import { makeSelections } from '../../../common/test-helpers';

export const firstNodeIdH1 = '8e34';
export const firstNodeContent = 'Large Heading';
export const h2PrevId = 'db70';
export const h2Id = '9615';
export const h2Content = 'Small Heading';
export const preId = 'fd25';
export const pre2Id = '43eb'; // this points to img
export const imgId = '4add';
export const formattedPId = 'f677';
export const formattedPContent = 'Second paragraph with some formats';
export const formattedLiId = '151c';
export const formattedLiContent = 'One with a bunch of formats and stuff';

export const testPostWithAllTypesJS = {
  post: {
    id: 175,
    user_id: 1,
    canonical: 'large-heading-0044',
    title: 'Large Heading',
    abstract: null,
    created: '2019-12-05T07:46:51.000Z',
    updated: '2019-12-05T07:46:51.000Z',
    published: null,
    deleted: null
  },
  contentNodes: {
    [h2Id]: {
      post_id: 175,
      id: h2Id,
      next_sibling_id: '56da',
      type: 'h2',
      content: h2Content,
      meta: {}
    },
    [preId]: {
      post_id: 175,
      id: preId,
      next_sibling_id: 'f063',
      type: 'pre',
      content: 'var someCode = "here";',
      meta: {}
    },
    f063: {
      post_id: 175,
      id: 'f063',
      next_sibling_id: '61cf',
      type: 'pre',
      content: 'function getIt(sendIt) {',
      meta: {}
    },
    [imgId]: {
      post_id: 175,
      id: imgId,
      next_sibling_id: '09a0',
      type: 'image',
      content: '',
      meta: {
        url: 'b38d29e7bbd96a4df4d7ac1fa442de358702b1635319c696f27c23c2bcc9d70d',
        width: 669,
        height: 1000,
        caption: "Kinzua Dam '91",
        rotationDegrees: 90
      }
    },
    cce3: {
      post_id: 175,
      id: 'cce3',
      next_sibling_id: null,
      type: 'p',
      content: 'Make sure we have a P on the end so we can delete',
      meta: {}
    },
    [firstNodeIdH1]: {
      post_id: 175,
      id: firstNodeIdH1,
      next_sibling_id: '621e',
      type: 'h1',
      content: firstNodeContent,
      meta: {}
    },
    '7a38': {
      post_id: 175,
      id: '7a38',
      next_sibling_id: pre2Id,
      type: 'pre',
      content: '}',
      meta: {}
    },
    '621e': {
      post_id: 175,
      id: '621e',
      next_sibling_id: formattedPId,
      type: 'p',
      content: 'First paragraph with no formats',
      meta: {}
    },
    [formattedPId]: {
      post_id: 175,
      id: formattedPId,
      next_sibling_id: 'db70',
      type: 'p',
      content: formattedPContent,
      meta: {
        selections: makeSelections([
          [17],
          [4, SELECTION_ACTION_BOLD],
          [1],
          [4, SELECTION_ACTION_CODE],
          [1],
          [
            ,
            SELECTION_ACTION_LINK,
            { key: 'linkUrl', value: 'http://some.site' }
          ]
        ]).toJS()
      }
    },
    [formattedLiId]: {
      post_id: 175,
      id: formattedLiId,
      next_sibling_id: preId,
      type: 'li',
      content: formattedLiContent,
      meta: {
        selections: makeSelections([
          [4],
          [4, SELECTION_ACTION_BOLD],
          [1],
          [1, SELECTION_ACTION_ITALIC],
          [1],
          [5, SELECTION_ACTION_CODE],
          [1],
          [2, SELECTION_ACTION_SITEINFO],
          [1],
          [7, SELECTION_ACTION_STRIKETHROUGH],
          [5],
          [, SELECTION_ACTION_LINK, { key: 'linkUrl', value: 'http://yep.com' }]
        ]).toJS()
      }
    },
    [h2PrevId]: {
      post_id: 175,
      id: h2PrevId,
      next_sibling_id: h2Id,
      type: 'spacer',
      content: '',
      meta: {}
    },
    '09a0': {
      post_id: 175,
      id: '09a0',
      next_sibling_id: 'c67c',
      type: 'h2',
      content: "Here's a big quote",
      meta: {}
    },
    [pre2Id]: {
      post_id: 175,
      id: pre2Id,
      next_sibling_id: imgId,
      type: 'pre',
      content: 'getIt();',
      meta: {}
    },
    '9fa0': {
      post_id: 175,
      id: '9fa0',
      next_sibling_id: formattedLiId,
      type: 'li',
      content: 'Another item here',
      meta: {}
    },
    '61cf': {
      post_id: 175,
      id: '61cf',
      next_sibling_id: '7a38',
      type: 'pre',
      content: '  const yep = false;',
      meta: {}
    },
    '56da': {
      post_id: 175,
      id: '56da',
      next_sibling_id: '9fa0',
      type: 'li',
      content: "Here's a list",
      meta: {}
    },
    c67c: {
      post_id: 175,
      id: 'c67c',
      next_sibling_id: 'cce3',
      type: 'quote',
      content: '',
      meta: {
        url:
          'https://www.theguardian.com/theguardian/2007/sep/13/greatinterviews',
        quote:
          "It's an attempt to bring the figurative thing up on to the nervous system more violently and more poignantly.",
        author: 'Frances Bacon',
        context: 'interviews with David Sylvester in 1963, 1966 and 1979'
      }
    }
  }
};
