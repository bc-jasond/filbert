<script>
  export let node;

  import he from 'he';
  import {
    SELECTION_ACTION_BOLD,
    SELECTION_ACTION_CODE,
    SELECTION_ACTION_ITALIC,
    SELECTION_ACTION_LINK,
    SELECTION_LINK_URL,
    SELECTION_ACTION_MINI,
    SELECTION_ACTION_SITEINFO,
    SELECTION_ACTION_STRIKETHROUGH,
    SELECTION_NEXT,
    getContentBySelections,
    getSelections,
  } from '@filbert/selection';

  import { cleanTextOrZeroLengthPlaceholder } from '@filbert/util';

  let formattedMarkup = he.escape(
    cleanTextOrZeroLengthPlaceholder(node.get('content'))
  );
  $: {
    //console.debug('FORMATTED SELECTIONS render()', node);
    formattedMarkup = '';
    let didError = false;
    let { head, selections } = getSelections(node);
    let selection = head;
    const contentPiecesBySelectionLength = getContentBySelections(node);
    let idx = 0;
    try {
      while (selection) {
        let openingTags = [];
        let closingTags = [];
        // re-render all selections if any one changes
        //const key = selection.hashCode();
        if (selection.get(SELECTION_ACTION_STRIKETHROUGH)) {
          openingTags.push('<span class="strikethrough-text">');
          closingTags.unshift('</span>');
        }
        if (selection.get(SELECTION_ACTION_SITEINFO)) {
          openingTags.push('<span class="siteinfo-text">');
          closingTags.unshift('</span>');
        }
        if (selection.get(SELECTION_ACTION_MINI)) {
          openingTags.push('<span class="mini-text">');
          closingTags.unshift('</span>');
        }
        if (selection.get(SELECTION_ACTION_ITALIC)) {
          openingTags.push('<em class="italic-text">');
          closingTags.unshift('</em>');
        }
        if (selection.get(SELECTION_ACTION_CODE)) {
          openingTags.push('<code class="code-text">');
          closingTags.unshift('</code>');
        }
        if (selection.get(SELECTION_ACTION_BOLD)) {
          openingTags.push('<strong class="bold-text">');
          closingTags.unshift('</strong>');
        }
        if (selection.get(SELECTION_ACTION_LINK)) {
          openingTags.push(
            `<a class="filbert-link" href="${selection.get(
              SELECTION_LINK_URL
            )}">`
          );
          closingTags.unshift('</a>');
        }
        formattedMarkup = `${formattedMarkup}${openingTags.join('')}${he.escape(
          contentPiecesBySelectionLength[idx]
        )}${closingTags.join('')}`;
        selection = selections.get(selection.get(SELECTION_NEXT));
        idx += 1;
      }
    } catch (err) {
      console.warn(err);
      // selections got corrupt, just display unformatted text
      didError = true;
    }
    // if there's an error, show unformatted content
    if (didError) {
      formattedMarkup = he.escape(
        cleanTextOrZeroLengthPlaceholder(node.get('content'))
      );
    }
  }
</script>

<style>
  /* styles are globally defined in _theme.svelte */
</style>

<svelte:options immutable />
{@html formattedMarkup}

<!--The code below is much more straightforward but didn't work and is why I'm just using {@html}.  -->
<!--Empty text type (type === 3) nodes are created surrounding each Svelte component where shouldFormat === true.-->
<!--For example, a paragraph with 3 selections would have childNodes.length === 20!-->
<!--This totally fucks up the reconciliation of DOM Selection -> character offset in paragraph and is completely unusable with all those textNodes-->

<!--{#each contentAndSelections as { text, selection }}-->
<!--  <Link-->
<!--    url="{selection.get(SELECTION_ACTION_LINK) && selection.get(SELECTION_LINK_URL)}"-->
<!--  >-->
<!--    <Bold shouldFormat="{selection.get(SELECTION_ACTION_BOLD)}">-->
<!--      <Code shouldFormat="{selection.get(SELECTION_ACTION_CODE)}">-->
<!--        <Italic shouldFormat="{selection.get(SELECTION_ACTION_ITALIC)}">-->
<!--          <Mini shouldFormat="{selection.get(SELECTION_ACTION_MINI)}">-->
<!--            <SiteInfo shouldFormat="{selection.get(SELECTION_ACTION_SITEINFO)}">-->
<!--              <Strikethrough-->
<!--                shouldFormat="{selection.get(SELECTION_ACTION_STRIKETHROUGH)}"-->
<!--              >-->
<!--                {text}-->
<!--              </Strikethrough>-->
<!--            </SiteInfo>-->
<!--          </Mini>-->
<!--        </Italic>-->
<!--      </Code>-->
<!--    </Bold>-->
<!--  </Link>-->
<!--{/each}-->
