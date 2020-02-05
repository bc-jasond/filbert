import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  boxShadow,
  darkGrey,
  grey,
  lightBlue,
  viewport7,
  viewport9
} from '../css';
import { monospaced, sansSerif } from '../fonts.css';
import { A } from './layout-styled-components';
import {
  Col,
  FlexGrid,
  H2Styled,
  H3Styled,
  Input,
  italicMixin,
  NavButtonMixin,
  ProfileImg
} from './shared-styled-components';

export const metaFontMixin = css`
  letter-spacing: 0px;
  font-size: 16px;
  line-height: 18px;
  font-style: normal;
`;
export const metaContentMixin = css`
  ${metaFontMixin};
  color: ${grey};
  font-family: ${sansSerif};
`;
export const authorExpandMixin = css`
  position: absolute;
  font-family: ${monospaced}, monospaced;
  color: ${grey};
  cursor: pointer;
  text-decoration: none;
  transition: letter-spacing 0.125s, color 0.125s;
  &:hover {
    letter-spacing: 8px;
    color: ${darkGrey};
    cursor: pointer;
  }
`;
export const StyledH2 = styled(H2Styled)`
  margin-left: 0;
  margin-right: 0;
`;
export const StyledH3 = styled(H3Styled)`
  margin-left: 0;
  margin-right: 0;
  font-weight: normal;
  color: ${grey};
`;
export const BaseRow = styled.div`
  max-width: ${viewport7};
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  word-break: break-word;
  &:first-of-type {
    border: none;
    padding-top: 0;
  }
  &:last-of-type {
    margin-bottom: 42px;
  }
  @media (min-width: ${viewport7}) {
    margin: 0 auto;
  }
  ${p =>
    p.loading &&
    css`
      opacity: 0.3;
    `}
`;
export const PostRow = styled(FlexGrid)`
  max-width: ${viewport7};
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  align-items: center;
  &:last-of-type {
    margin-bottom: 42px;
  }
  @media (min-width: ${viewport7}) {
    margin: 0 auto;
  }
`;
export const ImageCol = styled.div`
  padding: 0;
  flex: 1;
  margin-bottom: 16px;
  @media (min-width: ${viewport7}) {
    margin-bottom: 0;
    margin-right: 16px;
  }
`;
export const DetailsCol = styled.div`
  padding: 0;
  flex: 4;
`;
export const ListAvatar = styled.div`
  display: flex;
  align-items: center;
`;
export const ListAvatarImg = styled(ProfileImg)`
  height: 36px;
  width: 36px;
  &:hover {
    cursor: pointer;
    box-shadow: ${boxShadow};
  }
`;
export const ListAvatarContent = styled.div`
  display: flex;
  flex-direction: column;
`;
export const ListAvatarContentRow = styled.div`
  ${metaContentMixin};
`;
export const ListAvatarContentRowItalic = styled(ListAvatarContentRow)`
  ${italicMixin};
`;
export const ListAvatarContentRowDarker = styled(ListAvatarContentRow)`
  color: ${darkGrey};
`;
export const AuthorExpand = styled(Link)`
  ${metaContentMixin};
  ${authorExpandMixin};
`;
export const PostAbstractRow = styled.div`
  margin-top: 4px;
`;
export const StyledHeadingA = styled(A)`
  max-height: 56px;
  letter-spacing: -0.5px;
  font-size: 25px;
  line-height: 28px;
  font-weight: 600;
`;
export const StyledA = styled(A)`
  max-height: 48px;
  font-size: 19px;
  line-height: 24px;
  color: ${grey};
  letter-spacing: 0px;
`;
export const PostMetaRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;
export const PostActionContainer = styled.div`
  position: relative;
  min-height: 18px;
  display: inline-block;
  padding-left: ${p => (p.noPadding ? '0' : '8px')};
  &:first-of-type {
    padding-left: 0;
  }
`;
export const PostActionLink = styled(Link)`
  ${NavButtonMixin};
  ${metaFontMixin};
  padding: 6px 8px;
`;
export const ColFilter = styled(Col)`
  display: flex;
  padding-bottom: 16px;
  white-space: nowrap;
  &:last-of-type {
    padding-bottom: 0;
  }
  @media (min-width: ${viewport9}) {
    &:last-of-type {
      padding-bottom: 16px;
    }
  }
`;
export const Filter = styled.span`
  ${NavButtonMixin};
  display: inline-block;
  padding: 9px;
  margin-left: 8px;
  &:first-of-type {
    margin-left: 0;
  }
`;
export const FilterWithInput = styled(Filter)`
  flex-grow: 0;
  border: 1px solid transparent;
  border-right: none;
  margin-right: 0;
  ${p =>
    p.isOpen &&
    css`
      border: 1px solid ${lightBlue};
      border-right: none;
      margin-right: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    `}
`;
export const FilterInput = styled(Input)`
  flex: 1;
  height: 38px;
  margin-right: 8px;
  transition: opacity 0.2s;
  opacity: 1;
  //outline: 0; // outline is ugly but, a11y
  border: 1px solid ${lightBlue};
  border-left: none;
  border-radius: 0 26px 26px 0;
  ${p =>
    p.shouldHide &&
    css`
      opacity: 0;
    `}
`;
