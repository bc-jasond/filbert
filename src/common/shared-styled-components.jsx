import styled from 'styled-components';
import { contentSerif, italicSerif, monospaced, sansSerif, titleSerif } from './fonts.css';
import { grey } from "./css";

export const H1 = styled.h1`
  font-family: ${titleSerif}, serif;
  font-size: 42px;
  line-height: 1.25;
  margin-bottom: 24px;
`;
export const ContentSection = styled.section`
  font-family: ${contentSerif}, serif;
  font-size: 21px;
  line-height: 1.58;
  letter-spacing: -.01em;
  margin-bottom: 40px;
`;
export const SpacerSection = styled(ContentSection)`
  line-height: 0;
  &::after {
    content: '\\00a0';
    display: block;
    margin: 0 auto;
    border-bottom: 1px solid ${grey};
    width: 88px;
  }
`;
export const P = styled.p`
  margin-bottom: 16px;
`;
export const SourceCode = styled.code`
  display: inline-block;
  font-family: ${monospaced}, monospace;
  font-size: 18px;
  background: rgba(0,0,0,.05);
  padding: 0 4px;
  margin: 0 2px;
`;
export const SiteInfo = styled.span`
  display: inline-block;
  font-family: ${sansSerif}, sans-serif;
`;
export const ItalicText = styled.span`
  display: inline-block;
  font-family: ${italicSerif}, sans-serif;
`;