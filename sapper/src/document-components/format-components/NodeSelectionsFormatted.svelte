<script>
  export let node;

  import Link from './Link.svelte';
  import Bold from './Bold.svelte';
  import Code from './Code.svelte';
  import Italic from './Italic.svelte';
  import Mini from './Mini.svelte';
  import SiteInfo from './SiteInfo.svelte';
  import Strikethrough from './Strikethrough.svelte';
  import { getContentBySelections, getSelectionAtIdx } from '../../common/selection-helpers';
  import {
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_STRIKETHROUGH,
  } from '../../common/constants';
  import { Selection } from '../../common/utils';

  let selectionHead = node.getIn(['meta', 'selections'], Selection());
  const contentPiecesBySelectionLength = getContentBySelections(node);
  const contentAndSelections = contentPiecesBySelectionLength.map((text, idx) => ({
    text,
    selection: getSelectionAtIdx(selectionHead, idx)
  }))
</script>

{#each contentAndSelections as {text, selection}}
  <Link url={selection.get(SELECTION_ACTION_LINK) && selection.get(SELECTION_LINK_URL)}>
    <Bold shouldFormat={selection.get(SELECTION_ACTION_BOLD)}>
      <Code shouldFormat={selection.get(SELECTION_ACTION_CODE)}>
        <Italic shouldFormat={selection.get(SELECTION_ACTION_ITALIC)}>
          <Mini shouldFormat={selection.get(SELECTION_ACTION_MINI)}>
            <SiteInfo shouldFormat={selection.get(SELECTION_ACTION_SITEINFO)}>
              <Strikethrough shouldFormat={selection.get(SELECTION_ACTION_BOLD)}>
                {text}
              </Strikethrough>
            </SiteInfo>
          </Mini>
        </Italic>
      </Code>
    </Bold>
  </Link>
{/each}