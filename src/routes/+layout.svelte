<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/favicon.svg" />
  <meta name="theme-color" content="#f7f5ee" />
</svelte:head>

{@render children()}
