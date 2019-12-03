import React from 'react';
import styled from 'styled-components';
import { ContentSection, H2Styled, LinkStyled, PStyled, SiteInfo } from './shared-styled-components';

export default class PostLink extends React.PureComponent {
  render() {
    console.debug("PostLink RENDER", this);
    const { node } = this.props;
    const to = node.getIn(['meta', 'to']);
    const Centered = styled.div`
          text-align: center;
        `;
    const PLarger = styled(PStyled)`
          font-size: larger;
        `;
    return (
      <Centered>
        <ContentSection>
          <PLarger><SiteInfo>Thanks for reading</SiteInfo></PLarger>
        </ContentSection>
        {to && (
          <H2Styled>
            Next Post 👉 <LinkStyled to={to}>{node.get('content')}</LinkStyled>
          </H2Styled>
        )}
        <H2>
          👈 <LinkStyled to="/posts">Back to all Posts</LinkStyled>
        </H2>
      </Centered>
    )
  }
}
