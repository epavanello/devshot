<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <meta name="application-name" content="DevShot" />
  <meta name="apple-mobile-web-app-title" content="DevShot" />
  <meta name="theme-color" content="#18181b" />
</svelte:head>

{@render children()}
