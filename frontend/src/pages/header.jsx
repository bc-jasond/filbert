import { Map } from 'immutable';
import React from 'react';
import { Redirect } from 'react-router-dom';
import {
  HeaderContentContainer,
  HeaderSpacer,
  HeaderStyled,
  LogoLinkStyled,
  NavLink,
  NavSpan
} from '../common/components/layout-styled-components';
import { PAGE_NAME_EDIT, PAGE_NAME_VIEW } from '../common/constants';
import { signout } from '../common/session';

export default class Header extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      shouldRedirect: null
    };
  }

  render() {
    const {
      props: {
        session,
        setSession = () => {},
        pageName,
        userIsMe,
        post = Map(),
        togglePostMenu = () => {},
        deletePost = () => {}
      },
      state: { shouldRedirect }
    } = this;
    if (shouldRedirect) {
      return <Redirect to="/signout" />;
    }

    const shouldShowPublish = pageName === PAGE_NAME_EDIT && post.get('id');
    const shouldShowDelete = pageName === PAGE_NAME_EDIT && post.get('id');
    const shouldShowEdit = pageName === PAGE_NAME_VIEW && post.get('canEdit');
    const shouldShowNew = pageName !== PAGE_NAME_EDIT || post.get('id');
    return (
      <>
        <HeaderStyled>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">
              <span role="img" aria-label="hand writing with a pen">
                ✍️
              </span>{' '}
              filbert
            </LogoLinkStyled>
            {session?.userId ? (
              <>
                {shouldShowPublish && (
                  <NavSpan onClick={togglePostMenu}>publish</NavSpan>
                )}
                {shouldShowDelete && (
                  <NavSpan onClick={deletePost}>delete</NavSpan>
                )}
                {shouldShowEdit && (
                  <NavLink to={`/edit/${post.get('id')}`}>edit</NavLink>
                )}
                {shouldShowNew && <NavLink to="/edit/new">new</NavLink>}
                <NavLink to="/public">public</NavLink>
                <NavLink to="/private">private</NavLink>
                {userIsMe ? (
                  <NavSpan
                    onClick={() => {
                      if (confirm('Logout?')) {
                        this.setState({ shouldRedirect: true }, () => {
                          signout();
                          setSession({});
                        });
                      }
                    }}
                  >
                    logout
                  </NavSpan>
                ) : (
                  <NavLink to="/me">{session?.username}</NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/public">public</NavLink>
                <NavLink to="/signin">sign in</NavLink>
              </>
            )}
          </HeaderContentContainer>
        </HeaderStyled>
        <HeaderSpacer />
      </>
    );
  }
}
