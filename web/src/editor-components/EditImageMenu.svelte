<script>
  export let offsetTop;
  export let offsetLeft = 0;
  export let nodeModel;
  export let shouldHideCaption = false;
  export let update;
  export let closeMenu;

  import { beforeUpdate, onMount } from 'svelte';
  import { Map } from 'immutable';

  import {
    KEYCODE_LEFT_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_SPACE,
    KEYCODE_BACKSPACE,
    KEYCODE_TAB,
    KEYCODE_ENTER,
    KEYCODE_ESC,
  } from '@filbert/constants';
  import { getApiClientInstance } from '../common/api-client';
  import {
    caretIsAtBeginningOfInput,
    caretIsAtEndOfInput,
    getImageFileFormData,
    focusAndScrollSmooth,
  } from '../common/dom.mjs';
  import { stopAndPrevent } from '../common/utils';
  import { currentPost } from '../stores';

  import IconButton from '../form-components/IconButton.svelte';
  import Cursor from '../form-components/Cursor.svelte';
  import IconImage from '../icons/image.svelte';
  import IconRotate from '../icons/rotate.svelte';
  import IconPlusPx from '../icons/plus-px.svelte';
  import IconMinusPx from '../icons/minus-px.svelte';

  // in order of menu icons for keyboard input support
  const clickHandlers = [
    () => fileInputDomNode.click(),
    imageRotate,
    imageResizeUp,
    imageResizeDown,
  ];

  const captionInputIdx = 4;
  const lastButtonIdx = shouldHideCaption ? 3 : captionInputIdx;

  let currentIdx = shouldHideCaption ? 0 : captionInputIdx;
  let fileInputDomNode;
  let captionInputDomNode;

  onMount(() => {
    function focusOrBlurCaptionInput(shouldFocusEnd) {
      if (!captionInputDomNode) return;
      if (currentIdx === captionInputIdx) {
        focusAndScrollSmooth(
          nodeModel.get('id'),
          captionInputDomNode,
          shouldFocusEnd
        );
        return;
      }
      captionInputDomNode.blur();
    }

    function handleKeyDown(evt) {
      // override the top level handlers in the Editor
      if (
        [
          KEYCODE_LEFT_ARROW,
          KEYCODE_RIGHT_ARROW,
          KEYCODE_TAB,
          KEYCODE_ENTER,
          KEYCODE_ESC,
          KEYCODE_BACKSPACE,
        ].includes(evt.keyCode)
      ) {
        evt.stopPropagation();
      }
      if (
        (evt.keyCode === KEYCODE_TAB && evt.shiftKey) ||
        (evt.keyCode === KEYCODE_LEFT_ARROW &&
          (currentIdx < lastButtonIdx || caretIsAtBeginningOfInput()))
      ) {
        currentIdx = currentIdx === 0 ? lastButtonIdx : currentIdx - 1;
        focusOrBlurCaptionInput(true);
        evt.preventDefault();
        return;
      }
      if (
        evt.keyCode === KEYCODE_TAB ||
        (evt.keyCode === KEYCODE_RIGHT_ARROW &&
          (currentIdx < lastButtonIdx || caretIsAtEndOfInput()))
      ) {
        currentIdx = currentIdx === lastButtonIdx ? 0 : currentIdx + 1;
        focusOrBlurCaptionInput(false);
        evt.preventDefault();
        return;
      }
      if (
        evt.keyCode === KEYCODE_SPACE &&
        currentIdx > -1 &&
        currentIdx < captionInputIdx
      ) {
        if (currentIdx > -1) {
          clickHandlers[currentIdx]();
        }
        evt.preventDefault();
      }
      if (evt.keyCode === KEYCODE_ENTER || evt.keyCode === KEYCODE_ESC) {
        closeMenu();
      }
    }

    // `capture: true` AKA "capture phase" will put this event handler in front of the ones set by edit.jsx
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    // override top level mouseup handler
    function noop(e) {
      if (editImageMenuDomNode.contains(e.target)) {
        stopAndPrevent(e);
      }
    }
    window.addEventListener('mouseup', noop, { capture: true });
    focusOrBlurCaptionInput();

    return () => {
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      });
      window.removeEventListener('mouseup', noop, {
        capture: true,
      });
    };
  });

  let editImageMenuDomNode;
  beforeUpdate(() => {
    if (!editImageMenuDomNode) {
      return;
    }
    editImageMenuDomNode.style.top = `${offsetTop - 60}px`;
    editImageMenuDomNode.style.left = offsetLeft ? `${offsetLeft}px` : '50%';
  });

  function imageRotate() {
    const currentRotationDegrees = nodeModel.getIn(
      ['meta', 'rotationDegrees'],
      0
    );
    const updatedRotationDegrees =
      currentRotationDegrees === 270 ? 0 : currentRotationDegrees + 90;
    const updatedNodeModel = nodeModel.setIn(
      ['meta', 'rotationDegrees'],
      updatedRotationDegrees
    );
    update(updatedNodeModel);
  }
  function _resize(shouldMakeBigger) {
    const maxSizeAllowedInPixels = 1000;
    const resizeAmountPercentage = 0.1; // +/- by 10% at a time
    // plus/minus buttons resize the image by a fixed amount
    const originalWidth = nodeModel.getIn(['meta', 'width']);
    const currentResizeWidth = nodeModel.getIn(
      ['meta', 'resizeWidth'],
      originalWidth
    );
    const originalHeight = nodeModel.getIn(['meta', 'height']);
    const currentResizeHeight = nodeModel.getIn(
      ['meta', 'resizeHeight'],
      originalHeight
    );
    const resizeAmountWidth = resizeAmountPercentage * originalWidth;
    const resizeAmountHeight = resizeAmountPercentage * originalHeight;
    // no-op because image is already biggest/smallest allowed?
    if (
      // user clicked plus but image is already max size
      (shouldMakeBigger &&
        (currentResizeHeight + resizeAmountHeight > maxSizeAllowedInPixels ||
          currentResizeWidth + resizeAmountWidth > maxSizeAllowedInPixels)) ||
      // user clicked minus but image is already min size
      (!shouldMakeBigger &&
        (currentResizeHeight - resizeAmountHeight < resizeAmountHeight ||
          currentResizeWidth - resizeAmountWidth < resizeAmountWidth))
    ) {
      return;
    }

    const updatedNodeModel = nodeModel
      .setIn(
        ['meta', 'resizeWidth'],
        shouldMakeBigger
          ? currentResizeWidth + resizeAmountWidth
          : currentResizeWidth - resizeAmountWidth
      )
      .setIn(
        ['meta', 'resizeHeight'],
        shouldMakeBigger
          ? currentResizeHeight + resizeAmountHeight
          : currentResizeHeight - resizeAmountHeight
      );
    update(updatedNodeModel);
  }
  function imageResizeUp() {
    _resize(true);
  }
  function imageResizeDown() {
    _resize(false);
  }
  function updateCaption({ target: { value } }) {
    nodeModel.caption = value;
    update(nodeModel, 'caption');
  }
  async function replaceImageFile([firstFile]) {
    if (!firstFile) {
      // TODO: user hit cancel in the file dialog?
      return;
    }
    // TODO: add a loading indicator while uploading
    const { error, data: imageMeta } = await getApiClientInstance().uploadImage(
      getImageFileFormData(firstFile, $currentPost)
    );
    if (error) {
      console.error('Image Upload Error: ', error);
      return;
    }
    const updatedNodeModel = nodeModel
      .delete('meta')
      .set('meta', Map(imageMeta));
    update(updatedNodeModel);
  }
