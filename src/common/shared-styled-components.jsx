import styled from 'styled-components';
import { contentSerif, italicSerif, monospaced, sansSerif, titleSerif } from './fonts.css';
import { grey } from "./css";

export const H1 = styled.h1`
  font-family: ${titleSerif}, serif;
  font-size: 42px;
  line-height: 1.25;
  margin-bottom: 24px;
`;
export const H2 = styled.h2`
  margin-top: 30px;
  margin-bottom: 8px;
  font-weight: 600;
  --x-height-multiplier: 0.342;
  --baseline-multiplier: 0.22;
  font-family: ${sansSerif},sans-serif;
  letter-spacing: -.02em;
  font-style: normal;
  font-size: 26px;
  line-height: 1.22;
  letter-spacing: -.012em;
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
  margin-bottom: 32px;
`;
export const Pre = styled.pre``;
export const CodeSection = styled(ContentSection)`
  font-family: ${monospaced}, monospace;
  font-size: 16px;
  letter-spacing: -.03em;
  word-spacing: -.2em;
  line-height: 1.75;
  background: rgba(0,0,0,.05);
  padding: 20px;
  overflow-x: scroll;
  ${Pre} {
    font: inherit;
    margin: 0;  
  }
`;
export const Ol = styled.ol`
  margin-bottom: 38px;
  counter-reset: post;
  padding: 0;
  list-style: none;
  list-style-image: none;
  word-break: break-word;
  word-wrap: break-word;
  visibility: visible;
`;
export const Li = styled.li`
  margin-left: 30px;
  margin-bottom: 14px;
  &::before {
    padding-right: 12px;
    counter-increment: post;
    content: counter(post) ".";
    position: absolute;
    display: inline-block;
    box-sizing: border-box;
    width: 78px;
    margin-left: -78px;
    text-align: right;
  }
`;
export const A = styled.a`
  text-decoration: none;
  background-repeat: repeat-x;
  background-image: linear-gradient(to right,rgba(0,0,0,.84) 100%,rgba(0,0,0,0) 0);
  background-image: linear-gradient(to right,currentColor 100%,currentColor 0);
  background-size: 1px 1px;
  background-position: 0 1.05em;
  background-position: 0 calc(1em + 1px);
`;
export const Code = styled.code`
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