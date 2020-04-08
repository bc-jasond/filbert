import { Map } from 'immutable';
import React, { useEffect, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { LogoLinkStyled } from '../common/components/layout-styled-components';
import { navButtonMixin } from '../common/components/shared-styled-components-mixins';
import {
  DARK_MODE_THEME,
  LIGHT_MODE_THEME,
  PAGE_NAME_EDIT,
  PAGE_NAME_VIEW,
} from '../common/constants';
import { createNextUrl } from '../common/dom';
import { getTheme, setTheme, signout } from '../common/session';
import { backgroundColorPrimary, getVar, viewport7 } from '../variables.css';

const HeaderStyled = styled.header`
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  z-index: 12;
  width: 100%;
  background: ${getVar(backgroundColorPrimary)};
  opacity: 0.97;
  letter-spacing: 0;
  font-weight: 400;
  font-style: normal;
  top: 0;
  @media (min-width: ${viewport7}) {
    flex-direction: row;
    justify-content: space-between;
  }
`;
const HeaderContentContainer = styled.div`
  position: relative;
  min-height: 64px;
  padding-left: 20px;
  padding-right: 20px;
  margin: 0 auto 8px auto;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  @media (min-width: ${viewport7}) {
    margin: 0;
  }
`;
const HeaderSpacer = styled.div`
  z-index: 9;
  position: relative;
  height: 8rem;
  @media (min-width: ${viewport7}) {
    height: 4rem;
  }
`;
const LogoContainer = styled.div`
  flex-grow: 2;
  flex-shrink: 0;
  align-self: flex-end;
  @media (min-width: ${viewport7}) {
    align-self: center;
  }
`;
const NavSpan = styled.button`
  ${navButtonMixin};
`;
const NavLink = styled(Link)`
  ${navButtonMixin};
`;

export default function Header({
  session = Map(),
  setSession = () => {},
  pageName,
  userIsMe,
  post = Map(),
}) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [theme, setThemeHook] = useState(getTheme());

  useEffect(() => {
    if (theme === DARK_MODE_THEME) {
      document.body.classList.add(DARK_MODE_THEME);
      return;
    }
    document.body.classList.remove(DARK_MODE_THEME);
  });

  if (shouldRedirect) {
    return <Redirect to="/signout" />;
  }

  const shouldShowManagePost = pageName === PAGE_NAME_EDIT && post.get('id');
  const shouldShowEdit = pageName === PAGE_NAME_VIEW && post.get('canEdit');
  const shouldShowNew = pageName !== PAGE_NAME_EDIT || post.get('id');
  const shouldShowPublic = true; // pageName !== PAGE_NAME_PUBLIC;

  return (
    <>
      <HeaderStyled>
        <HeaderContentContainer>
          <LogoContainer>
            <LogoLinkStyled to="/">
              <span role="img" aria-label="hand writing with a pen">
                ✍️
              </span>{' '}
              filbert
            </LogoLinkStyled>
          </LogoContainer>
        </HeaderContentContainer>
        <HeaderContentContainer>
          {session.get('userId') ? (
            <>
              <NavSpan
                id="dark-mode-toggle"
                onClick={() => {
                  if (theme === DARK_MODE_THEME) {
                    document.body.classList.remove(DARK_MODE_THEME);
                    setTheme(LIGHT_MODE_THEME);
                    setThemeHook(LIGHT_MODE_THEME);
                    return;
                  }
                  document.body.classList.add(DARK_MODE_THEME);
                  setTheme(DARK_MODE_THEME);
                  setThemeHook(DARK_MODE_THEME);
                }}
              >
                {theme === DARK_MODE_THEME ? '☀️' : '🌑'}
              </NavSpan>
              {shouldShowManagePost && (
                <NavLink to={createNextUrl(`/publish/${post.get('id')}`)}>
                  publish
                </NavLink>
              )}
              {shouldShowEdit && (
                <NavLink to={`/edit/${post.get('id')}`}>edit</NavLink>
              )}
              {shouldShowNew && <NavLink to="/edit/new">new</NavLink>}
              {shouldShowPublic && <NavLink to="/public">public</NavLink>}
              <NavLink to="/private">private</NavLink>
              {userIsMe ? (
                <NavSpan
                  id="signed-in-user"
                  onClick={() => {
                    if (confirm('Sign out?')) {
                      setShouldRedirect(true);
                      signout();
                      setSession(Map());
                    }
                  }}
                >
                  sign out
                </NavSpan>
              ) : (
                <NavLink id="signed-in-user" to="/me">
                  {session.get('username')}
                </NavLink>
              )}
            </>
          ) : (
            <>
              {shouldShowPublic && <NavLink to="/public">public</NavLink>}
              <NavLink id="signed-in-user" to="/signin">
                join or sign in
              </NavLink>
            </>
          )}
        </HeaderContentContainer>
      </HeaderStyled>
      <HeaderSpacer />
    </>
  );
}
