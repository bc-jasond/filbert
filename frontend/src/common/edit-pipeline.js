import Immutable, { List, Map } from 'immutable';

class EditPipeline {
  constructor(jsonData) {
    this.nodesByParentId = Immutable.fromJS(jsonData);
    this.nodeUpdates = {}; // keyed off of nodeId to avoid duplication
  }
  
  root() {}
  rootId() { return this.root().get('id') }
  getNode() {}
  getParent(node) {}
  insertSection(section, index = -1) {
    // parent must be root
    if (index === -1) {
      // push to end
    } else {
      // insert at index
    }
  }
  updateSection(node) {}
  deleteSection(node) {}
  insertSubSection(parent, subSection, index) {
    // must have an ancestor of a 'section' type
  }
  updateSubSection(subSection) {}
  deleteSubSection() {}
  
  pruneEmptyParents() {
    this.nodesByParentId = this.nodesByParentId.filter(children => children.size > 0);
  }
  getUpdates() {
    return Object.values(this.nodeUpdates);
  }
  clearUpdates() {
    if (Object.values(this.nodeUpdates).length > 0) {
      console.warn('Edit Pipeline - clearing non-empty update pipeline', this.nodeUpdates);
    }
    this.nodeUpdates = {};
  }
}