import styled, { css } from 'styled-components';
import { darkGrey, grey } from '../css';
import { monospaced, sansSerif } from '../fonts.css';
import { A } from './layout-styled-components';
import { H2Styled, H3Styled, NavButtonMixin } from './shared-styled-components';

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
  margin: 0 auto;
  max-width: 768px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  word-break: break-word;
  &:last-of-type {
    border: none;
    margin-bottom: 40px;
  }
  @media (max-width: 768px) {
    margin: 0;
  }
`;
export const PostAbstractRow = styled.div`
  margin-top: 4px;
`;
export const StyledHeadingA = styled(A)`
  max-height: 56px;
  letter-spacing: -0.47px;
  font-size: 25.2px;
  line-height: 28px;
  font-weight: 600;
`;
export const StyledA = styled(A)`
  max-height: 48px;
  font-size: 18.96px;
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
export const PostAction = styled.span`
  ${NavButtonMixin};
  ${MetaFont};
  padding: 7px 9px;
`;
export const PostActionA = styled(A)`
  ${NavButtonMixin};
  ${MetaFont};
  padding: 7px 9px;
`;
