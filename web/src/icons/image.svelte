<script>
  export let useIconMixin = false;
  export let selected = false;
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  version="1.1"
  viewBox="0 0 100 100"
  class:svg-icon-mixin="{useIconMixin}"
  class:selected
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M63.5,51.3c-1-1.2-2.8-1.2-3.7,0l-2,2.5c-1.1,1.4-3.2,1.4-4.4,0l-7.3-8.9
    c-1.3-1.6-3.8-1.6-5.1,0L21.9,68.6c-1.2,1.5-1.2,3.2,0.9,5.2c3.4,3.3,11.1,12.3,27.2,12.3s24.8-10,27.4-12.9
    c1.6-1.7,1.8-2.7,0.8-3.9L63.5,51.3z
    M78.6,32.8c0.4,3.4-2,6.4-5.4,6.8c-3.4,0.4-6.4-2-6.8-5.4c-0.4-3.4,2-6.4,5.4-6.8
    C75.1,27,78.2,29.4,78.6,32.8z
    M50,95c24.9,0,45-20.1,45-45C95,25.1,74.9,5,50,5C25.1,5,5,25.1,5,50C5,74.9,25.1,95,50,95z"
  ></path>
</svg>