</script>

<style>
  #edit-image-menu {
    display: flex;
    align-items: center;
    justify-items: center;
    width: 500px;
    margin-left: -250px;
  }
  #edit-image-menu.hide-caption {
    width: 162px;
    margin-left: -81px;
  }
  .svg-container {
    height: 21px;
    width: 21px;
    margin-bottom: 4px;
  }
  .svg-container.bigger {
    height: 28px;
    width: 28px;
    margin-bottom: 0;
  }
  input[type='file'] {
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
  <IconButton on:click="{clickHandlers[0]}">
    <div class="svg-container">
      <IconImage useIconMixin selected="{currentIdx === 0}" />
    </div>
    {#if currentIdx === 0}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton on:click="{clickHandlers[1]}">
    <div class="svg-container">
      <IconRotate useIconMixin selected="{currentIdx === 1}" />
    </div>
    {#if currentIdx === 1}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton on:click="{clickHandlers[2]}">
    <div class="svg-container bigger">
      <IconPlusPx useIconMixin selected="{currentIdx === 2}" />
    </div>
    {#if currentIdx === 2}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton on:click="{clickHandlers[3]}">
    <div class="svg-container bigger">
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
      on:click="{() => (currentIdx = captionInputIdx)}"
      on:focus="{() => (currentIdx = captionInputIdx)}"
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
