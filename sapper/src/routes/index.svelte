<style>
  h1, figure {
    text-align: center;
    margin: 0 auto;
  }

  h1 {
    font-size: 2.8em;
    text-transform: uppercase;
    font-weight: 700;
    margin: 0 0 0.5em 0;
  }

  figure {
    margin: 0 0 1em 0;
  }

  img {
    width: 100%;
    max-width: 400px;
    margin: 0 0 1em 0;
  }

  @media (min-width: 480px) {
    h1 {
      font-size: 4em;
    }
  }
</style>

<svelte:head>
  <title>filbert</title>
</svelte:head>

<h1>Great success!</h1>

<figure>
  <img alt='Success Kids' src='kids1.jpg'>
  <img alt="Success Kids 2" src="kids2.jpg">
  <figcaption>Have fun with Life!</figcaption>
</figure>

<div class="filbert-section">
  <a class="filbert-link" href="/p/homepage">Homepage Post</a>
  <a href="/about">About</a>
  <a href="/blog">Blog</a>
</div>
