import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import IconBoldSvg from '../../../../assets/icons/bold.svg';
import IconCodeSvg from '../../../../assets/icons/code.svg';
import IconH1Svg from '../../../../assets/icons/h1.svg';
import IconH2Svg from '../../../../assets/icons/h2.svg';
import IconInfoSvg from '../../../../assets/icons/info.svg';
import IconItalicSvg from '../../../../assets/icons/italic.svg';
import IconLinkSvg from '../../../../assets/icons/link.svg';
import IconMiniSvg from '../../../../assets/icons/mini.svg';
import IconStrikethroughSvg from '../../../../assets/icons/strikethrough.svg';
import {
  Arrow,
  ButtonSeparator,
  Cursor,
  DarkInput,
  IconButton,
  LilSassyMenu,
  PointClip,
} from '../../../common/components/shared-styled-components';
import { svgIconMixin } from '../../../common/components/shared-styled-components-mixins';
import {
  KEYCODE_CTRL,
  KEYCODE_ENTER,
  KEYCODE_ESC,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SPACE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_LINK_URL,
} from '../../../common/constants';
import {
  caretIsAtBeginningOfInput,
  caretIsAtEndOfInput,
  focusAndScrollSmooth,
} from '../../../common/dom';
import { stopAndPrevent } from '../../../common/utils';

const IconBold = styled(IconBoldSvg)`
  ${svgIconMixin};
`;
const IconItalic = styled(IconItalicSvg)`
  ${svgIconMixin};
`;
const IconCode = styled(IconCodeSvg)`
  ${svgIconMixin};
`;
const IconSiteinfo = styled(IconInfoSvg)`
  ${svgIconMixin};
`;
const IconStrikethrough = styled(IconStrikethroughSvg)`
  ${svgIconMixin};
`;
const IconLink = styled(IconLinkSvg)`
  ${svgIconMixin};
`;
const IconH1 = styled(IconH1Svg)`
  ${svgIconMixin};
`;
const IconH2 = styled(IconH2Svg)`
  ${svgIconMixin};
`;
const IconMini = styled(IconMiniSvg)`
  ${svgIconMixin};
`;

const FormatSelectionMenu = styled(LilSassyMenu)`
  // 44 is the height of menu, 10 is the height of arrow point
  display: ${(p) => (p.isOpen ? 'block' : 'none')};
  top: ${(p) => p.top - 44 - 15 - (p.shouldShowUrl ? 30 : 0)}px;
  left: ${(p) => p.left - 183}px; // 183 is half the width of the menu
`;
const LinkInput = styled(DarkInput)`
  height: 0;
  padding: 0;
  transition: 0.05s height;
  ${(p) =>
    p.checked &&
    css`
      padding: 12px;
      padding-top: 0;
      height: 30px;
    `}
`;

const FormatSelectionMenuItem = ({
  onClick,
  Styled,
  selected,
  checked,
  shouldAddSpacer,
}) => (
  <>
    {shouldAddSpacer && <ButtonSeparator />}
    <IconButton onClick={onClick}>
      <Styled checked={checked} />
      {selected && <Cursor />}
    </IconButton>
  </>
);

