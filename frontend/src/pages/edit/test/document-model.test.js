import { Map, List } from 'immutable';
import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_SPACER,
  ROOT_NODE_PARENT_ID
} from '../../../common/constants';
import {
  idRegExp,
  overrideConsole,
} from '../../../common/test-helpers';

import * as SelectionHelpers from '../selection-helpers';

import DocumentModel from "../document-model";
import { testPostWithAllTypesJS } from "./test-post-with-all-types";

overrideConsole();
const updateManagerMock = {
  stageNodeUpdate: jest.fn(),
  stageNodeDelete: jest.fn(),
  nodeHasBeenStagedForDelete: jest.fn(),
}

const { post, contentNodes } = testPostWithAllTypesJS;

let documentModel;

beforeEach(() => {
  documentModel = new DocumentModel();
  documentModel.init(post, updateManagerMock, contentNodes);
});

describe("DocumentModel", () => {
  test("init", () => {
    expect(documentModel).toMatchSnapshot();
    documentModel.init({}, {});
    expect(documentModel.nodesByParentId.size).toBe(1);
    const root = documentModel.nodesByParentId.get(ROOT_NODE_PARENT_ID).get(0)
    expect(root).toBe(documentModel.root)
    expect(root.get('id')).toBe(documentModel.rootId)
    expect(idRegExp.test(documentModel.rootId)).toBe(true);
  });
  test("getMapWithId", () => {
    const result = documentModel.getMapWithId({});
    expect(idRegExp.test(result.get('id'))).toBe(true)
    expect(result.get('post_id')).toBe(170)
  });
  test("getNode", () => {
    expect(documentModel.getNode(null)).toBe(Map())
    expect(documentModel.getNode("null")).toBe(Map())
    // finds: root -> content -> ol -> list item
    expect(documentModel.getNode("098a")).toMatchSnapshot()
    expect(documentModel.getNode("badId")).toBe(Map())
  });
  test("getParent", () => {
    // finds a valid parent
    expect(documentModel.getParent("7c74").get('id')).toBe("60dc")
    // always returns a Map()
    expect(documentModel.getParent("badId")).toBe(Map())
  });
  test("getChildren", () => {
    // content section with 2 paragraphs
    const children = documentModel.getChildren("6ffb")
    expect(children).toMatchSnapshot()
    // always returns a List()
    expect(documentModel.getChildren('badId')).toBe(List())
  });
  test("setChildren", () => {
    const prevSection = documentModel.getNode("6ffb");
    const prevRoot = documentModel.getNode("60dc");
    expect(prevSection).toBe(documentModel.nodesByParentId.get("60dc").get(1))
    // TODO: get rid of this.  Make sure root reference is broken in "by parent id" list
    expect(prevRoot).toBe(documentModel.nodesByParentId.get(ROOT_NODE_PARENT_ID).get(0))
    // and in documentModel.root
    expect(prevRoot).toBe(documentModel.root)
    documentModel.setChildren("6ffb", List())
    // these should pass equals() but none of the references should be intact
    const newSection = documentModel.nodesByParentId.get("60dc").get(1)
    expect(prevSection.equals(newSection)).toBe(true)
    expect(prevSection).not.toBe(newSection)
    const newRoot = documentModel.nodesByParentId.get(ROOT_NODE_PARENT_ID).get(0)
    expect(prevRoot.equals(newRoot)).toBe(true)
    expect(prevRoot.equals(documentModel.root)).toBe(true)
    expect(prevRoot).not.toBe(newRoot)
    expect(prevRoot).not.toBe(documentModel.root)
  });
  test("getSection", () => {
    // always returns map
    expect(documentModel.getSection(documentModel.rootId)).toBe(Map())
    // finds content section for LI
    expect(documentModel.getSection("4808")).toMatchSnapshot()
    // finds self when sectionId is given
    expect(documentModel.getSection("59cc")).toMatchSnapshot()
  });
  test("getNextSibling", () => {
    // returns Map() when node is at last position
    expect(documentModel.getNextSibling("eea1")).toBe(Map())
    expect(documentModel.getPrevSibling("eea2")).toMatchSnapshot()
  });
  test("getPrevSibling", () => {
    // returns Map() when node is at position 0
    expect(documentModel.getPrevSibling("fed1")).toBe(Map())
    // nominal case
    expect(documentModel.getPrevSibling("fed1")).toMatchSnapshot()
  });
  test("isFirstChild", () => {
    // root should always be first child
    expect(documentModel.isFirstChild(documentModel.rootId)).toBe(true)
    // positive case
    expect(documentModel.isFirstChild("4808")).toBe(true);
    // negative case - last child
    expect(documentModel.isFirstChild("4b8c")).toBe(false);
  });
  test("getFirstChild", () => {
    // should find root
    expect(documentModel.getFirstChild(ROOT_NODE_PARENT_ID)).toBe(documentModel.root);
    expect(documentModel.getFirstChild("6ffb")).toMatchSnapshot()
  });
  test("isLastChild", () => {
    // root should always be first child
    expect(documentModel.isLastChild(documentModel.rootId)).toBe(true)
    // positive case
    expect(documentModel.isLastChild("4b8c")).toBe(true);
    // negative case - last child
    expect(documentModel.isLastChild("4808")).toBe(false);
  });
  test("getLastChild", () => {
    // should find root
    expect(documentModel.getLastChild(ROOT_NODE_PARENT_ID)).toBe(documentModel.root);
    expect(documentModel.getLastChild("6ffb")).toMatchSnapshot()
  });
  test("isOnlyChild", () => {
    // root is always an only child - probably why it feels so entitled
    expect(documentModel.isOnlyChild(documentModel.rootId)).toBe(true);
    // works on a P tag
    expect(documentModel.isOnlyChild("33fc")).toBe(true);
  });
  test("isSectionType", () => {
    // root is false
    expect(documentModel.isSectionType(documentModel.rootId)).toBe(false);
    // P is false
    expect(documentModel.isSectionType("4472")).toBe(false);
    [
      // h1
      "7518",
      // h2
      "7d65",
      // content
      "6ffb",
      // spacer
      "4147",
      // codesection
      "59cc",
      // image
      "aa69",
      // quote
      "e108",
    ].forEach(nodeId => expect(documentModel.isSectionType(nodeId)).toBe(true))
  });
  test("insertSectionAfter", () => {
    const newSectionId = documentModel.insertSectionAfter("6ffb", NODE_TYPE_H1, 'Another Large Heading')
    const newSection = documentModel.getNode(newSectionId);
    expect(documentModel.getNextSibling("6ffb").get('id')).toBe(newSection.get('id'));
    expect(documentModel.getNextSibling(newSectionId)).toMatchSnapshot()
  });
  test("insertSectionBefore", () => {
    const newSectionId = documentModel.insertSectionBefore("7c74", NODE_TYPE_SPACER)
    const newSection = documentModel.getNode(newSectionId);
    expect(documentModel.getPrevSibling("7c74").get('id')).toBe(newSection.get('id'));
    expect(documentModel.getPrevSibling(newSectionId)).toMatchSnapshot()
  });
  test("insertSection", () => {
    const newSectionId = documentModel.insertSection(NODE_TYPE_H2, 1, 'Small Heading 2')
    const newSection = documentModel.getNode(newSectionId);
    expect(documentModel.getPrevSibling(newSectionId)).toMatchSnapshot()
    expect(documentModel.getNextSibling(newSectionId)).toMatchSnapshot()
    expect(documentModel.getNextSibling("7518")).toBe(newSection)
  });
  test("splitSection", () => {
    let prevNextSection = documentModel.getNextSibling("6ffb");
    documentModel.splitSection("6ffb", "4472");
    const nextSibling = documentModel.getNextSibling("6ffb");
    // splits CONTENT sections at a given node moving the given node to a new section below
    expect(documentModel.getChildren("6ffb")).toMatchSnapshot()
    expect(documentModel.getChildren("6ffb").get(0)).toBe(documentModel.getNode("2e29"))
    expect(documentModel.getChildren(nextSibling.get('id')).get(0)).toBe(documentModel.getNode("4472"))
    expect(documentModel.getNextSibling("6ffb")).not.toBe(prevNextSection);
    // creates a placeholder P tag in "sectionId" when moving all children
    prevNextSection = documentModel.getNextSibling("78d3")
    const prevChildren = documentModel.getChildren("78d3")
    documentModel.splitSection("78d3", "420f")
    expect(documentModel.getNextSibling("78d3")).not.toBe(prevNextSection)
    expect(documentModel.getChildren("78d3")).not.toBe(prevChildren)
    // throws on bad sectionId
    expect(() => {
      documentModel.splitSection("badId", "420f")
    }).toThrowError()
    // throws on nodeId not a child of sectionId
    expect(() => {
      documentModel.splitSection("78d3", "fed1")
    }).toThrowError()
  });
  test("splitSectionForFormatChange", () => {
    // TODO: this function is dependent on splitListReplaceListItemWithSection() & paragraphToTitle()
    //  basically, it gets called after the node being transformed has been deleted, so nodeIdx (usually an insert-before index)
    //  actually refers to the position of the deleted node.
    // splitting on first child should delete current section
    let idxOffset = documentModel.splitSectionForFormatChange("7c74", 0)
    expect(idxOffset).toBe(0)
    expect(documentModel.getNode("7c74")).toBe(Map())
    // splitting on last child - removes a child, doesn't insert a new section
    let prevNextSection = documentModel.getNextSibling("6ffb");
    let prevChildren = documentModel.getChildren("6ffb");
    idxOffset = documentModel.splitSectionForFormatChange("6ffb", 2)
    expect(idxOffset).toBe(1);
    // one might assume this to be prevChildren.size - 1 but, it's just prevChildren.size because the node will have been deleted in one of the two calling functions mentioned above
    expect(documentModel.getChildren("6ffb").size).toBe(prevChildren.size);
    expect(documentModel.getNextSibling("6ffb")).toBe(prevNextSection);
    // TODO: splitting in the middle
  });
  test("isParagraphType", () => {
    [
      // P
      "33fc",
      // LI
      "4808",
      // H1
      "7518",
      // h2
      "7d65"
    ].forEach(nodeId => expect(documentModel.isParagraphType(nodeId)).toBe(true));
    [
      // ROOT
      documentModel.rootId,
      // CONTENT
      "6ffb",
      // SPACER
      "5060",
      // OL
      "eea2",
      // IMAGE
      "aa69",
      // QUOTE
      "e108",
      // CODESECTION
      "59cc"
    ].forEach(nodeId => expect(documentModel.isParagraphType(nodeId)).toBe(false))
  });
  test("mergeParagraphs", () => {
    const combinedContent = `${documentModel.getNode("4808").get('content')}${documentModel.getNode("098a").get('content')}`;
    const spy = jest.spyOn(SelectionHelpers, 'concatSelections').mockImplementation(arg => arg)
    documentModel.mergeParagraphs("4808", "098a")
    expect(spy).toHaveBeenCalled()
    expect(documentModel.getNode("4808").get('content')).toBe(combinedContent);
  });
  test("mergeSections", () => {
    // merge content sections
    documentModel.mergeSections(documentModel.getNode("8b4f"), documentModel.getNode("98db"))
    expect(documentModel.getChildren("8b4f")).toMatchSnapshot()
    expect(documentModel.getNode("98db")).toBe(Map())
    // merge OL sub sections
    documentModel.mergeSections(documentModel.getNode("eea2"), documentModel.getNode("eea1"))
    expect(documentModel.getChildren("eea2")).toMatchSnapshot()
    expect(documentModel.getNode("eea1")).toBe(Map())
    // throws on unsupported sections
    expect(() => {
      documentModel.mergeSections(documentModel.getNode("8b4f"), documentModel.root)
    }).toThrowError()
  });
  test("insertSubSectionAfter", () => {
    // insert a P after a P
    let parentId = documentModel.getParent("2e29").get('id');
    let childCount = documentModel.getChildren(parentId).size;
    let newSubSectionId = documentModel.insertSubSectionAfter("2e29", NODE_TYPE_P, 'new paragraph')
    expect(documentModel.getNextSibling("2e29").get('id')).toBe(newSubSectionId)
    expect(documentModel.getChildren(parentId).size).toBe(childCount + 1)
    // insert an LI
    parentId = documentModel.getParent("098a").get('id');
    childCount = documentModel.getChildren(parentId).size;
    newSubSectionId = documentModel.insertSubSectionAfter("098a", NODE_TYPE_LI, 'new list item')
    expect(documentModel.getNextSibling("098a").get('id')).toBe(newSubSectionId)
    expect(documentModel.getChildren(parentId).size).toBe(childCount + 1)
  });
  test.todo("insert");
  test.todo("update");
  test.todo("delete");
  test.todo("updateNodesForParent");
  test("canFocusNode", () => {
    [
      // P
      "33fc",
      // LI
      "4808",
      // H1
      "7518",
      // h2
      "7d65",
      // pre
      // TODO: how do I test this?
    ].forEach(nodeId => expect(documentModel.canFocusNode(nodeId)).toBe(true));
    [
      // ROOT
      documentModel.rootId,
      // CONTENT
      "6ffb",
      // SPACER
      "5060",
      // OL
      "eea2",
      // IMAGE
      "aa69",
      // QUOTE
      "e108",
      // CODESECTION
      "59cc"
    ].forEach(nodeId => expect(documentModel.canFocusNode(nodeId)).toBe(false))
  });
  test("getPreviousFocusNodeId", () => {
    expect(documentModel.getPreviousFocusNodeId(documentModel.rootId)).toMatchSnapshot()
    expect(documentModel.getPreviousFocusNodeId("6ffb")).toMatchSnapshot()
    expect(documentModel.getPreviousFocusNodeId("7d65")).toMatchSnapshot()
    expect(documentModel.getPreviousFocusNodeId("4472")).toMatchSnapshot()
    expect(documentModel.getPreviousFocusNodeId("21f3")).toMatchSnapshot()
  });
  test("getNextFocusNodeId", () => {
    expect(documentModel.getNextFocusNodeId(documentModel.rootId)).toMatchSnapshot()
    expect(documentModel.getNextFocusNodeId("7518")).toMatchSnapshot()
    expect(documentModel.getNextFocusNodeId("4472")).toMatchSnapshot()
    expect(documentModel.getNextFocusNodeId("6ffb")).toMatchSnapshot()
    expect(documentModel.getNextFocusNodeId("098b")).toMatchSnapshot()
  });
});
