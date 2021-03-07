import immutable from 'immutable';
import {
  LINKED_LIST_HEAD_ID,
  LINKED_LIST_NODE_ID,
  LINKED_LIST_NODE_NEXT_ID,
  LINKED_LIST_NODES_MAP,
} from '@filbert/linked-list';
import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
} from '@filbert/selection';

const { Map } = immutable;

////////////////////////////////////////////////////////////
// test helpers
////////////////////////////////////////////////////////////

export const testPostId = 175;
export const firstNodeIdH1 = '8e34';
export const firstNodeContent = 'Large Heading';
export const firstPId = '621e';
export const firstPContent = 'First paragraph with no formats';
export const lastNodeIdP = 'cce3';
export const lastNodeContent =
  'Make sure we have a P on the end so we can delete';
export const spacerId = 'db70';
export const h2Id = '9615';
export const h2Content = 'Small Heading';
export const preId = 'fd25';
export const pre2Id = '43eb'; // this points to img
export const imgId = '4add';
export const formattedPId = 'f677';
export const formattedPContent = 'Second paragraph with some formats';
export const formattedLiId = '151c';
export const formattedLiContent = 'One with a bunch of formats and stuff';
export const formattedLiIdPrev = '9fa0';
export const formattedLiIdPrevContent = 'Another item here';
export const quoteId = 'c67c';

export const testPostWithAllTypesJS = {
  post: {
    id: testPostId,
    user_id: 1,
    canonical: 'large-heading-0044',
    title: 'Large Heading',
    abstract: undefined,
    created: '2019-12-05T07:46:51.000Z',
    updated: '2019-12-05T07:46:51.000Z',
    published: undefined,
    deleted: undefined,
  },
  [LINKED_LIST_HEAD_ID]: firstNodeIdH1,
  [LINKED_LIST_NODES_MAP]: {
    [firstNodeIdH1]: {
      [LINKED_LIST_NODE_ID]: firstNodeIdH1,
      [LINKED_LIST_NODE_NEXT_ID]: firstPId,
      type: 'h1',
      content: firstNodeContent,
    },
    [firstPId]: {
      [LINKED_LIST_NODE_ID]: firstPId,
      [LINKED_LIST_NODE_NEXT_ID]: formattedPId,
      type: 'p',
      content: firstPContent,
    },
    [formattedPId]: {
      [LINKED_LIST_NODE_ID]: formattedPId,
      [LINKED_LIST_NODE_NEXT_ID]: spacerId,
      type: 'p',
      content: formattedPContent,
      formatSelections: FormatSelections.fromTestArray([
        [17],
        [4, SELECTION_ACTION_BOLD],
        [1],
        [4, SELECTION_ACTION_CODE],
        [1],
        [
          ,
          SELECTION_ACTION_LINK,
          { key: 'linkUrl', value: 'http://some.site' },
        ],
      ]),
    },
    [spacerId]: {
      [LINKED_LIST_NODE_ID]: spacerId,
      [LINKED_LIST_NODE_NEXT_ID]: h2Id,
      type: 'spacer',
      content: '',
    },
    [h2Id]: {
      [LINKED_LIST_NODE_ID]: h2Id,
      [LINKED_LIST_NODE_NEXT_ID]: '56da',
      type: 'h2',
      content: h2Content,
    },
    '56da': {
      [LINKED_LIST_NODE_ID]: '56da',
      [LINKED_LIST_NODE_NEXT_ID]: formattedLiIdPrev,
      type: 'li',
      content: "Here's a list",
    },
    [formattedLiIdPrev]: {
      [LINKED_LIST_NODE_ID]: formattedLiIdPrev,
      [LINKED_LIST_NODE_NEXT_ID]: formattedLiId,
      type: 'li',
      content: formattedLiIdPrevContent,
    },
    [formattedLiId]: {
      [LINKED_LIST_NODE_ID]: formattedLiId,
      [LINKED_LIST_NODE_NEXT_ID]: preId,
      type: 'li',
      content: formattedLiContent,
      formatSelections: FormatSelections.fromTestArray([
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
        [, SELECTION_ACTION_LINK, { key: 'linkUrl', value: 'http://yep.com' }],
      ]),
    },
    [preId]: {
      [LINKED_LIST_NODE_ID]: preId,
      [LINKED_LIST_NODE_NEXT_ID]: 'f063',
      type: 'pre',
      content: 'var someCode = "here";',
    },
    f063: {
      [LINKED_LIST_NODE_ID]: 'f063',
      [LINKED_LIST_NODE_NEXT_ID]: '61cf',
      type: 'pre',
      content: 'function getIt(sendIt) {',
    },
    '61cf': {
      [LINKED_LIST_NODE_ID]: '61cf',
      [LINKED_LIST_NODE_NEXT_ID]: '7a38',
      type: 'pre',
      content: '  const yep = false;',
    },
    '7a38': {
      [LINKED_LIST_NODE_ID]: '7a38',
      [LINKED_LIST_NODE_NEXT_ID]: pre2Id,
      type: 'pre',
      content: '}',
    },
    [pre2Id]: {
      [LINKED_LIST_NODE_ID]: pre2Id,
      [LINKED_LIST_NODE_NEXT_ID]: imgId,
      type: 'pre',
      content: 'getIt();',
    },
    [imgId]: {
      [LINKED_LIST_NODE_ID]: imgId,
      [LINKED_LIST_NODE_NEXT_ID]: '09a0',
      type: 'image',
      content: '',
      meta: {
        url: 'b38d29e7bbd96a4df4d7ac1fa442de358702b1635319c696f27c23c2bcc9d70d',
        width: 669,
        height: 1000,
        caption: "Kinzua Dam '91",
        rotationDegrees: 90,
      },
    },
    '09a0': {
      [LINKED_LIST_NODE_ID]: '09a0',
      [LINKED_LIST_NODE_NEXT_ID]: quoteId,
      type: 'h2',
      content: "Here's a big quote",
    },
    [quoteId]: {
      [LINKED_LIST_NODE_ID]: quoteId,
      [LINKED_LIST_NODE_NEXT_ID]: lastNodeIdP,
      type: 'quote',
      content: '',
      meta: {
        url:
          'https://www.theguardian.com/theguardian/2007/sep/13/greatinterviews',
        quote:
          "It's an attempt to bring the figurative thing up on to the nervous system more violently and more poignantly.",
        author: 'Frances Bacon',
        context: 'interviews with David Sylvester in 1963, 1966 and 1979',
      },
    },
    [lastNodeIdP]: {
      [LINKED_LIST_NODE_ID]: lastNodeIdP,
      [LINKED_LIST_NODE_NEXT_ID]: undefined,
      type: 'p',
      content: lastNodeContent,
    },
  },
};
