<script>
  export let loading;
  export let dark = false;
</script>

<style>
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  svg {
    fill: white;
    position: absolute;
    z-index: 2;
    display: inline-block;
    opacity: 0;
    pointer-events: none;
    margin-top: 32px;
    width: 32px;
    height: 32px;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    animation-name: spin;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }
  .loading {
    opacity: 1;
    margin-top: -4px;
  }
  .dark {
    opacity: 1;
    fill: var(--filbert-darkGrey);
  }
</style>

<svg
  class="spinner"
  class:loading
  class:dark
  width="100%"
  height="100%"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 100 100"
  preserveAspectRatio="xMidYMid"
>
  <g transform="rotate(0 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(30 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(60 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(90 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(120 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(150 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(180 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(210 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(240 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(270 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(300 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
  <g transform="rotate(330 50 50)">
    <rect x="47" y="2" rx="0" ry="0" width="6" height="24"></rect>
  </g>
</svg>
