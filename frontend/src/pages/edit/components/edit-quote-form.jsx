import React, { useEffect, useRef, useState } from 'react';
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

export default React.memo(({ offsetTop, nodeModel, update }) => {
  const menuItems = ['quote', 'author', 'context', 'url'];
  const nodeId = nodeModel.get('id');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [shouldFocusEnd, setShouldFocusEnd] = useState(true);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    focusAndScrollSmooth(
      nodeId,
      inputRefs[currentIdx]?.current,
      shouldFocusEnd
    );
  }, [currentIdx, shouldFocusEnd, nodeId, inputRefs]);

  useEffect(() => {
    function handleKeyDown(evt) {
      if (!evt) {
        return;
      }
      if (
        (evt.keyCode === KEYCODE_TAB && evt.shiftKey) ||
        (evt.keyCode === KEYCODE_LEFT_ARROW && caretIsAtBeginningOfInput())
      ) {
        const nextIdx =
          currentIdx === 0 ? inputRefs.length - 1 : currentIdx - 1;
        setCurrentIdx(nextIdx);
        setShouldFocusEnd(true);
        stopAndPrevent(evt);
        return;
      }
      if (
        evt.keyCode === KEYCODE_TAB ||
        (evt.keyCode === KEYCODE_RIGHT_ARROW && caretIsAtEndOfInput())
      ) {
        const nextIdx =
          currentIdx === inputRefs.length - 1 ? 0 : currentIdx + 1;
        setCurrentIdx(nextIdx);
        setShouldFocusEnd(false);
        stopAndPrevent(evt);
      }
    }
    // `capture: true` will put this event handler in front of the ones set by edit.jsx
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      });
    };
  }, [currentIdx, inputRefs.length]);

  function updateMeta(key, value) {
    update?.(nodeModel.setIn(['meta', key], value), ['meta', key]);
  }

  return (
    <EditQuoteMenu data-is-menu top={offsetTop}>
      {menuItems.map((metaKey, idx) => (
        <Row key={metaKey}>
          <QuoteInput
            ref={inputRefs[idx]}
            placeholder={`Enter ${metaKey.toLocaleUpperCase()} here...`}
            onChange={(e) => updateMeta(metaKey, e.target.value)}
            value={nodeModel.getIn(['meta', metaKey], '')}
          />
        </Row>
      ))}
      <PointClip>
        <Arrow />
      </PointClip>
    </EditQuoteMenu>
  );
});
