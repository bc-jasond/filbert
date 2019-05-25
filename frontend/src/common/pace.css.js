import { createGlobalStyle } from 'styled-components';

export default createGlobalStyle`
  .pace {
    -webkit-pointer-events: none;
    pointer-events: none;

    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
  }

  .pace-inactive {
    display: none;
  }

  .pace .pace-progress {
    background: rgba(0,0,0,.24);
    position: fixed;
    z-index: 2000;
    top: 0;
    right: 100%;
    width: 100%;
    height: 2px;
  }
`;