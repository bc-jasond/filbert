import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import GitHubSvg from '../../assets/github-mark.svg';
import LinkedInSvg from '../../assets/linkedin-logo.svg';
import { darkGrey, grey, lightBlue } from './css';
import { monospaced, sansSerif } from './fonts.css';

export const Header = styled.header`
  position: fixed;
  display: block;
  box-sizing: border-box;
  z-index: 500;
  width: 100%;
  background: rgba(255,255,255,.97);
  letter-spacing: 0;
  font-weight: 400;
  font-style: normal;
  top: 0;
`;
export const HeaderContentContainer = styled.div`
  position: relative;
  height: 65px;
  padding-left: 20px;
  padding-right: 20px;
  margin: 0 auto;
  display: flex;
  align-items: center;
`;
export const HeaderLinksContainer = styled.div`
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
export const LinkStyled = styled(Link)`
  font-family: ${monospaced}, monospaced;
  font-size: 24px;
  color: ${grey};
  text-decoration: none;
  transition: font-size 0.125s;
  &:hover {
    font-size: 28px;
  }
`;
export const HeaderButtonMixin = css`
  font-family: ${monospaced}, monospaced;
  color: ${grey};
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  line-height: 24px;
  padding: 14px 18px;
  border-radius: 26px;
  border: 1px solid transparent;
  transition: background-color 0.125s, color 0.125s;
  &:hover {
    font-size: 18px;
    color: white;
    background-color: ${lightBlue};
  }
`;
export const NewPost = styled(LinkStyled)`
  ${HeaderButtonMixin};
`;
export const ListDrafts = styled(LinkStyled)`
  ${HeaderButtonMixin};
`;
export const SignedInUser = styled.div`
  ${HeaderButtonMixin};
`;
export const LinkStyledSignIn = styled(LinkStyled)`
  ${HeaderButtonMixin};
`;
export const LinkStyledAbout = styled(LinkStyled)`
  ${HeaderButtonMixin};
`;
export const HeaderSpacer = styled.div`
  z-index: 100;
  position: relative;
  height: 65px;
`;
export const Article = styled.article`
  width: 100%;
  min-height: 80vh;
  padding: 0 20px 80px;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
  @media (max-width: 800px) {
    padding: 0 20px 80px 20px;
  }
`;
export const Footer = styled.footer`
  font-family: ${monospaced}, monospaced;
  background: rgba(0,0,0,.05);
  padding: 20px;
  text-align: center;
  color: rgba(0,0,0,.54);
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
  margin: 20px 5px 0 5px;
  transition: fill .375s;
  fill: ${grey};
  &:hover {
    transition: fill .375s;
    fill: ${darkGrey};
  }
`;
export const GitHubStyled = styled(GitHubSvg)`
  ${SocialIcon};
`;
export const LinkedInStyled = styled(LinkedInSvg)`
  ${SocialIcon};
`;