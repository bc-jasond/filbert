<script>
  export let offsetTop;
  export let offsetLeft;
  export let nodeModel;
  export let shouldHideCaption;
  export let update;
  export let postMap;

  import { beforeUpdate } from 'svelte';

  import IconButton from '../form-components/IconButton.svelte';
  import Cursor from '../form-components/Cursor.svelte';
  import IconImage from '../icons/image.svelte';
  import IconRotate from '../icons/rotate.svelte';
  import IconPlusPx from '../icons/plus-px.svelte';
  import IconMinusPx from '../icons/minus-px.svelte';

  let currentIdx = 0;
  let fileInputDomNode;
  let captionInputDomNode;

  let editImageMenuDomNode;
  beforeUpdate(() => {
    if (!editImageMenuDomNode) {
      return;
    }
    editImageMenuDomNode.style.top = `${offsetTop + 10}px`;
    editImageMenuDomNode.style.left = offsetLeft ? `${offsetLeft}px` : '50%';
  });

  function imageRotate() {}
  function _resize(shouldMakeBigger) {}
  function imageResizeUp() {
    _resize(true);
  }
  function imageResizeDown() {
    _resize(false);
  }
  function updateCaption({ target: { value } }) {
    update(nodeModel.setIn(['meta', 'caption'], value), ['meta', 'caption']);
  }
  function replaceImageFile() {}
</script>

<style>
  #edit-image-menu {
    display: flex;
    align-items: center;
    justify-items: center;
    width: 500px;
    margin: 0 auto 0 -81px;
  }
  #edit-image-menu.hide-caption {
    width: 162px;
    /*margin-left: -250px;*/
  }
  .svg-container {
    height: 21px;
    width: 21px;
  }
  .svg-container-bigger {
    height: 28px;
    width: 28px;
  }
  input {
    display: none;
  }
</style>

<div
  id="edit-image-menu"
  class="lil-sassy-menu"
  data-is-menu
  bind:this="{editImageMenuDomNode}"
  class:hide-caption="{shouldHideCaption}"
>
  <IconButton on:click="{() => fileInputDomNode.click()}">
    <div class="svg-container">
      <IconImage useIconMixin selected="{currentIdx === 0}" />
    </div>
    {#if currentIdx === 0}
      <Cursor />
    {/if}

  </IconButton>
  <IconButton on:click="{imageRotate}">
    <div class="svg-container">
      <IconRotate useIconMixin selected="{currentIdx === 1}" />
    </div>
    {#if currentIdx === 1}
      <Cursor />
    {/if}

  </IconButton>
  <IconButton on:click="{imageResizeUp}">
    <div class="svg-container-bigger">
      <IconPlusPx useIconMixin selected="{currentIdx === 2}" />
    </div>
    {#if currentIdx === 2}
      <Cursor />
    {/if}

  </IconButton>
  <IconButton on:click="{imageResizeDown}">
    <div class="svg-container-bigger">
      <IconMinusPx useIconMixin selected="{currentIdx === 3}" />
    </div>
    {#if currentIdx === 3}
      <Cursor />
    {/if}
  </IconButton>
  {#if !shouldHideCaption}
    <input
      id="edit-image-menu-caption-input"
      class="dark-input"
      placeholder="Enter Image Caption here..."
      bind:this="{captionInputDomNode}"
      on:input="{updateCaption}"
      value="{nodeModel.getIn(['meta', 'caption'], '')}"
    />
  {/if}
  <div class="point-clip">
    <div class="arrow"></div>
  </div>
  <input
    name="edit-image-hidden-file-input"
    type="file"
    accept="image/*"
    bind:this="{fileInputDomNode}"
    on:change="{(e) => {
      replaceImageFile(e.target.files);
    }}"
    on:click|stopPropagation="{(e) => {}}"
  />
</div>
