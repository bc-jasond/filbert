<script>
  export let id;
  export let type;
  export let label;
  export let onClick = () => {};
  export let primary = false;
  export let warning = false;
  export let disabled = false;
  export let loading = false;

  import Spinner from '../icons/Spinner.svelte';
</script>

<style>
  button {
    display: flex;
    justify-content: center;
    overflow: hidden;
    position: relative;
    width: 100%;
    margin-bottom: 16px;
    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  button.primary {
    border: 1px solid var(--filbert-mediumGrey);
  }
  button.primary:hover {
    border-color: transparent;
    background-color: var(--filbert-white);
    color: var(--filbert-darkGrey);
  }
  button.warning {
    background: var(--filbert-lightError);
  }
  button.warning:hover {
    background: var(--filbert-error);
  }
  button.disabled,
  button.loading {
    background-color: var(--filbert-mediumGrey);
  }
  button.disabled:hover,
  button.loading:hover {
    cursor: not-allowed;
    background-color: var(--filbert-mediumGrey);
  }
  .button-label {
    font-family: var(--filbert-sans-serif);
    position: relative;
    z-index: 3;
    font-size: larger;
    color: inherit;
    transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .button-label.loading {
    opacity: 0;
    top: 1em;
  }
</style>

<button
  {id}
  {type}
  class="filbert-nav-button"
  class:primary
  class:loading
  class:disabled
  on:click="{() => !loading && !disabled && onClick?.()}"
  disabled="{loading || disabled}"
>
  <slot>
    <div class="button-label" class:loading>{label}</div>
  </slot>
  <Spinner {loading} />
</button>
