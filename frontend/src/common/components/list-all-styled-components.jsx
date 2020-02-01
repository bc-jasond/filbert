import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { darkGrey, grey, lightBlue, viewport7, viewport9 } from '../css';
import { monospaced, sansSerif } from '../fonts.css';
import { A } from './layout-styled-components';
import {
  Col,
  H2Styled,
  H3Styled,
  Input,
  NavButtonMixin
} from './shared-styled-components';

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
export const PostRow = styled.div`
  margin: 0;
  max-width: ${viewport7};
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  word-break: break-word;
  &:first-of-type {
    padding-top: 0;
  }
  &:last-of-type {
    border: none;
    margin-bottom: 40px;
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
// POSTS LIST
export const MetaFont = css`
  letter-spacing: 0px;
  font-size: 16px;
  line-height: 20px;
  font-style: normal;
`;
export const MetaContent = css`
  ${MetaFont};
  color: ${grey};
  font-family: ${sansSerif};
  padding-right: 9px;
`;
export const PostMetaContentFirst = styled.span`
  ${MetaContent};
  padding-left: 0;
`;
export const authorExpandMixin = css`
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
export const PostActionLink = styled(Link)`
  ${NavButtonMixin};
  ${MetaFont};
  padding: 7px 9px;
`;
export const ColFilter = styled(Col)`
  display: flex;
  padding-bottom: 16px;
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
