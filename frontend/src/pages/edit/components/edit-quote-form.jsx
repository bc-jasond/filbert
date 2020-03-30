import * as React from 'react';
import styled from 'styled-components';

import {
  Arrow,
  DarkInput,
  LilSassyMenu,
  PointClip,
} from '../../../common/components/shared-styled-components';
import {
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_TAB,
} from '../../../common/constants';
import {
  caretIsAtBeginningOfInput,
  caretIsAtEndOfInput,
  focusAndScrollSmooth,
} from '../../../common/dom';
import { stopAndPrevent } from '../../../common/utils';

const EditQuoteMenu = styled(LilSassyMenu)`
  display: flex;
  flex-direction: column;
  justify-items: center;
  top: ${(p) => p.top - 90}px;
  width: 400px;
  margin: 0 auto;
  padding: 8px;
  left: 50%;
  margin-left: -200px;
`;
const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 32px;
`;
const QuoteInput = styled(DarkInput)`
  margin: 0 8px;
`;

export default class EditQuoteForm extends React.Component {
  menuItems = ['quote', 'url', 'author', 'context'];

  constructor(props) {
    super(props);
    this.state = {
      currentIdx: 0,
      shouldFocusEnd: true,
    };
    this.inputRefs = Array(4)
      .fill(null)
      .map(() => React.createRef());
  }

  componentDidMount() {
    const {
      props: { nodeModel },
    } = this;
    // find first empty value - or first value
    let [focusRef] = this.inputRefs.filter(
      (r) => r?.current?.value?.length === 0
    );
    focusRef = focusRef || this.inputRefs[0];

    focusAndScrollSmooth(nodeModel.get('id'), focusRef.current);
  }

  componentDidUpdate(prevProps) {
    const {
      state: { currentIdx, shouldFocusEnd },
      props: { nodeModel, windowEvent },
    } = this;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }

    focusAndScrollSmooth(
      nodeModel.get('id'),
      this.inputRefs[currentIdx]?.current,
      shouldFocusEnd
    );
  }

  handleKeyDown = (evt) => {
    const {
      state: { currentIdx },
    } = this;
    if (
      (evt.keyCode === KEYCODE_TAB && evt.shiftKey) ||
      (evt.keyCode === KEYCODE_LEFT_ARROW && caretIsAtBeginningOfInput())
    ) {
      const nextIdx =
        currentIdx === 0 ? this.inputRefs.length - 1 : currentIdx - 1;
      this.setState({ currentIdx: nextIdx, shouldFocusEnd: true });
      stopAndPrevent(evt);
      return;
    }
    if (
      evt.keyCode === KEYCODE_TAB ||
      (evt.keyCode === KEYCODE_RIGHT_ARROW && caretIsAtEndOfInput())
    ) {
      const nextIdx =
        currentIdx === this.inputRefs.length - 1 ? 0 : currentIdx + 1;
      this.setState({ currentIdx: nextIdx, shouldFocusEnd: false });
      stopAndPrevent(evt);
    }
  };

  updateMeta = (key, value) => {
    const {
      props: { nodeModel, update },
    } = this;
    update?.(nodeModel.setIn(['meta', key], value));
  };

  render() {
    const {
      props: { offsetTop, nodeModel },
    } = this;
    return (
      <EditQuoteMenu data-is-menu top={offsetTop}>
        {this.menuItems.map((metaKey, idx) => (
          <Row key={metaKey}>
            <QuoteInput
              ref={this.inputRefs[idx]}
              placeholder={`Enter ${metaKey.toLocaleUpperCase()} here...`}
              onChange={(e) => this.updateMeta(metaKey, e.target.value)}
              value={nodeModel.getIn(['meta', metaKey], '')}
            />
          </Row>
        ))}
        <PointClip>
          <Arrow />
        </PointClip>
      </EditQuoteMenu>
    );
  }
}
