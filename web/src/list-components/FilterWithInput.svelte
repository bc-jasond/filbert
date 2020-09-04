<script>
  export let buttonLabel;
  export let value;
  export let name;

  let selected = !!value;
  let inputDomNode;

  $: {
    if (selected && inputDomNode) {
      inputDomNode.focus();
    }
    if (!selected) {
      value = '';
    }
  }
</script>

<style>
  button {
    display: inline-block;
    padding: 9px;
    margin-left: 8px;
  }
  button:first-of-type {
    margin-left: 0;
  }
  input {
    flex: 1;
    height: 38px;
    margin-right: 8px;
    transition: opacity 0.2s;
    opacity: 1;
    /* outline: var(--filbert-outline); */
    border: 1px solid var(--filbert-lightBlue);
    border-left: none;
    border-radius: 0 26px 26px 0;
  }
  input.hide {
    opacity: 0;
  }
  .with-input {
    flex-grow: 0;
    border: 1px solid transparent;
    border-right: none;
    margin-right: 0;
  }
  .with-input.open {
    border: 1px solid var(--accent-color-primary);
    border-right: none;
    margin-right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
</style>

<button
  class="filbert-nav-button with-input"
  class:open="{selected}"
  on:click="{() => (selected = !selected)}"
>
  {buttonLabel}
</button>
<input
  class:hide="{!selected}"
  bind:this="{inputDomNode}"
  bind:value
  {name}
  type="text"
  autoComplete="off"
/>
