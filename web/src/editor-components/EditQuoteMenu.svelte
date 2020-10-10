<script>
  export let nodeModel = Map();
  export let offsetTop;
  export let update;
  export let closeMenu;

  import { Map } from 'immutable';
  import { beforeUpdate, onMount } from 'svelte';

  import {
    KEYCODE_LEFT_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_TAB,
    KEYCODE_BACKSPACE,
  } from '../common/constants';
  import {
    caretIsAtBeginningOfInput,
    caretIsAtEndOfInput,
    focusAndScrollSmooth,
  } from '../common/dom';

  $: nodeId = nodeModel.get('id');

  const menuInputs = [
    { name: 'quote', domNode: undefined },
    { name: 'author', domNode: undefined },
    { name: 'context', domNode: undefined },
    { name: 'url', domNode: undefined },
  ];
  let editQuoteMenuDomNode;
  let currentIdx = 0;

  function handleKeyDown(evt) {
    // override the top level handlers in the Editor
    if (
      [
        KEYCODE_LEFT_ARROW,
        KEYCODE_RIGHT_ARROW,
        KEYCODE_TAB,
        KEYCODE_ENTER,
        KEYCODE_BACKSPACE,
      ].includes(evt.keyCode)
    ) {
      evt.stopPropagation();
    }

    if (
      (evt.keyCode === KEYCODE_TAB && evt.shiftKey) ||
      (evt.keyCode === KEYCODE_LEFT_ARROW && caretIsAtBeginningOfInput())
    ) {
      const nextIdx = currentIdx === 0 ? menuInputs.length - 1 : currentIdx - 1;
      currentIdx = nextIdx;
      focusAndScrollSmooth(nodeId, menuInputs[currentIdx].domNode);
      evt.preventDefault();
    }
    if (
      evt.keyCode === KEYCODE_TAB ||
      (evt.keyCode === KEYCODE_RIGHT_ARROW && caretIsAtEndOfInput())
    ) {
      const nextIdx = currentIdx === menuInputs.length - 1 ? 0 : currentIdx + 1;
      currentIdx = nextIdx;
      focusAndScrollSmooth(nodeId, menuInputs[currentIdx].domNode, false);
      evt.preventDefault();
    }
    if (evt.keyCode === KEYCODE_ENTER || evt.keyCode === KEYCODE_ESC) {
      closeMenu();
    }
  }

  onMount(() => {
    focusAndScrollSmooth(nodeId, menuInputs[currentIdx].domNode);
    // `capture: true` will put this event handler in front of the ones set by edit.jsx
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      });
    };
  });

  beforeUpdate(() => {
    if (editQuoteMenuDomNode) {
      editQuoteMenuDomNode.style.top = `${offsetTop - 90}px`;
    }
  });
</script>

<style>
  #edit-quote-menu {
    display: flex;
    flex-direction: column;
    justify-items: center;
    width: 400px;
    padding: 8px;
    left: 50%;
    margin: 0 auto 0 -200px;
  }
  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 32px;
  }
  input {
    margin: 0 8px;
  }
</style>

<div
  id="edit-quote-menu"
  class="lil-sassy-menu"
  data-is-menu
  bind:this="{editQuoteMenuDomNode}"
>
  {#each menuInputs as input}
    <div class="row">
      <input
        class="dark-input"
        placeholder="{`Enter ${input.name.toLocaleUpperCase()} here...}`}"
        bind:this="{input.domNode}"
        on:mouseup="{(e) => {
          e.stopPropagation();
        }}"
        on:input="{(e) => update(
            nodeModel.setIn(['meta', input.name], e.target.value),
            ['meta', input.name]
          )}"
        value="{nodeModel.getIn(['meta', input.name], '')}"
      />
    </div>
  {/each}
  <div class="point-clip">
    <div class="arrow"></div>
  </div>
</div>