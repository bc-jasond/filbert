import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import GitHubSvg from '../../../assets/icons/github-mark.svg';
import InfoSvg from '../../../assets/icons/info.svg';
import { darkGrey, grey, lightGrey } from '../css';
import { monospaced, sansSerif } from '../fonts.css';
import { NavButtonMixin } from './shared-styled-components';

export const HeaderStyled = styled.header`
  position: fixed;
  display: block;
  box-sizing: border-box;
  z-index: 12;
  width: 100%;
  background: rgba(255, 255, 255, 0.97);
  letter-spacing: 0;
  font-weight: 400;
  font-style: normal;
  top: 0;
`;
export const HeaderContentContainer = styled.div`
  position: relative;
  min-height: 65px;
  padding-left: 20px;
  padding-right: 20px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-evenly;
`;
export const LinkStyled = styled(Link)`
  font-family: ${monospaced}, monospaced;
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
export const NavSpan = styled.span`
  ${NavButtonMixin};
`;
export const NavLink = styled(LinkStyled)`
  ${NavButtonMixin};
`;
export const HeaderSpacer = styled.div`
  z-index: 9;
  position: relative;
  height: 65px;
`;
export const Article = styled.article`
  width: 100%;
  min-height: 80vh;
  padding: 40px 80px;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
  @media (max-width: 800px) {
    padding: 40px 20px;
  }
`;
export const FooterStyled = styled.footer`
  font-family: ${monospaced}, monospaced;
  background: ${lightGrey};
  padding: 20px;
  text-align: center;
  color: ${grey};
`;
export const SocialLinksContainer = styled.div`
  display: flex;
  justify-content: center;
`;
export const A = styled.a`
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
export const GitHubStyled = styled(GitHubSvg)`
  cursor: pointer;
  ${SocialIcon};
`;
export const InfoStyled = styled(InfoSvg)`
  cursor: pointer;
  ${SocialIcon};
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
