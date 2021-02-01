import { LinkedList } from './linked-list.mjs';

describe('LinkedList | Immutable, Serializable, Unique IDs - ', () => {
  test('can create an empty list, adds items', () => {
    const linkedList = new LinkedList();
    expect(linkedList.isEmpty()).toBeTruthy();
    const item1 = linkedList.append({ foo: 'bar' });
    expect(linkedList.head).toBe(item1);
    expect(linkedList.getPrev(item1)).toBeFalsy();
    const item2 = linkedList.append({ bar: 'baz' });
    const item3 = linkedList.append({ qux: 'buzz' });
    expect(linkedList.size).toBe(3);
    const item4 = linkedList.insertBefore({ base: 'ball' }, item1);
    expect(linkedList.head).toBe(item4);
    const item5 = linkedList.insertAfter({ ding: 'bat' }, item2);
    expect(linkedList.indexOf(item5)).toBe(3);
    linkedList.remove(item4);
    expect(linkedList.head).toBe(item1);
    expect(linkedList.size).toBe(4);
    expect(linkedList.getNode(item4)).toBeFalsy();
    const item6 = linkedList.insertAfter({ wom: 'bat' }, item3);
    expect(linkedList.indexOf(item6)).toBe(linkedList.size - 1);
    expect(linkedList.getNext(item6)).toBeFalsy();
    linkedList.remove(item6);
    expect(linkedList.size).toBe(4);
    expect(linkedList.getNode(item4)).toBeFalsy();
  });
  test('can serialize / deserialize & pretty print', () => {
    const linkedList = new LinkedList();
    const item1 = linkedList.append({ foo: 'bar' });
    const item2 = linkedList.append({ bar: 'baz' });
    const item3 = linkedList.append({ qux: 'buzz' });
    const item4 = linkedList.append({ base: 'ball' });
    const item5 = linkedList.append({ ding: 'bat' });
    const item6 = linkedList.append({ wom: 'bat' });
    const json = JSON.stringify(linkedList.toJSON());
    const listWoke = LinkedList.fromJSON(json);
    expect(linkedList).toEqual(listWoke);
    expect(listWoke.getNode(item1)).toEqual(item1);
    expect(listWoke.getNode(item2)).toEqual(item2);
    expect(listWoke.getNode(item3)).toEqual(item3);
    expect(listWoke.getNode(item4)).toEqual(item4);
    expect(listWoke.getNode(item5)).toEqual(item5);
    expect(listWoke.getNode(item6)).toEqual(item6);
    expect(listWoke.toString()).toContain('LinkedList');
  });
});
