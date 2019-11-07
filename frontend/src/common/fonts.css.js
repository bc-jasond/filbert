import { createGlobalStyle } from 'styled-components';

import Charter from '../../assets/fonts/charter-regular-webfont.woff';
import CharterBold from '../../assets/fonts/charter-bold-webfont.woff';
import CharterItalic from '../../assets/fonts/charter-italic-webfont.woff';
import Kievit from '../../assets/fonts/kievit-ot-book.woff';
import FiraCode from '../../assets/fonts/fira-code-regular.woff';

export const titleSerif = 'filbert-title-serif';
export const contentSerif = 'filbert-content-serif';
export const italicSerif = 'filbert-italic-serif';
export const sansSerif = 'filbert-sans-serif';
export const monospaced = 'filbert-monospace';

export default createGlobalStyle`
    @font-face {
        font-family: ${titleSerif};
        font-weight: 400;
        font-style: normal;
        src: url(${CharterBold});
        format('woff');
    }
    @font-face {
        font-family: ${contentSerif};
        font-weight: 400;
        font-style: normal;
        src: url(${Charter});
        format('woff');
    }
    @font-face {
        font-family: ${italicSerif};
        font-weight: 400;
        font-style: normal;
        src: url(${CharterItalic});
        format('woff');
    }
    @font-face {
        font-family: ${sansSerif};
        font-weight: 400;
        font-style: normal;
        src: url(${Kievit});
        format('woff');
    }
    @font-face {
        font-family: ${monospaced};
        font-weight: 400;
        font-style: normal;
        src: url(${FiraCode});
        format('woff');
    }
`;