<script lang="ts">
  import { tick } from 'svelte';
  import Scene from './Scene.svelte';
  import { sceneContentHtml, sceneSize, type SceneInput } from '$lib/core/scene-model';

  let { input, version = '', fit = false, canvas = $bindable(), onrender, onerror }: {
    input: SceneInput;
    version?: string | number;
    fit?: boolean;
    canvas?: HTMLCanvasElement;
    onrender?: (canvas: HTMLCanvasElement, version: string | number) => void;
    onerror?: (error: unknown, version: string | number) => void;
  } = $props();

  let scene = $state<HTMLDivElement>();
  let contentHtml = $state('');
  let contentReady = $state(false);
  let contentGeneration = 0;
  let paintGeneration = 0;
  const size = $derived(sceneSize(input));
  const kind = $derived(input.kind);
  const content = $derived(input.content);
  const language = $derived(input.language);
  const contentKey = $derived(`${kind ?? 'image'}\0${content ?? ''}\0${language ?? ''}`);

  $effect(() => {
    contentKey;
    const generation = ++contentGeneration;
    if (!kind || kind === 'image' || kind === 'website') {
      contentHtml = '';
      contentReady = true;
      return;
    }
    contentReady = false;
    void sceneContentHtml(kind, content, language).then((html) => {
      if (generation !== contentGeneration) return;
      contentHtml = html;
      contentReady = true;
    }).catch((error) => {
      if (generation === contentGeneration) onerror?.(error, version);
    });
  });

  $effect(() => {
    if (!canvas) return;
    canvas.addEventListener('paint', paint);
    return () => canvas?.removeEventListener('paint', paint);
  });

  $effect(() => {
    if (!canvas || !scene || !contentReady) return;
    const generation = ++paintGeneration;
    version;
    size.width;
    size.height;
    contentHtml;
    input.imageDataUrl;
    void requestPaint(generation);
  });

  async function requestPaint(generation: number) {
    await tick();
    const source = scene?.querySelector<HTMLImageElement>('#source');
    await Promise.all([document.fonts.ready, source?.decode() ?? Promise.resolve()]);
    if (generation === paintGeneration) canvas?.requestPaint();
  }

  function paint() {
    if (!canvas || !scene || !contentReady) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.reset();
    context.drawElementImage(scene, 0, 0, size.width, size.height);
    onrender?.(canvas, version);
  }
</script>

<canvas bind:this={canvas} id="shot" class:fit width={size.width} height={size.height} layoutsubtree data-version={version}>
  <Scene bind:root={scene} {input} {contentHtml} />
</canvas>

<style>
  canvas{display:block;width:auto;height:auto}.fit{max-width:100%;max-height:100%}
</style>
