<script>
	export let name;

	let font = false;
	function handleFont() {
		font = !font;
		if (font) {
			document.body.classList.add('sans');
		} else {
			document.body.classList.remove('sans');
		}
	}
	let dark = false;
	function handleDark() {
		dark = !dark;
		if (dark) {
			document.body.classList.add('dark');
		} else {
			document.body.classList.remove('dark');
		}
	}
</script>

<main>
	<h1>Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<button on:click={handleFont}>font {font ? 'Sans Serif' : 'Serif'}</button>
	<button on:click={handleDark}>light / dark {dark ? 'Dark' : 'Light'}</button>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		background: var(--background-color-primary);
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>