<style>
    button {
        position: relative;
        background: rgba(0, 0, 0, 0);
        color: white;
        font-size: 16px;
        transition: 0.1s background-color, 0.1s border-color, 0.1s color, 0.1s fill;
        border: 0;
        display: inline-block;
        vertical-align: middle;
        height: 44px;
        line-height: 21px;
        margin: 0 8px;
        padding: 0;
        cursor: pointer;
        user-select: none;
    /*outline: ${getVar(outline)};*/
    }
</style>

<button>
    <slot />
</button>