import { Map, List } from 'immutable';
import { NODE_TYPE_SECTION_H1, NODE_TYPE_SECTION_SPACER, ROOT_NODE_PARENT_ID } from '../../../common/constants';
import {
  idRegExp,
  overrideConsole,
} from '../../../common/test-helpers';

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
    expect(documentModel.getNextSibling("eea2")).toBe(Map())
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
  test("insertSectionAfter", () =>{
    const newSectionId = documentModel.insertSectionAfter("6ffb", NODE_TYPE_SECTION_H1, 'Another Large Heading')
    const newSection = documentModel.getNode(newSectionId);
    expect(documentModel.getNextSibling("6ffb").get('id')).toBe(newSection.get('id'));
    expect(documentModel.getNextSibling(newSectionId)).toMatchSnapshot()
  });
  test("insertSectionBefore", () => {
    const newSectionId = documentModel.insertSectionBefore("7c74", NODE_TYPE_SECTION_SPACER)
    const newSection = documentModel.getNode(newSectionId);
    expect(documentModel.getPrevSibling("7c74").get('id')).toBe(newSection.get('id'));
    expect(documentModel.getPrevSibling(newSectionId)).toMatchSnapshot()
  });
  test.todo("insertSection");
  test.todo("splitSection");
  test.todo("splitSectionForFormatChange");
  test.todo("isParagraphType");
  test.todo("mergeParagraphs");
  test.todo("mergeSections");
  test.todo("getText");
  test.todo("insertSubSectionAfter");
  test.todo("insert");
  test.todo("update");
  test.todo("delete");
  test.todo("updateNodesForParent");
  test.todo("canFocusNode");
  test.todo("getPreviousFocusNodeId");
  test.todo("getNextFocusNodeId");
});
