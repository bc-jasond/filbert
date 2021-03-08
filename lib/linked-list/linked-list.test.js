import immutable from 'immutable';

const { Map } = immutable;

import {
  linkedListFromJS,
  isEmpty,
  append,
  head,
  getPrev,
  size,
  insertBefore,
  insertAfter,
  indexOf,
  remove,
  getNode,
  getNext,
} from './linked-list.mjs';

describe('LinkedList | Immutable, Serializable, Unique IDs - ', () => {
  test('can create an empty list, adds items', () => {
    let item1;
    let linkedList = linkedListFromJS();
    expect(isEmpty(linkedList)).toBeTruthy();
    ({ node: item1, linkedList } = append(linkedList, { foo: 'bar' }));
    expect(head(linkedList)).toBe(item1);
    expect(getPrev(linkedList, item1).size).toBe(0);
    let item2;
    ({ node: item2, linkedList } = append(linkedList, { bar: 'baz' }));
    let item3;
    ({ node: item3, linkedList } = append(linkedList, { qux: 'buzz' }));
    expect(size(linkedList)).toBe(3);
    let item4;
    ({ node: item4, linkedList } = insertBefore(
      linkedList,
      { base: 'ball' },
      item1
    ));
    expect(head(linkedList)).toEqual(item4);
    let item5;
    ({ node: item5, linkedList } = insertAfter(
      linkedList,
      { ding: 'bat' },
      item2
    ));
    expect(indexOf(linkedList, item5)).toBe(3);
    linkedList = remove(linkedList, item4);
    expect(head(linkedList)).toBe(getNode(linkedList, item1));
    expect(size(linkedList)).toBe(4);
    expect(getNode(linkedList, item4).size).toBe(0);
    let item6;
    ({ node: item6, linkedList } = insertAfter(
      linkedList,
      { wom: 'bat' },
      item3
    ));
    expect(indexOf(linkedList, item6)).toBe(size(linkedList) - 1);
    expect(getNext(linkedList, item6).size).toBe(0);
    linkedList = remove(linkedList, item6);
    expect(size(linkedList)).toBe(4);
    expect(getNode(linkedList, item4).size).toBe(0);
  });
  test('can serialize / deserialize', () => {
    let linkedList = linkedListFromJS();
    let item1;
    ({ linkedList, node: item1 } = append(linkedList, { foo: 'bar' }));
    let item2;
    ({ linkedList, node: item2 } = append(linkedList, { bar: 'baz' }));
    let item3;
    ({ linkedList, node: item3 } = append(linkedList, { qux: 'buzz' }));
    let item4;
    ({ linkedList, node: item4 } = append(linkedList, { base: 'ball' }));
    let item5;
    ({ linkedList, node: item5 } = append(linkedList, { ding: 'bat' }));
    let item6;
    ({ linkedList, node: item6 } = append(linkedList, { wom: 'bat' }));
    const json = JSON.stringify(linkedList.toJS());
    const listWoke = linkedListFromJS(JSON.parse(json));
    expect(linkedList).toEqual(listWoke);
    expect(getNode(listWoke, item1)).toEqual(getNode(linkedList, item1));
    expect(getNode(listWoke, item2)).toEqual(getNode(linkedList, item2));
    expect(getNode(listWoke, item3)).toEqual(getNode(linkedList, item3));
    expect(getNode(listWoke, item4)).toEqual(getNode(linkedList, item4));
    expect(getNode(listWoke, item5)).toEqual(getNode(linkedList, item5));
    expect(getNode(listWoke, item6)).toEqual(getNode(linkedList, item6));
  });
  test('can remove last element', () => {
    let linkedList = linkedListFromJS();
    let item1;
    ({ linkedList, node: item1 } = append(linkedList, { foo: 'bar' }));
    expect(size(linkedList)).toBe(1);
    linkedList = remove(linkedList, item1);
    expect(isEmpty(linkedList)).toBeTruthy();
    expect(head(linkedList)).toBe(Map());
  });
});
