<script>
  export let insertSection;
  export let insertNodeId;
  export let insertMenuTopOffset;
  export let insertMenuLeftOffset;

  import { beforeUpdate, onMount } from 'svelte';

  import {
    KEYCODE_CTRL,
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_LEFT_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_SPACE,
    NODE_TYPE_H1,
    NODE_TYPE_H2,
    NODE_TYPE_IMAGE,
    NODE_TYPE_LI,
    NODE_TYPE_PRE,
    NODE_TYPE_QUOTE,
    NODE_TYPE_SPACER,
  } from '../common/constants';
  import { removeAllRanges, setCaret } from '../common/dom';
  import { stopAndPrevent } from '../common/utils';

  const sectionCallbacks = [
    () => insertSection(NODE_TYPE_H1),
    () => insertSection(NODE_TYPE_H2),
    () => insertSection(NODE_TYPE_PRE),
    () => insertSection(NODE_TYPE_LI),
    () => insertSection(NODE_TYPE_SPACER),
    () => fileInputDomNode.click(),
    () => insertSection(NODE_TYPE_QUOTE),
  ];

  let insertSectionMenuDomNode;
  let fileInputDomNode;

  let menuIsOpen;
  let currentIdx = -1;
  let didHitShift;

  beforeUpdate(() => {
    if (insertSectionMenuDomNode) {
      insertSectionMenuDomNode.style.top = `${insertMenuTopOffset - 11}px`;
      insertSectionMenuDomNode.style.left = `${insertMenuLeftOffset - 64}px`;
    }
  });

  onMount(() => {
    // `capture: true` will put this event handler in front of the ones set in the editor (parent of this menu)
    // it might be interesting to explore removing the parent handlers when this menu opens in stead of having both
    // running and relying on intercept-and-cancel mechanics
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      });
    };
  });

  function handleKeyDown(evt) {
    if (!evt) {
      return;
    }

    // eslint-disable-next-line default-case
    switch (evt.keyCode) {
      case KEYCODE_CTRL: {
        if (didHitShift) {
          // user double-tapped shift
          menuIsOpen = true;
          currentIdx = 0;
          didHitShift = false;
          // clear the caret, it's just dangling around some random place like a piece of spinach in your teeth
          removeAllRanges();
          stopAndPrevent(evt);
          break;
        }
        didHitShift = true;
        setTimeout(() => {
          didHitShift = false;
        }, 500);
        stopAndPrevent(evt);
        break;
      }
      case KEYCODE_LEFT_ARROW: {
        const nextIdx = currentIdx <= 0 ? 6 : currentIdx - 1;
        currentIdx = nextIdx;
        stopAndPrevent(evt);
        break;
      }
      case KEYCODE_RIGHT_ARROW: {
        const nextIdx = currentIdx === 6 ? 0 : currentIdx + 1;
        currentIdx = nextIdx;
        stopAndPrevent(evt);
        break;
      }
      case KEYCODE_ESC: {
        currentIdx = -1;
        menuIsOpen = false;
        setCaret({ startNodeId: insertNodeId, caretStart: 0 });
        stopAndPrevent(evt);
        break;
      }
      case KEYCODE_SPACE: // fall-through
      case KEYCODE_ENTER: {
        if (currentIdx > -1) {
          sectionCallbacks[currentIdx]();
          currentIdx = -1;
          menuIsOpen = false;
        }
        stopAndPrevent(evt);
        break;
      }
      default:
        break;
    }
  }

  function toggleMenu() {
    menuIsOpen = !menuIsOpen;
    if (menuIsOpen) {
      removeAllRanges();
    } else {
      setCaret({ startNodeId: insertNodeId, caretStart: 0 });
    }
  }
</script>

<style>
  #insert-section-menu {
    position: absolute;
    width: 50px;
    display: block;
  }
  #insert-section-menu.open {
    width: 755px;
  }
  #insert-section-menu-button {
    position: absolute;
    top: 15px;
    width: 32px;
    height: 24px;
    display: block;
    cursor: pointer;
    border: 0;
    outline: 0; /* var(--outline); */
    background: transparent;
  }
  #insert-section-menu-button:before,
  #insert-section-menu-button:after {
    position: absolute;
    display: block;
    content: '';
    height: 2px;
    width: 20px;
    background-color: var(--filbert-grey);
    transition: transform 0.2s ease-in-out;
  }
  #insert-section-menu-button:before {
    transform: rotateZ(0deg);
  }
  #insert-section-menu-button:after {
    transform: rotateZ(90deg);
  }
  #insert-section-menu-button.open:before {
    transform: rotateZ(225deg);
  }
  #insert-section-menu-button.open:after {
    transform: rotateZ(-45deg);
  }
  #insert-section-menu-items-container {
    position: absolute;
    z-index: 13; /* same as lil menu */
    min-height: 24px;
    left: -100%;
    display: none;
    transition: none;
  }
  #insert-section-menu-items-container.open {
    left: 48px;
    display: block;
    transition: left 0.2s ease-in-out, display 0.2s ease-in-out;
  }
  input {
    display: none;
  }
</style>

<div
  id="insert-section-menu"
  bind:this="{insertSectionMenuDomNode}"
  class:open="{menuIsOpen}"
>
  <button
    id="insert-section-menu-button"
    class:open="{menuIsOpen}"
    on:click="{toggleMenu}"
  ></button>
  <div
    id="insert-section-menu-items-container"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    class:open="{menuIsOpen}"
  >
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_H1}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 0}"
      on:click="{sectionCallbacks[0]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      H1
    </button>
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_H2}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 1}"
      on:click="{sectionCallbacks[1]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      H2
    </button>
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_PRE}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 2}"
      on:click="{sectionCallbacks[2]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      code
    </button>
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_LI}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 3}"
      on:click="{sectionCallbacks[3]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      list
    </button>
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_SPACER}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 4}"
      on:click="{sectionCallbacks[4]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      spacer
    </button>
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_IMAGE}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 5}"
      on:click="{sectionCallbacks[5]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      photo
      <input
        id="edit-image-hidden-file-input"
        type="file"
        bind:this="{fileInputDomNode}"
        on:change="{(e) => {
          insertSection(NODE_TYPE_IMAGE, e.target.files);
        }}"
        on:click="{(e) => {
          e.stopPropagation();
        }}"
        accept="image/*"
      />
    </button>
    <button
      id="{`insert-section-menu-item-${NODE_TYPE_QUOTE}`}"
      class="filbert-nav-button"
      class:open="{currentIdx === 6}"
      on:click="{sectionCallbacks[6]}"
      on:mouseover="{() => (currentIdx = -1)}"
      on:focus="{() => {}}"
    >
      quote
    </button>
  </div>
</div>
