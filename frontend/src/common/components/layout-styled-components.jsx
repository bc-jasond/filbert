import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  codeFontFamily,
  darkGrey,
  getVar,
  grey,
  sansSerif,
  viewport9,
} from '../../variables.css';

export const LinkStyled = styled(Link)`
  font-family: ${getVar(codeFontFamily)}, monospaced;
  font-size: 24px;
  color: ${grey};
  text-decoration: none;
`;
export const LogoLinkStyled = styled(LinkStyled)`
  font-size: 28px;
  transition: font-size 0.125s;
  &:hover {
    font-size: 32px;
  }
`;
export const Article = styled.article`
  width: 100%;
  min-height: 80vh;
  padding: 16px 24px 48px 24px;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
  @media (min-width: ${viewport9}) {
    padding: 48px 80px;
  }
`;
export const ALayout = styled.a`
  text-decoration: none;
  text-overflow: ellipsis;
  overflow: hidden;
  font-style: normal;
  font-family: ${sansSerif}, sans-serif;
`;
export const SocialIcon = css`
  display: block;
  height: 32px;
  width: 34px;
  margin: 20px 10px 0 10px;
  transition: fill 0.375s;
  fill: ${grey};
  &:hover {
    transition: fill 0.375s;
    fill: ${darkGrey};
  }
`;

export const StaticFooter = styled.div`
  position: fixed;
  width: 100%;
  bottom: 0;
`;
export const H1Center = styled.h1`
  position: absolute;
  width: 100%;
  top: 40%;
  margin: 0 auto;
  text-align: center;
  font-size: 72px;
`;
export const StyledHeadingA = styled(ALayout)`
  max-height: 56px;
  letter-spacing: -0.5px;
  font-size: 25px;
  line-height: 28px;
  font-weight: 600;
`;
export const AbstractLink = styled(ALayout)`
  max-height: 48px;
  font-size: 19px;
  line-height: 24px;
  color: ${grey};
  letter-spacing: 0px;
`;
