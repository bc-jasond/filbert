import * as React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  position: absolute;
  justify-content: center;
  align-items: center;
`;
const H1 = styled.h1`
  text-align: center;
  font-size: 72px;
`;

export default () => (
  <Container>
    <H1>404 - Not Found</H1>
  </Container>
);
