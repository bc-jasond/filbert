<script>
    import Image from "../document-components/Image.svelte";

    export let offsetTop;
    export let offsetLeft;
    export let nodeModel;
    export let shouldHideCaption;
    export let update;
    export let postMap;

    import {beforeUpdate} from 'svelte';

    import IconButton from '../form-components/IconButton.svelte';
    import IconImage from '../icons/image.svelte';
    import IconRotate from '../icons/rotate.svelte';
    import IconPlusPx from '../icons/plus-px.svelte';
    import IconMinusPx from '../icons/minus-px.svelte';

    let currentIdx = -1;
    let fileInputDomNode;
    let captionInputDomNode;

    let editImageMenuDomNode;
    beforeUpdate(() => {
        if (!editImageMenuDomNode) {
            return;
        }
        editImageMenuDomNode.style.top = `${offsetTop + 10}px;`;
        editImageMenuDomNode.style.left = offsetLeft ? `${offsetLeft}px` : '50%';
    })

    function imageRotate() {

    }
    function _resize(shouldMakeBigger) {

    }
    function imageResizeUp() {
        _resize(true)
    }
    function imageResizeDown() {
        _resize(false)
    }
    function updateCaption({ target: { value } }) {
        update(nodeModel.setIn(['meta', 'caption'], value), [
            'meta',
            'caption',
        ]);
    }
</script>

<style>
    #edit-image-menu {
        display: flex;
        align-items: center;
        justify-items: center;
        width: 500px;
        margin: 0 auto 0 -81px;
    }
    #edit-image-menu.hide-caption {
        width: 162px;
        margin-left: -250px;
    }
</style>

<div
        id="edit-image-menu"
        class="lil-sassy-menu"
        data-is-menu
        bind:this={editImageMenuDomNode}
        class:hide-caption={shouldHideCaption}
>
    <IconButton on:click={() => fileInputDomNode.click()}>
        <IconImage useIconMixin selected={currentIdx === 0} />
        {#if currentIdx === 0}
            <Cursor />
            {/if}
    </IconButton>
    <IconButton on:click={imageRotate}>
        <IconRotate useIconMixin selected={currentIdx === 1} />
        {#if currentIdx === 1}
            <Cursor />
        {/if}
    </IconButton>
    <IconButton on:click={imageResizeUp}>
        <IconPlusPx useIconMixin selected={currentIdx === 2}/>
        {#if currentIdx === 2}
            <Cursor />
        {/if}
    </IconButton>
    <IconButton on:click={imageResizeDown}>
        <IconMinusPx useIconMixin selected={currentIdx === 3}/>
        {#if currentIdx === 3}
            <Cursor />
        {/if}
    </IconButton>
    {#if !shouldHideCaption}
        <input
        id="edit-image-menu-caption-input"
        class="dark-input"
        placeholder="Enter Image Caption here..."
        bind:this={captionInputDomNode}
        on:input={updateCaption}
        value={nodeModel.getIn(['meta', 'caption'], '')}
        />
        {/if}
    <PointClip>
        <Arrow />
    </PointClip>
    <input
            name="edit-image-hidden-file-input"
            type="file"
            accept="image/*"
            bind:this={fileInputDomNode}
            on:change={(e) => {
            replaceImageFile(e.target.files);
          }}
            on:click|stopPropagation={(e) => {
            // NOTE: the "file input click" callback will be called twice without this stopPropagation()
          }}
    />
</div>