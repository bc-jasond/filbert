import * as React from 'react';
import styled from 'styled-components';

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
    `
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

export default class FormatSelectionMenuComponent extends React.Component {
  didHitOpenMenuKey = false;

  ref = React.createRef();

  linkMenuItemIdx = 6;

  sectionTypes = [
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

  constructor(props) {
    super(props);

    const { selectionModel } = props;
    this.state = {
      currentIdx: selectionModel?.get(SELECTION_ACTION_LINK)
        ? this.linkMenuItemIdx
        : -1,
      isMenuOpen: true,
    };
  }

  componentDidMount() {
    const {
      props: { nodeModel, selectionModel },
    } = this;
    if (selectionModel.get(SELECTION_ACTION_LINK) && this.ref) {
      focusAndScrollSmooth(nodeModel.get('id'), this.ref?.current);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      state: { currentIdx },
      props: { nodeModel, selectionModel, windowEvent },
    } = this;
    const { currentIdx: prevIdx } = prevState;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }
    if (
      selectionModel.get(SELECTION_ACTION_LINK) &&
      currentIdx === this.linkMenuItemIdx
    ) {
      focusAndScrollSmooth(
        nodeModel.get('id'),
        this.ref?.current,
        prevIdx !== this.linkMenuItemIdx - 1
      );
      return;
    }
    this.ref?.current?.blur?.();
  }

  handleKeyDown = (evt) => {
    const {
      props: { selectionModel },
      state: { currentIdx, isMenuOpen },
    } = this;

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
      return;
    }
    // if the cursor is on the 'link' icon - only move the cursor in the menu if the caret is
    // at the edge of the input content (beginning for left arrow, end for right arrow)
    // TODO: maybe? let user hold shift and use arrows to resize selection (instead of moving menu cursor)
    //  ^ this is complicated because of the input focus().  Also, it might override highlighting text in the input
    //  You'd have to blur() the input, restoreSelection() on the contenteditable text (so you can see the blue highlight again)
    //  but only while the user is holding shift and hitting arrows.  Sounds pretty messy
    if (
      isMenuOpen &&
      currentIdx === this.linkMenuItemIdx &&
      selectionModel.get(SELECTION_ACTION_LINK)
    ) {
      if (
        // if this gets uncommented, user can't unselect the 'link' menu item.
        // with it commented, it will unselect 'link' while typing the url if the
        // user hits 'space', which could be jarring but, seems preferable to being 'stuck'
        // evt.keyCode === KEYCODE_SPACE ||
        (evt.keyCode === KEYCODE_LEFT_ARROW && !caretIsAtBeginningOfInput()) ||
        (evt.keyCode === KEYCODE_RIGHT_ARROW && !caretIsAtEndOfInput())
      ) {
        return;
      }
    }

    // don't let contenteditable take over!
    stopAndPrevent(evt);

    /* eslint-disable-next-line default-case */
    switch (evt.keyCode) {
      case KEYCODE_CTRL: {
        if (this.didHitOpenMenuKey) {
          // user double-tapped shift
          this.setState({ isMenuOpen: true });
          this.didHitOpenMenuKey = false;
          return;
        }
        this.didHitOpenMenuKey = true;
        setTimeout(() => {
          this.didHitOpenMenuKey = false;
        }, 500);
        return;
      }
      case KEYCODE_LEFT_ARROW: {
        const nextIdx =
          currentIdx <= 0 ? this.sectionTypes.length - 1 : currentIdx - 1;
        this.setState({ currentIdx: nextIdx });
        return;
      }
      case KEYCODE_RIGHT_ARROW: {
        const nextIdx =
          currentIdx === this.sectionTypes.length - 1 ? 0 : currentIdx + 1;
        this.setState({ currentIdx: nextIdx });
        return;
      }
      case KEYCODE_ESC: {
        this.setState({ currentIdx: -1, isMenuOpen: false }, () => {
          this.props?.closeMenu?.();
        });
        return;
      }
      case KEYCODE_SPACE: {
        if (currentIdx > -1) {
          this.props?.selectionAction?.(this.sectionTypes[currentIdx]?.type);
        }
        return;
      }
      case KEYCODE_ENTER: {
        if (
          selectionModel.get(SELECTION_ACTION_LINK) &&
          selectionModel.get(SELECTION_LINK_URL, '').length
        ) {
          this.setState({ currentIdx: -1, isMenuOpen: false }, () => {
            this.props?.closeMenu?.();
          });
          return;
        }
        if (currentIdx > -1) {
          this.setState({ currentIdx: -1, isMenuOpen: false }, () => {
            if (selectionModel.get(this.sectionTypes[currentIdx]?.type)) {
              // this value is currently selected, don't unselect it. just close the menu
              return;
            }
            this.props?.selectionAction?.(
              this.sectionTypes[currentIdx]?.type,
              true
            );
          });
        }
      }
    }
  };

  isChecked = (type) => {
    const {
      props: { selectionModel, nodeModel },
    } = this;
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
  };

  render() {
    const {
      props: { offsetTop, offsetLeft, selectionModel, updateLinkUrl },
      state: { currentIdx, isMenuOpen },
    } = this;

    return (
      <FormatSelectionMenu
        id="format-selection-menu"
        shouldShowUrl={selectionModel.get(SELECTION_ACTION_LINK)}
        top={offsetTop}
        left={offsetLeft}
        isOpen={isMenuOpen}
      >
        {this.sectionTypes.map(({ type, Styled, shouldAddSpacer }, idx) => (
          <FormatSelectionMenuItem
            id={`format-selection-menu-${type}`}
            key={type}
            onClick={() => this.props?.selectionAction?.(type)}
            Styled={Styled}
            selected={currentIdx === idx}
            checked={this.isChecked(type)}
            shouldAddSpacer={shouldAddSpacer}
          />
        ))}
        <LinkInput
          id="format-selection-menu-link-url-input"
          ref={this.ref}
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
}
