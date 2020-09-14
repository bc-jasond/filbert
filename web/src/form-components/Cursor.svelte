<style>
    @keyframes blink {
        from, to {
            background-color: var(--accent-color-primary);
        }
        50% {
            background-color: transparent;
        }
    }
div {
position: absolute;
height: 2px;
width: 100%;
background-color: var(--accent-color-primary);
animation: 1s blink step-end infinite;
}
</style>

<div></div>