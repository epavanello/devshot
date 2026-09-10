<script lang="ts">
  import { onMount } from 'svelte';
  import CanvasRenderer from '$lib/components/scene/CanvasRenderer.svelte';
  import { isVisual, type SceneInput } from '$lib/core/scene-model';

  let input = $state<SceneInput>();
  let version = $state(0);
  let pending: { version: number; resolve: () => void; reject: (error: unknown) => void } | undefined;

  onMount(() => {
    window.__DEVSHOT_RENDER__ = async (next) => {
      if (isVisual(next) && (!next.sourceWidth || !next.sourceHeight)) {
        const image = new Image();
        image.src = next.imageDataUrl ?? '';
        await image.decode();
        next = { ...next, sourceWidth: image.naturalWidth, sourceHeight: image.naturalHeight };
      }
      version += 1;
      input = next;
      await new Promise<void>((resolve, reject) => pending = { version, resolve, reject });
    };
  });

  function rendered(_: HTMLCanvasElement, renderedVersion: string | number) {
    if (pending?.version !== renderedVersion) return;
    pending.resolve();
    pending = undefined;
  }

  function failed(error: unknown, renderedVersion: string | number) {
    if (pending?.version !== renderedVersion) return;
    pending.reject(error);
    pending = undefined;
  }
</script>

{#if input}
  <CanvasRenderer {input} {version} onrender={rendered} onerror={failed} />
{/if}

<style>
  :global(html),:global(body){margin:0;width:max-content;height:max-content;overflow:hidden;background:transparent}
</style>