export default React.memo(
  ({
    nodeModel,
    selectionModel,
    selectionAction,
    offsetTop,
    offsetLeft,
    updateLinkUrl,
    closeMenu,
  }) => {
    const sectionTypes = [
      {
        type: SELECTION_ACTION_BOLD,
        Styled: IconBold,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_ITALIC,
        Styled: IconItalic,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_CODE,
        Styled: IconCode,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_SITEINFO,
        Styled: IconSiteinfo,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_MINI,
        Styled: IconMini,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_STRIKETHROUGH,
        Styled: IconStrikethrough,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_LINK, // position 6
        Styled: IconLink,
        shouldAddSpacer: false,
      },
      {
        type: SELECTION_ACTION_H1,
        Styled: IconH1,
        shouldAddSpacer: true,
      },
      {
        type: SELECTION_ACTION_H2,
        Styled: IconH2,
        shouldAddSpacer: false,
      },
    ];

    const didHitOpenMenuKeyRef = useRef(false);
    const linkUrlRef = useRef(null);

    const nodeId = nodeModel.get('id');
    const linkMenuItemIdx = 6;

    const [currentIdx, setCurrentIdx] = useState(
      selectionModel?.get(SELECTION_ACTION_LINK) ? linkMenuItemIdx : -1
    );
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [shouldFocusEnd, setShouldFocusEnd] = useState(true);

    useEffect(() => {
      if (
        selectionModel.get(SELECTION_ACTION_LINK) &&
        currentIdx === linkMenuItemIdx
      ) {
        focusAndScrollSmooth(nodeId, linkUrlRef?.current, shouldFocusEnd);
        return;
      }
      linkUrlRef?.current?.blur?.();
    }, [selectionModel, currentIdx, shouldFocusEnd, nodeId, linkMenuItemIdx]);

    useEffect(() => {
      function handleKeyDown(evt) {
        // allow user to resize selection with this menu open
        // if user is holding down shift, let it through
        // TODO: need to figure out how to handle the link URL input - user should be able to highlight text in the input while holding down shift
        //  probably add UP/DOWN arrow handlers to show/hide the input when cursor is on the link SVG
        //  then add a "is link url input hidden" check here too
        if (evt.shiftKey) {
          // NOTE: don't stopPropagation for a REDO!  We want this to continue to edit.jsx
          if (!evt.metaKey) {
            evt.stopPropagation();
          }
          return;
        }
        // if 'link' is selected we need to let keystrokes pass through to the URL input... messy business
        // only allow 'enter' and 'esc' through to close the menu and 'left' and 'right' to toggle through
        // menu items
        if (
          isMenuOpen &&
          selectionModel.get(SELECTION_ACTION_LINK) &&
          ![
            KEYCODE_ENTER,
            KEYCODE_ESC,
            KEYCODE_SPACE,
            KEYCODE_LEFT_ARROW,
            KEYCODE_RIGHT_ARROW,
          ].includes(evt.keyCode)
        ) {
          evt.stopPropagation();
          return;
        }
        // if the cursor is on the 'link' icon - only move the cursor in the menu if the caret is
        // at the "edge" of the input content (beginning for left arrow, end for right arrow)
        if (
          isMenuOpen &&
          currentIdx === linkMenuItemIdx &&
          selectionModel.get(SELECTION_ACTION_LINK)
        ) {
          if (
            // TODO: if this gets uncommented, user can't unselect the 'link' menu item.
            // with it commented, it will unselect 'link' while typing the url if the
            // user hits 'space', which could be jarring but, seems preferable to being 'stuck'
            // evt.keyCode === KEYCODE_SPACE ||
            (evt.keyCode === KEYCODE_LEFT_ARROW &&
              !caretIsAtBeginningOfInput()) ||
            (evt.keyCode === KEYCODE_RIGHT_ARROW && !caretIsAtEndOfInput())
          ) {
            evt.stopPropagation();
            return;
          }
        }

        const currentType = sectionTypes[currentIdx]?.type;

        switch (evt.keyCode) {
          case KEYCODE_CTRL: {
            stopAndPrevent(evt);
            if (didHitOpenMenuKeyRef.current) {
              // user double-tapped
              setIsMenuOpen(true);
              didHitOpenMenuKeyRef.current = false;
              return;
            }
            didHitOpenMenuKeyRef.current = true;
            setTimeout(() => {
              didHitOpenMenuKeyRef.current = false;
            }, 500);
            return;
          }
          case KEYCODE_LEFT_ARROW: {
            stopAndPrevent(evt);
            const nextIdx =
              currentIdx <= 0 ? sectionTypes.length - 1 : currentIdx - 1;
            setCurrentIdx(nextIdx);
            setShouldFocusEnd(true);
            return;
          }
          case KEYCODE_RIGHT_ARROW: {
            stopAndPrevent(evt);
            const nextIdx =
              currentIdx === sectionTypes.length - 1 ? 0 : currentIdx + 1;
            setCurrentIdx(nextIdx);
            setShouldFocusEnd(false);
            return;
          }
          case KEYCODE_ESC: {
            stopAndPrevent(evt);
            setCurrentIdx(-1);
            setIsMenuOpen(false);
            closeMenu?.();
            return;
          }
          case KEYCODE_SPACE: {
            stopAndPrevent(evt);
            if (currentIdx > -1) {
              selectionAction?.(currentType);
            }
            return;
          }
          case KEYCODE_ENTER: {
            stopAndPrevent(evt);
            if (
              selectionModel.get(SELECTION_ACTION_LINK) &&
              selectionModel.get(SELECTION_LINK_URL, '').length
            ) {
              setCurrentIdx(-1);
              setIsMenuOpen(false);
              closeMenu?.();
              return;
            }
            if (currentIdx > -1) {
              setCurrentIdx(-1);
              setIsMenuOpen(false);
              if (selectionModel.get(currentType)) {
                // this value is currently selected, don't unselect it. just close the menu
                return;
              }
              closeMenu?.();
              selectionAction?.(currentType);
            }
            break;
          }
          default:
            break;
        }
      }

      // `capture: true` will put this event handler in front of the ones set by edit.jsx
      window.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => {
        window.removeEventListener('keydown', handleKeyDown, {
          capture: true,
        });
      };
    }, [
      currentIdx,
      isMenuOpen,
      sectionTypes,
      selectionModel,
      selectionAction,
      closeMenu,
    ]);

    function isChecked(type) {
      if (
        nodeModel.get('type') === NODE_TYPE_H1 &&
        type === SELECTION_ACTION_H1
      ) {
        return true;
      }
      if (
        nodeModel.get('type') === NODE_TYPE_H2 &&
        type === SELECTION_ACTION_H2
      ) {
        return true;
      }
      return selectionModel.get(type) || undefined;
    }

    return (
      <FormatSelectionMenu
        id="format-selection-menu"
        shouldShowUrl={selectionModel.get(SELECTION_ACTION_LINK)}
        top={offsetTop}
        left={offsetLeft}
        isOpen={isMenuOpen}
      >
        {sectionTypes.map(({ type, Styled, shouldAddSpacer }, idx) => (
          <FormatSelectionMenuItem
            id={`format-selection-menu-${type}`}
            key={type}
            onClick={() => selectionAction?.(type)}
            Styled={Styled}
            selected={currentIdx === idx}
            checked={isChecked(type)}
            shouldAddSpacer={shouldAddSpacer}
          />
        ))}
        <LinkInput
          id="format-selection-menu-link-url-input"
          ref={linkUrlRef}
          placeholder="Enter URL here..."
          checked={selectionModel.get(SELECTION_ACTION_LINK)}
          onChange={(e) => updateLinkUrl(e.target.value)}
          value={selectionModel.get(SELECTION_LINK_URL)}
        />
        <PointClip>
          <Arrow />
        </PointClip>
      </FormatSelectionMenu>
    );
  }
);
