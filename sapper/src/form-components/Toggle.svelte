<script>
  export let value;
  export let onUpdate;
  export let label = '';
  export let disabled = false;

  let isFocused;
</script>

<style>
  .wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  .toggle-wrapper {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    position: relative;
    background-color: transparent;
    transition: background-color 0.125s ease-out;
    padding-left: 1px;
    padding-right: 1px;
    margin-left: 8px;
    border-radius: 32px;
    border: 1px solid var(--background-color-secondary);
    width: 64px;
    height: 34px;
  }
  .toggle-wrapper:hover {
    cursor: pointer;
  }
  .toggle-focused {
    outline: var(--filbert-outline);
  }
  .toggle-value {
    background-color: var(--accent-color-primary);
  }
  .toggle-disabled {
    background-color: var(--background-color-secondary);
  }
  .toggle-disabled:hover {
    cursor: not-allowed;
  }
  .knob {
    position: absolute;
    left: 34px;
    transition: left 0.125s ease-out;
    background-color: var(--filbert-abramovTextWhite);
    box-shadow: var(--filbert-box-shadow);
    border-radius: 50%;
    height: 32px;
    width: 32px;
  }
  .knob-no-value {
    left: 1px;
  }
  span {
    font-size: var(--alt-font-size);
    line-height: var(--alt-line-height);
    letter-spacing: var(--alt-letter-spacing);
    flex-grow: 2;
  }
  input {
    position: absolute;
    height: 0;
    width: 0;
    opacity: 0;
  }
</style>

<div class="wrapper">
  {#if label}
    <span>{label}</span>
  {:else}
    <slot />
  {/if}
  <div
    class="toggle-wrapper"
    class:toggle-value="{value}"
    class:toggle-disabled="{disabled}"
    class:toggle-focused="{isFocused}"
    on:click="{() => !disabled && onUpdate()}"
  >
    <div class="knob" class:knob-no-value="{!value}"></div>
    <input
      type="checkbox"
      bind:checked="{value}"
      {disabled}
      on:focus="{() => (isFocused = true)}"
      on:blur="{() => (isFocused = false)}"
      on:change="{onUpdate}"
    />
  </div>
</div>
