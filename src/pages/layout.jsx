import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { monospaced } from '../common/fonts.css';

const Header = styled.header`
  position: fixed;
  display: block;
  z-index: 500;
  width: 100%;
  background: rgba(255,255,255,.97);
  letter-spacing: 0;
  font-weight: 400;
  font-style: normal;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  top: 0;
`;
const HeaderContentContainer = styled.div`
  position: relative;
  // max-width: 1032px;
  height: 65px;
  padding-left: 20px;
  padding-right: 20px;
  margin: 0 auto;
  justify-content: space-between;
  display: flex;
  align-items: center;
`;
const LinkStyled = styled(Link)`
  font-family: ${monospaced}, monospaced;
  font-size: 24px;
  color: rgba(0,0,0,.54);
  text-decoration: none;
`;
const HeaderSpacer = styled.div`
  z-index: 100;
  position: relative;
  height: 65px;
`;
const Article = styled.article`
  max-width: 740px;
  padding: 0 20px 80px 20px;
  width: 100%;
  margin: 0 auto;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
`;
const Footer = styled.footer`
  font-family: ${monospaced}, monospaced;
  background: rgba(0,0,0,.05);
  padding: 20px;
  text-align: center;
  color: rgba(0,0,0,.54);
`;

export default WrappedComponent => props => (
  <React.Fragment>
    <Header>
      <HeaderContentContainer>
        <LinkStyled to="/">dubaniewi.cz</LinkStyled>
      </HeaderContentContainer>
    </Header>
    <HeaderSpacer />
    <Article>
      <WrappedComponent {...props} />
    </Article>
    <Footer>
      🚚 1/4/2019
    </Footer>
  </React.Fragment>
);
