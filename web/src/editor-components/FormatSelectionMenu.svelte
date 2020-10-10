<script>
  export let nodeModel = Map();
  export let selectionModel = Map();
  export let selectionAction;
  export let offsetTop;
  export let offsetLeft;
  export let updateLinkUrl;
  export let closeMenu;

  import { Map } from 'immutable';
  import { beforeUpdate, onMount } from 'svelte';

  import {
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_H1,
    SELECTION_ACTION_H2,
    NODE_TYPE_H1,
    NODE_TYPE_H2,
  } from '../common/constants';

  import { stopAndPrevent } from '../common/utils';

  import Cursor from '../form-components/Cursor.svelte';
  import IconButton from '../form-components/IconButton.svelte';
  import IconBold from '../icons/bold.svelte';
  import IconItalic from '../icons/italic.svelte';
  import IconCode from '../icons/code.svelte';
  import IconSiteinfo from '../icons/info.svelte';
  import IconStrikethrough from '../icons/strikethrough.svelte';
  import IconLink from '../icons/link.svelte';
  import IconH1 from '../icons/h1.svelte';
  import IconH2 from '../icons/h2.svelte';
  import IconMini from '../icons/mini.svelte';

  $: boldIsEnabled = selectionModel.get(SELECTION_ACTION_BOLD);
  $: italicIsEnabled = selectionModel.get(SELECTION_ACTION_ITALIC);
  $: codeIsEnabled = selectionModel.get(SELECTION_ACTION_CODE);
  $: siteinfoIsEnabled = selectionModel.get(SELECTION_ACTION_SITEINFO);
  $: miniIsEnabled = selectionModel.get(SELECTION_ACTION_MINI);
  $: strikethroughIsEnabled = selectionModel.get(
    SELECTION_ACTION_STRIKETHROUGH
  );
  $: linkIsEnabled = selectionModel.get(SELECTION_ACTION_LINK);
  $: h1IsEnabled = nodeModel.get('type') === NODE_TYPE_H1;
  $: h2IsEnabled = nodeModel.get('type') === NODE_TYPE_H2;

  let formatSelectionMenuDomNode;
  let linkUrlInputDomNode;
  let isMenuOpen = true;
  const linkMenuItemIdx = 6;
  let currentIdx = selectionModel.get(SELECTION_ACTION_LINK)
    ? linkMenuItemIdx
    : -1;

  beforeUpdate(() => {
    if (formatSelectionMenuDomNode) {
      // 44 is the height of menu, 10 is the height of arrow point
      formatSelectionMenuDomNode.style.top = `${
        offsetTop - 120 - (selectionModel.get(SELECTION_ACTION_LINK) ? 30 : 0)
      }px`;
      // 203 is half the width of the menu
      formatSelectionMenuDomNode.style.left = `${offsetLeft - 203}px`;
    }
  });

  function handleKeyDown(evt) {}

  onMount(() => {
    // `capture: true` AKA "capture phase" will put this event handler in front of the ones set by edit.jsx
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    // override top level mouseup handler
    function noop(e) {
      if (formatSelectionMenuDomNode.contains(e.target)) {
        stopAndPrevent(e);
      }
    }
    window.addEventListener('mouseup', noop, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      });
      window.removeEventListener('mouseup', noop, {
        capture: true,
      });
    };
  });

  function isFormatEnabled(type) {
    if (
      nodeModel.get('type') === NODE_TYPE_H1 &&
      type === SELECTION_ACTION_H1
    ) {
      return true;
    }
    if (
      nodeModel.get('type') === NODE_TYPE_H2 &&
      type === SELECTION_ACTION_H2
    ) {
      return true;
    }
    return selectionModel.get(type) || undefined;
  }
</script>

<style>
  #format-selection-menu {
    display: none;
  }
  #format-selection-menu.open {
    display: block;
  }
  .svg-container {
    height: 21px;
    width: 21px;
    margin-bottom: 4px;
  }
  .button-separator {
    display: inline-block;
    vertical-align: middle;
    width: 1px;
    margin: 0 6px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
  }
  input {
    height: 0;
    padding: 0;
    transition: 0.05s height;
  }
  input.enabled {
    padding: 0 12px 12px;
    height: 30px;
  }
</style>

<div
  id="format-selection-menu"
  class="lil-sassy-menu"
  data-is-menu
  bind:this="{formatSelectionMenuDomNode}"
  class:open="{isMenuOpen}"
>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_BOLD}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_BOLD)}"
  >
    <div class="svg-container">
      <IconBold useIconMixin selected="{boldIsEnabled}" />
    </div>
    {#if currentIdx === 0}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_ITALIC}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_ITALIC)}"
  >
    <div class="svg-container">
      <IconItalic useIconMixin selected="{italicIsEnabled}" />
    </div>
    {#if currentIdx === 1}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_CODE}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_CODE)}"
  >
    <div class="svg-container">
      <IconCode useIconMixin selected="{codeIsEnabled}" />
    </div>
    {#if currentIdx === 2}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_SITEINFO}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_SITEINFO)}"
  >
    <div class="svg-container">
      <IconSiteinfo useIconMixin selected="{siteinfoIsEnabled}" />
    </div>
    {#if currentIdx === 3}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_MINI}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_MINI)}"
  >
    <div class="svg-container">
      <IconMini useIconMixin selected="{miniIsEnabled}" />
    </div>
    {#if currentIdx === 4}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_STRIKETHROUGH}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_STRIKETHROUGH)}"
  >
    <div class="svg-container">
      <IconStrikethrough useIconMixin selected="{strikethroughIsEnabled}" />
    </div>
    {#if currentIdx === 5}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_LINK}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_LINK)}"
  >
    <div class="svg-container">
      <IconLink useIconMixin selected="{linkIsEnabled}" />
    </div>
    {#if currentIdx === 6}
      <Cursor />
    {/if}
  </IconButton>
  <div class="button-separator"></div>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_H1}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_H1)}"
  >
    <div class="svg-container">
      <IconH1 useIconMixin selected="{h1IsEnabled}" />
    </div>
    {#if currentIdx === 7}
      <Cursor />
    {/if}
  </IconButton>
  <IconButton
    id="{`format-selection-menu-${SELECTION_ACTION_H2}`}"
    on:click="{() => selectionAction(SELECTION_ACTION_H2)}"
  >
    <div class="svg-container">
      <IconH2 useIconMixin selected="{h2IsEnabled}" />
    </div>
    {#if currentIdx === 8}
      <Cursor />
    {/if}
  </IconButton>
  <input
    id="format-selection-menu-link-url-input"
    class="dark-input"
    placeholder="Enter URL here..."
    bind:this="{linkUrlInputDomNode}"
    class:enabled="{selectionModel.get(SELECTION_ACTION_LINK)}"
    on:input="{(e) => updateLinkUrl(e.target.value)}"
    value="{selectionModel.get(SELECTION_LINK_URL, '')}"
  />
  <div class="point-clip">
    <div class="arrow"></div>
  </div>
</div>
