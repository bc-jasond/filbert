import { createGlobalStyle } from 'styled-components';

// Medium style fonts
import Charter from '../assets/fonts/charter-regular-webfont.woff';
import CharterBold from '../assets/fonts/charter-bold-webfont.woff';
import CharterItalic from '../assets/fonts/charter-italic-webfont.woff';
import Kievit from '../assets/fonts/kievit-ot-book.woff';
import FiraCode from '../assets/fonts/fira-code-regular.woff';

// Apple style fonts
import SFProDisplay from '../assets/fonts/sf-pro-display_regular.woff2';
import SFProText from '../assets/fonts/sf-pro-text_regular.woff2';
import SFProTextItalic from '../assets/fonts/sf-pro-text_regular-italic.woff2';
import NYMedium from '../assets/fonts/ny-medium_regular.woff';
import SFMono from '../assets/fonts/sf-mono_regular.woff';

export const titleSerif = 'filbert-title-serif';
export const contentSerif = 'filbert-content-serif';
export const italicSerif = 'filbert-italic-serif';
export const sansSerif = 'filbert-sans-serif';
export const monospaced = 'filbert-monospace';

export const titleSerifAlt = 'filbert-title-alt';
export const contentSerifAlt = 'filbert-content-alt';
export const italicSerifAlt = 'filbert-italic-alt';
export const sansSerifAlt = 'filbert-sans-alt';
export const monospacedAlt = 'filbert-monospace-alt';

export default createGlobalStyle`
    // DEFAULT
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
    // ALT
    @font-face {
        font-family: ${titleSerifAlt};
        font-weight: 400;
        font-style: normal;
        src: url(${SFProDisplay});
        format('woff2');
    }
    @font-face {
        font-family: ${contentSerifAlt};
        font-weight: 400;
        font-style: normal;
        src: url(${SFProText});
        format('woff2');
    }
    @font-face {
        font-family: ${italicSerifAlt};
        font-weight: 400;
        font-style: normal;
        src: url(${SFProTextItalic});
        format('woff2');
    }
    @font-face {
        font-family: ${sansSerifAlt};
        font-weight: 400;
        font-style: normal;
        src: url(${NYMedium});
        format('woff');
    }
    @font-face {
        font-family: ${monospacedAlt};
        font-weight: 400;
        font-style: normal;
        src: url(${SFMono});
        format('woff');
    }
`;
