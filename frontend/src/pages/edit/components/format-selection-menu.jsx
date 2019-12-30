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
  DarkInput,
  IconButton,
  LilSassyMenu,
  PointClip,
  SvgIconMixin
} from '../../../common/components/shared-styled-components';
import {
  KEYCODE_ENTER,
  KEYCODE_ESC,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SHIFT_OR_COMMAND_LEFT,
  KEYCODE_SHIFT_RIGHT,
  KEYCODE_SPACE,
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_MINI,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_LINK_URL
} from '../../../common/constants';

const IconBold = styled(IconBoldSvg)`
  ${SvgIconMixin};
`;
const IconItalic = styled(IconItalicSvg)`
  ${SvgIconMixin};
`;
const IconCode = styled(IconCodeSvg)`
  ${SvgIconMixin};
`;
const IconSiteinfo = styled(IconInfoSvg)`
  ${SvgIconMixin};
`;
const IconStrikethrough = styled(IconStrikethroughSvg)`
  ${SvgIconMixin};
`;
const IconLink = styled(IconLinkSvg)`
  ${SvgIconMixin};
`;
const IconH1 = styled(IconH1Svg)`
  ${SvgIconMixin};
`;
const IconH2 = styled(IconH2Svg)`
  ${SvgIconMixin};
`;
const IconMini = styled(IconMiniSvg)`
  ${SvgIconMixin};
`;

const FormatSelectionMenu = styled(LilSassyMenu)`
  // 44 is the height of menu, 10 is the height of arrow point
  display: ${p => (p.isOpen ? 'block' : 'none')};
  top: ${p => p.top - 44 - 15 - (p.shouldShowUrl ? 30 : 0)}px;
  left: ${p => p.left - 183}px; // 183 is half the width of the menu
`;
const LinkInput = styled(DarkInput)`
  display: block;
  box-sizing: border-box;
  height: 0;
  width: 100%;
  padding: 0;
  transition: 0.05s height;
  ${p =>
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
  shouldAddSpacer
}) => (
  <>
    {shouldAddSpacer && <ButtonSeparator />}
    <IconButton onClick={onClick}>
      <Styled selected={selected} checked={checked} />
    </IconButton>
  </>
);

export default class FormatSelectionMenuComponent extends React.Component {
  didHitShift = false;

  ref = React.createRef();

  sectionTypes = [
    {
      type: SELECTION_ACTION_BOLD,
      Styled: IconBold,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_ITALIC,
      Styled: IconItalic,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_CODE,
      Styled: IconCode,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_SITEINFO,
      Styled: IconSiteinfo,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_MINI,
      Styled: IconMini,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_STRIKETHROUGH,
      Styled: IconStrikethrough,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_LINK,
      Styled: IconLink,
      shouldAddSpacer: false
    },
    {
      type: SELECTION_ACTION_H1,
      Styled: IconH1,
      shouldAddSpacer: true
    },
    {
      type: SELECTION_ACTION_H2,
      Styled: IconH2,
      shouldAddSpacer: false
    }
  ];

  constructor(props) {
    super(props);

    this.state = {
      currentIdx: -1,
      isMenuOpen: true
    };
  }

  componentDidUpdate(prevProps) {
    const {
      props: { selectionModel, windowEvent }
    } = this;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }
    if (selectionModel.get(SELECTION_ACTION_LINK) && this.ref) {
      this.ref.current.focus();
    }
  }

  handleKeyDown = evt => {
    const {
      props: { selectionModel },
      state: { currentIdx }
    } = this;

    // if 'link' is selected we need to let keystrokes pass through to the URL input... messy business
    // only allow 'enter' and 'esc' through to close the menu
    if (
      selectionModel.get(SELECTION_ACTION_LINK) &&
      ![KEYCODE_ENTER, KEYCODE_ESC].includes(evt.keyCode)
    ) {
      return;
    }
    // don't let contenteditable take over!
    evt.preventDefault();
    evt.stopPropagation();

    /* eslint-disable-next-line default-case */
    switch (evt.keyCode) {
      case KEYCODE_SHIFT_OR_COMMAND_LEFT: // fall-through
      case KEYCODE_SHIFT_RIGHT: {
        if (this.didHitShift) {
          // user double-tapped shift
          this.setState({ isMenuOpen: true });
          this.didHitShift = false;
          return;
        }
        this.didHitShift = true;
        setTimeout(() => {
          this.didHitShift = false;
        }, 500);
        return;
      }
      case KEYCODE_LEFT_ARROW: {
        this.setState({ currentIdx: Math.max(0, currentIdx - 1) });
        break;
      }
      case KEYCODE_RIGHT_ARROW: {
        this.setState({ currentIdx: Math.min(8, currentIdx + 1) });
        break;
      }
      case KEYCODE_ESC: {
        // if "link" is selected, user is "stranded" in the url input.  Override 'esc' here to provide
        // a keyboard only escape hatch
        if (selectionModel.get(SELECTION_ACTION_LINK)) {
          this.props?.selectionAction?.(SELECTION_ACTION_LINK);
          return;
        }
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

  render() {
    const {
      props: { offsetTop, offsetLeft, selectionModel, updateLinkUrl },
      state: { currentIdx, isMenuOpen }
    } = this;

    return (
      <FormatSelectionMenu
        shouldShowUrl={selectionModel.get(SELECTION_ACTION_LINK)}
        top={offsetTop}
        left={offsetLeft}
        isOpen={isMenuOpen}
      >
        {this.sectionTypes.map(({ type, Styled, shouldAddSpacer }, idx) => (
          <FormatSelectionMenuItem
            key={type}
            onClick={() => this.props?.selectionAction?.(type)}
            Styled={Styled}
            selected={currentIdx === idx}
            checked={selectionModel.get(type) || undefined}
            shouldAddSpacer={shouldAddSpacer}
          />
        ))}
        <LinkInput
          ref={this.ref}
          placeholder="Enter URL here..."
          checked={selectionModel.get(SELECTION_ACTION_LINK)}
          onChange={e => updateLinkUrl(e.target.value)}
          value={selectionModel.get(SELECTION_LINK_URL)}
        />
        <PointClip>
          <Arrow />
        </PointClip>
      </FormatSelectionMenu>
    );
  }
}
