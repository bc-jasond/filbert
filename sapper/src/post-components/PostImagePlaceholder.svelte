<script context="module">
  const colorVars = [
    '--filbert-lightGrey',
    '--filbert-lightBlue',
    '--filbert-lightOrange',
    '--filbert-lightSalmon',
  ];
  function fisherYates(arg) {
    const arr = [...arg];
    let i = arr.length,
      j,
      temp;
    while (--i > 0) {
      j = Math.floor(Math.random() * (i + 1)); // Get random number ranging between 0 and i
      temp = arr[j];
      arr[j] = arr[i];
      arr[i] = temp;
    }
    return arr;
  }
  const allPermutations = fisherYates(colorVars.flatMap((toColor) =>
    colorVars.map((fromColor) =>
      toColor !== fromColor ? [toColor, fromColor] : undefined
    ).filter(v => v)
  ));

  let currentIndex = 0;
  function getNext() {
    const next = allPermutations[currentIndex++];
    if (currentIndex === allPermutations.length) {
      currentIndex = 0;
    }
    return next;
  }
</script>

<script>
  export let postListOverride = false;

  const [toColor, fromColor] = getNext();
</script>

<style>
  .placeholder-image {
    height: 400px;
    border-radius: 4px;
    background-image: radial-gradient(
      var(--gradient-from-color),
      var(--gradient-to-color)
    );
  }
  .post-list-override {
    margin: 0 auto;
    max-width: 650px;
    max-height: 150px;
  }
  @media (min-width: 768px) {
    .post-list-override {
      margin: 0;
      max-height: 115px;
      max-width: 150px;
    }
  }
</style>

<div
  class="placeholder-image"
  class:post-list-override="{postListOverride}"
  style="--gradient-to-color: var({toColor}); --gradient-from-color: var({fromColor});"
></div>
