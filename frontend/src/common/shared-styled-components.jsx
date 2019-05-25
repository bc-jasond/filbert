import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import { contentSerif, italicSerif, monospaced, sansSerif, titleSerif } from './fonts.css';
import { darkGrey, grey } from "./css";

const sectionWidthMixin = css`
  max-width: 740px;
  margin: 0 auto;
`;
export const H1 = styled.h1`
  ${sectionWidthMixin}
  font-family: ${titleSerif}, serif;
  font-size: 46px;
  line-height: 1.25;
  margin-bottom: 24px;
`;
export const H2 = styled.h2`
 ${sectionWidthMixin}
  margin-top: 30px;
  margin-bottom: 8px;
  font-weight: 600;
  --x-height-multiplier: 0.342;
  --baseline-multiplier: 0.22;
  font-family: ${sansSerif},sans-serif;
  letter-spacing: -.02em;
  font-style: normal;
  font-size: 32px;
  line-height: 1.22;
  letter-spacing: -.012em;
`;
export const H3 = styled.h3`
  text-overflow: ellipsis;
  max-height: 56px;
  overflow: hidden;
  letter-spacing: -0.47px;
  font-size: 25.2px;
  line-height: 28px;
  font-weight: 600;
  font-style: normal;
  font-family: ${sansSerif}, sans-serif;
`;
export const ContentSection = styled.section`
  ${sectionWidthMixin}
  font-family: ${contentSerif}, serif;
  font-size: 21px;
  line-height: 1.58;
  letter-spacing: -.01em;
  margin-bottom: 52px;
`;
export const SpacerSection = styled(ContentSection)`
  &::after {
    content: '✎﹏﹏﹏﹏﹏﹏﹏﹏﹏';
    text-align: center;
    display: block;
    margin: 0 auto;
    width: 266px;
  }
`;
export const ImageSection = styled(ContentSection)`
  max-width: 1000px;
  margin: 0 auto 52px;
`;
export const P = styled.p`
  margin-bottom: 32px;
`;
export const Pre = styled.pre``;
export const CodeSection = styled(ContentSection)`
  font-family: ${monospaced}, monospace;
  font-size: 16px;
  max-height: 350px;
  letter-spacing: -.03em;
  word-spacing: -.2em;
  line-height: 1.75;
  background: rgba(0,0,0,.05);
  padding: 20px;
  overflow: auto;
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
const linkMixin = css`
  font: inherit;
  text-decoration: none;
  background-repeat: repeat-x;
  background-image: linear-gradient(to right,${darkGrey} 100%,rgba(0,0,0,0) 0);
  background-image: linear-gradient(to right,currentColor 100%,currentColor 0);
  background-size: 1px 1px;
  background-position: 0 1.05em;
  background-position: 0 calc(1em + 1px);
`;
export const A = styled.a`
 ${linkMixin}
`;
export const LinkStyled = styled(Link)`
 ${linkMixin}
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
  font-family: ${italicSerif}, sans-serif;
`;
export const StrikeText = styled.span`
  text-decoration: line-through;
`;
export const Figure = styled.figure`
  padding: 5px 0;
  position: relative;
`;
export const FigureCaption = styled.figcaption`
  font-family: ${sansSerif}, sans-serif;
  font-weight: 300;
  font-style: normal;
  font-size: 16px;
  line-height: 1.4;
  color: rgba(0,0,0,.68);
  letter-spacing: 0;
  text-align: center;
  margin: 10px auto 0;
`;
export const ImagePlaceholderContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 auto;
  ${p => `
    max-width: ${p.w}px;
    max-height: ${p.h}px;
  `}
`;
export const ImagePlaceholderFill = styled.div`
  ${p => `padding-bottom: ${(p.h / p.w) * 100}%;`}
`;
export const Img = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: block;
  max-width: 100%;
  border: 0;
`;