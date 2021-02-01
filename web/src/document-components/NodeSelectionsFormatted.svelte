<script>
  export let node;

  import he from 'he';

  import { cleanTextOrZeroLengthPlaceholder } from '@filbert/util';

  let formattedMarkup = he.escape(
    cleanTextOrZeroLengthPlaceholder(node.get('content'))
  );
  $: {
    //console.debug('FORMATTED SELECTIONS render()', node);
    formattedMarkup = '';
    let didError = false;
    let selection = node.formatSelections.head;
    const contentPiecesBySelectionLength = node.formatSelections.getContentBySelections(node.get('content'));
    let idx = 0;
    try {
      while (selection) {
        let openingTags = [];
        let closingTags = [];
        // re-render all selections if any one changes
        //const key = selection.hashCode();
        if (selection.strikethrough) {
          openingTags.push('<span class="strikethrough-text">');
          closingTags.unshift('</span>');
        }
        if (selection.siteinfo) {
          openingTags.push('<span class="siteinfo-text">');
          closingTags.unshift('</span>');
        }
        if (selection.mini) {
          openingTags.push('<span class="mini-text">');
          closingTags.unshift('</span>');
        }
        if (selection.italic) {
          openingTags.push('<em class="italic-text">');
          closingTags.unshift('</em>');
        }
        if (selection.code) {
          openingTags.push('<code class="code-text">');
          closingTags.unshift('</code>');
        }
        if (selection.bold) {
          openingTags.push('<strong class="bold-text">');
          closingTags.unshift('</strong>');
        }
        if (selection.link) {
          openingTags.push(
            `<a class="filbert-link" href="${selection.linkUrl}">`
          );
          closingTags.unshift('</a>');
        }
        formattedMarkup = `${formattedMarkup}${openingTags.join('')}${he.escape(
          contentPiecesBySelectionLength[idx]
        )}${closingTags.join('')}`;
        selection = node.formatSelections.getNext(selection);
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
