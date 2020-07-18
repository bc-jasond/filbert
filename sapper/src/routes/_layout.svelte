<script>
	import Nav from '../components/Nav.svelte';

	export let segment;
</script>

<style>
	:global(body) {
		--filbert-nav-height: 64px;
	}
	main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em;
		margin: var(--filbert-nav-height) auto;
		box-sizing: border-box;
	}
</style>

<Nav {segment}/>

<main>
	<slot></slot>
</main>