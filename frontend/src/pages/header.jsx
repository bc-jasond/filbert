import { Map } from 'immutable';
import React, { useEffect, useRef, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { LogoLinkStyled } from '../common/components/layout-styled-components';
import { navButtonMixin } from '../common/components/shared-styled-components-mixins';
import {
  DARK_MODE_THEME,
  PAGE_NAME_EDIT,
  PAGE_NAME_VIEW,
  SANS_FONT_THEME,
} from '../common/constants';
import { createNextUrl } from '../common/dom';
import { signout } from '../common/session';
import { useLoading } from '../common/use-loading.hook';
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

const pulse = keyframes`
  0%, 100% {
    opacity: 0.30;
  }
  60% {
    opacity: 1;
  }
`;
const Loader = styled.span`
  font: inherit;
  color: inherit;
  animation: 2s ${pulse} linear infinite;
`;
function HeaderLogo({ loading }) {
  const timeoutRef = useRef();
  const baseText = 'filbert';
  const [frameCount, setFrameCount] = useState(0);
  const [loadingText, setLoadingText] = useState(baseText);
  useEffect(() => {
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        if (frameCount < 8) {
          setLoadingText(`${baseText}`);
        } else if (frameCount < 16) {
          setLoadingText(`${baseText}.`);
        } else if (frameCount < 24) {
          setLoadingText(`${baseText}..`);
        } else if (frameCount < 32) {
          setLoadingText(`${baseText}...`);
        }
        setFrameCount(frameCount + 1 > 60 ? 0 : frameCount + 1);
      }, 28);
    }
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [loading, frameCount]);
  return (
    <LogoLinkStyled to="/p/homepage">
      <span role="img" aria-label="hand writing with a pen">
        ✍️
      </span>{' '}
      {loading ? <Loader>{loadingText}</Loader> : 'filbert'}
    </LogoLinkStyled>
  );
}

export default function Header({
  session = Map(),
  setSession = () => {},
  theme,
  toggleTheme,
  font,
  toggleFont,
  pageName,
  userIsMe,
  post = Map(),
}) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { loading } = useLoading();
  console.log('Header loading: ', loading);

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
            <HeaderLogo loading={loading} />
          </LogoContainer>
        </HeaderContentContainer>
        <HeaderContentContainer>
          {session.get('userId') ? (
            <>
              <NavSpan
                id="font-mode-toggle"
                title="font style"
                onClick={toggleFont}
              >
                {font === SANS_FONT_THEME ? '🖋' : '✏️'}
              </NavSpan>
              <NavSpan
                id="dark-mode-toggle"
                title="dark mode"
                onClick={toggleTheme}
              >
                {theme === DARK_MODE_THEME ? '☀️' : '🌑'}
              </NavSpan>
              {shouldShowManagePost && (
                <NavLink to={createNextUrl(`/manage/${post.get('id')}`)}>
                  manage
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
              <NavSpan
                id="font-mode-toggle"
                title="font style"
                onClick={toggleFont}
              >
                {font === SANS_FONT_THEME ? '🖋' : '✏️'}
              </NavSpan>
              <NavSpan
                id="dark-mode-toggle"
                title="dark mode"
                onClick={toggleTheme}
              >
                {theme === DARK_MODE_THEME ? '☀️' : '🌑'}
              </NavSpan>
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
