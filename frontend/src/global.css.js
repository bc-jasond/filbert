import { createGlobalStyle } from 'styled-components';

import { contentSerif } from './common/fonts.css';

import {
  textColorPrimary,
  getVar,
  backgroundColorSecondary,
  backgroundColorPrimary,
} from './variables.css';

export default createGlobalStyle`
/*
 Overrides for the original reset at:
 http://meyerweb.com/eric/tools/css/reset/
   v2.0 | 20110126
   License: none (public domain)
*/

html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed, 
figure, figcaption, footer, header, hgroup, 
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
	color: ${getVar(textColorPrimary)};
	font-family: ${contentSerif}, serif;
	/* looks a lot more suavecito with smoothing */
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	vertical-align: baseline;
	text-rendering: optimizeLegibility;
}
body {
  background: ${getVar(backgroundColorSecondary)};
}
[contenteditable="true"] {
  outline: none;
}
#app {
  background: ${getVar(backgroundColorPrimary)};
}
`;
