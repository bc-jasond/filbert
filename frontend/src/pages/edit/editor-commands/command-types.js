// CONSIDER: would this be helpful to have concrete commands defined?  Right now
//  commands are "derived" from keystroke type and diff with previous values
const AddContent = {
  content: '',
  nodeId: '',
  caretStart: 20,
  path: ['content'],
};
const DeleteContent = {
  nodeId: '',
  caretStart: 20,
  caretEnd: 22,
  path: ['content'],
};
const DeleteNode = {
  nodeId: '',
};
const InsertNode = {
  nodeId: '',
  prevNodeId: '',
  nextNodeId: '',
};
const UpdateNodeType = {
  nodeId: '',
  newType: '',
};
