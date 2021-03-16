<script>
  export let nodeModel = Map();
  export let formatSelection = Map();
  export let selectionAction;
  export let offsetTop;
  export let offsetLeft;
  export let updateLinkUrl;
  export let closeMenu;

  import { Map } from 'immutable';
  import { beforeUpdate, onMount, tick } from 'svelte';

  import {
    SELECTION_ACTION_LINK,
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_H1,
    SELECTION_ACTION_H2,
    bold,
    italic,
    code,
    siteinfo,
    mini,
    strikethrough,
    link,
    linkUrl,
    setLinkUrl,
  } from '@filbert/selection';
  import { getId } from '@filbert/linked-list';
  import { NODE_TYPE_H1, NODE_TYPE_H2, type } from '@filbert/document';
  import {
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_UP_ARROW,
    KEYCODE_DOWN_ARROW,
    KEYCODE_LEFT_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_SPACE,
    KEYCODE_BACKSPACE,
    KEYCODE_TAB,
  } from '@filbert/constants';

  import { stopAndPrevent, getUrl } from '../common/utils';
  import { focusAndScrollSmooth } from '../common/dom.mjs';

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

  let linkIsEnabled;

  $: boldIsEnabled = bold(formatSelection);
  $: italicIsEnabled = italic(formatSelection);
  $: codeIsEnabled = code(formatSelection);
  $: siteinfoIsEnabled = siteinfo(formatSelection);
  $: miniIsEnabled = mini(formatSelection);
  $: strikethroughIsEnabled = strikethrough(formatSelection);
  $: linkIsEnabled = link(formatSelection);
  $: {
    tick().then(() => {
      if (shouldShowLinkInput && linkUrlInputDomNode) {
        linkUrlInputDomNode.focus();
      }
    });
  }
  $: h1IsEnabled = type(nodeModel) === NODE_TYPE_H1;
  $: h2IsEnabled = type(nodeModel) === NODE_TYPE_H2;

  const menuItemTypes = [
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_ACTION_LINK,
    SELECTION_ACTION_H1,
    SELECTION_ACTION_H2,
  ];

  let formatSelectionMenuDomNode;
  let linkUrlInputDomNode;
  let shouldShowLinkInput = linkIsEnabled;
  let linkUrlHasError;
  const linkMenuItemIdx = 6;
  let currentIdx = linkIsEnabled ? linkMenuItemIdx : 0;

  beforeUpdate(() => {
    if (formatSelectionMenuDomNode) {
      // 44 is the height of menu, 10 is the height of arrow point
      formatSelectionMenuDomNode.style.top = `${
        offsetTop - 120 - (linkIsEnabled ? 30 : 0)
      }px`;
      // 203 is half the width of the menu
      formatSelectionMenuDomNode.style.left = `${offsetLeft - 203}px`;
    }
  });

  function handleKeyDown(evt) {
    // allow user to resize selection with this menu open
    // if user is holding down shift, let it through
    // TODO: need to figure out how to handle the link URL input - user should be able to highlight text in the input while holding down shift
    //  probably add UP/DOWN arrow handlers to show/hide the input when cursor is on the link SVG
    //  then add a "is link url input hidden" check here too
    if (evt.shiftKey) {
      // NOTE: don't stopPropagation for a REDO!  We want this to continue to the top level editor handlers
      if (!evt.metaKey) {
        evt.stopPropagation();
      }
      return;
    }
    // if 'link' is selected we need to let keystrokes pass through to the URL input... messy business
    // only allow 'enter' and 'esc' through to close the menu and 'left' and 'right' to toggle through
    // menu items
    if (
      linkIsEnabled &&
      [
        KEYCODE_ENTER,
        KEYCODE_ESC,
        KEYCODE_SPACE,
        KEYCODE_LEFT_ARROW,
        KEYCODE_RIGHT_ARROW,
        KEYCODE_BACKSPACE,
        KEYCODE_TAB,
      ].includes(evt.keyCode)
    ) {
      evt.stopPropagation();
    }

    const currentMenuItemType = menuItemTypes[currentIdx];

    switch (evt.keyCode) {
      case KEYCODE_UP_ARROW: {
        if (currentIdx === linkMenuItemIdx && linkIsEnabled) {
          stopAndPrevent(evt);
          shouldShowLinkInput = false;
          return;
        }
      }
      case KEYCODE_DOWN_ARROW: {
        if (currentIdx === linkMenuItemIdx && linkIsEnabled) {
          stopAndPrevent(evt);
          shouldShowLinkInput = true;
          return;
        }
      }
      case KEYCODE_LEFT_ARROW: {
        if (shouldShowLinkInput) {
          return;
        }
        evt.preventDefault();
        const nextIdx =
          currentIdx <= 0 ? menuItemTypes.length - 1 : currentIdx - 1;
        currentIdx = nextIdx;
        return;
      }
      case KEYCODE_RIGHT_ARROW: {
        if (shouldShowLinkInput) {
          return;
        }
        evt.preventDefault();
        const nextIdx =
          currentIdx === menuItemTypes.length - 1 ? 0 : currentIdx + 1;
        currentIdx = nextIdx;
        return;
      }
      case KEYCODE_TAB: {
        evt.preventDefault();
        const nextIdx =
          currentIdx === menuItemTypes.length - 1 ? 0 : currentIdx + 1;
        if (currentIdx === linkMenuItemIdx) {
          shouldShowLinkInput = false;
        } else if (nextIdx === linkMenuItemIdx && linkIsEnabled) {
          shouldShowLinkInput = true;
        }
        currentIdx = nextIdx;
        return;
      }
      case KEYCODE_ESC: {
        evt.preventDefault();
        closeMenu();
        return;
      }
      case KEYCODE_SPACE: {
        if (shouldShowLinkInput) {
          return;
        }
        evt.preventDefault();
        if (currentIdx === linkMenuItemIdx) {
          shouldShowLinkInput = !formatSelection.get(currentMenuItemType);
        }
        selectionAction(currentMenuItemType);
        return;
      }
      case KEYCODE_ENTER: {
        evt.preventDefault();
        closeMenu();
        if (formatSelection.get(currentMenuItemType)) {
          // this value is currently selected, don't unselect it. just close the menu
          return;
        }
        selectionAction(currentMenuItemType);
      }
      default:
        break;
    }
  }

  onMount(() => {
    function focusOrBlurCaptionInput(shouldFocusEnd) {
      if (!linkUrlInputDomNode) return;
      if (linkIsEnabled) {
        focusAndScrollSmooth(
          getId(nodeModel),
          linkUrlInputDomNode,
          shouldFocusEnd
        );
        return;
      }
      linkUrlInputDomNode.blur();
    }
    // `capture: true` AKA "capture phase" will put this event handler in front of the ones set by edit.jsx
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    // override top level Editor mouseup, keyup handlers
    function mouseupHandler(e) {
      if (formatSelectionMenuDomNode.contains(e.target)) {
        stopAndPrevent(e);
      }
    }
    window.addEventListener('mouseup', mouseupHandler, { capture: true });
    function stop(e) {
      e.stopPropagation();
    }
    window.addEventListener('keyup', stop, { capture: true });
    window.addEventListener('cut', stop, { capture: true });
    window.addEventListener('paste', stop, { capture: true });
    focusOrBlurCaptionInput();

    return () => {
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      });
      window.removeEventListener('mouseup', mouseupHandler, {
        capture: true,
      });
      window.removeEventListener('keyup', stop, { capture: true });
      window.removeEventListener('cut', stop, { capture: true });
      window.removeEventListener('paste', stop, { capture: true });
    };
  });

  function maybeUpdateLinkUrl(e) {
    const userInput = e.target.value;
    const maybeLink = getUrl(userInput);
    if (maybeLink) {
      linkUrlHasError = false;
      updateLinkUrl(maybeLink);
      return;
    }
    linkUrlHasError = true;
    formatSelection = setLinkUrl(formatSelection, e.target.value);
  }
</script>

<style>
  #format-selection-menu {
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
    padding: 12px;
    margin-bottom: 8px;
    height: 30px;
  }
  .error {
    color: var(--filbert-error);
  }
</style>

<div
  id="format-selection-menu"
  class="lil-sassy-menu"
  data-is-menu
  bind:this="{formatSelectionMenuDomNode}"
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
    on:click="{() => {
      shouldShowLinkInput = !shouldShowLinkInput;
      selectionAction(SELECTION_ACTION_LINK);
    }}"
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
    class:error="{linkUrlHasError}"
    placeholder="Enter URL here..."
    bind:this="{linkUrlInputDomNode}"
    class:enabled="{shouldShowLinkInput}"
    on:input="{maybeUpdateLinkUrl}"
    value="{linkUrl(formatSelection)}"
  />
  <div class="point-clip">
    <div class="arrow"></div>
  </div>
</div>
