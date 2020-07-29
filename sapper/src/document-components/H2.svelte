<script>
  import { Map } from 'immutable';
  export let node = Map();

  import { NODE_TYPE_H2 } from '../common/constants';
  import { cleanTextOrZeroLengthPlaceholder } from '../common/utils';
</script>

<style>
  h2 {
    color: var(--title-color-primary);
    margin-top: 30px;
    margin-bottom: 8px;
    font-family: var(--h2-font-family), sans-serif;
    font-size: var(--h2-font-size);
    font-weight: var(--h2-font-weight);
    line-height: var(--h2-line-height);
    letter-spacing: var(--h2-letter-spacing);
  }
</style>

{#if node.size}
  <h2
    data-type="{NODE_TYPE_H2}"
    name="{node.get('id')}"
    class="filbert-section"
  >
    {cleanTextOrZeroLengthPlaceholder(node.get('content'))}
  </h2>
{:else}
  <h2 class="filbert-section">
    <slot />
  </h2>
{/if}
