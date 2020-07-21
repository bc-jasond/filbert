<script>
	import Theme from './theme.svelte';
	import Nav from '../layout-components/Nav.svelte';
	import Footer from '../layout-components/Footer.svelte';

	export let segment;
</script>

<style>
	:global(body) {
		--filbert-nav-height: 64px;
	}
	main {
		width: 100%;
		min-height: 80vh;
		padding: 16px 24px 48px 24px;
		margin: var(--filbert-nav-height) auto 0;
		box-sizing: border-box;
		position: relative;
	}

	@media (min-width: 992px) {
	  main {
			padding: 48px 80px;
		}
	}
</style>

<Theme />
<Nav {segment}/>

<main>
	<slot></slot>
</main>

<Footer/>