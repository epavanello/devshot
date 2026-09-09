<script lang="ts">
  import { onMount } from 'svelte';
  import Download from '@lucide/svelte/icons/download';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Terminal from '@lucide/svelte/icons/terminal';
  import Check from '@lucide/svelte/icons/check';
  import { backgrounds, beautifyOptionsSchema, type BeautifyOptions } from '$lib/core/options';
  import { createSceneDocument } from '$lib/core/scene';

  let options = $state<BeautifyOptions>(beautifyOptionsSchema.parse({}));
  let imageDataUrl = $state('');
  let sourceWidth = $state(0);
  let sourceHeight = $state(0);
  let dragging = $state(false);
  let exporting = $state(false);
  let copied = $state(false);
  let supported = $state<boolean | null>(null);
  let endpoint = $state('https://your-devshot.app/mcp');

  const acceptedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

  const scene = $derived(imageDataUrl ? createSceneDocument({ imageDataUrl, sourceWidth, sourceHeight, options }) : '');
  const installCommand = $derived(`claude mcp add --transport http devshot ${endpoint}`);

  onMount(() => {
    supported = 'drawElementImage' in CanvasRenderingContext2D.prototype && 'requestPaint' in HTMLCanvasElement.prototype;
    endpoint = `${location.origin}/mcp`;

    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === 'file' && acceptedImageTypes.has(item.type))
        ?.getAsFile();

      if (!image) return;
      event.preventDefault();
      void loadFile(image);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  async function loadFile(file?: File) {
    if (!file || !acceptedImageTypes.has(file.type)) return;
    const value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = value;
    });
    imageDataUrl = value;
    sourceWidth = dimensions.width;
    sourceHeight = dimensions.height;
  }

  async function download() {
    if (!imageDataUrl || !supported) return;
    exporting = true;
    try {
      const response = await fetch('/api/beautify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, sourceWidth, sourceHeight, options })
      });
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devshot.${options.format === 'jpeg' ? 'jpg' : 'png'}`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      exporting = false;
    }
  }

  async function copyInstall() {
    await navigator.clipboard.writeText(installCommand);
    copied = true;
    setTimeout(() => copied = false, 1600);
  }
</script>

<svelte:head>
  <title>DevShot — screenshots with taste</title>
  <meta name="description" content="A free, opinionated screenshot beautifier for humans and MCP agents." />
</svelte:head>

<header class="topbar">
  <a class="brand" href="/" aria-label="DevShot home"><img class="brand-mark" src="/favicon.svg" alt=""><span>DevShot</span><b>LABS</b></a>
  <div class="top-actions"><span class="free-pill">FREE FOREVER</span><a href="#mcp">MCP FOR AGENTS</a></div>
</header>

<main>
  <section class="intro">
    <div>
      <div class="kicker"><Sparkles size={15} strokeWidth={2.6} /> Screenshot beautifier with opinions</div>
      <h1>Drop the screenshot.<br><em>Keep the taste.</em></h1>
    </div>
    <p>No AI. No account. No tasteful beige presets.<br>Pick a mood, export the good stuff.</p>
  </section>

  {#if supported === false}
    <aside class="experiment-callout">
      <div class="experiment-icon">β</div>
      <div><strong>DevShot runs on tomorrow’s browser.</strong><span>Open Chrome Beta, enable <code>chrome://flags/#canvas-draw-element</code>, then reload this page.</span></div>
      <span class="no-fallback">NO FALLBACK</span>
    </aside>
  {/if}

  <section class="workspace" class:is-unsupported={supported === false}>
    <div class="stage-shell">
      <div class="stage-toolbar"><span>LIVE CANVAS · PASTE TO {imageDataUrl ? 'REPLACE' : 'START'}</span><span>{options.width}px · {options.aspectRatio}</span></div>
      {#if imageDataUrl}
        <iframe title="DevShot preview" srcdoc={scene}></iframe>
        <label class="replace-button">Replace image<input type="file" accept="image/png,image/jpeg,image/webp" onchange={(event) => loadFile(event.currentTarget.files?.[0])}></label>
      {:else}
        <label
          class:dragging
          class="dropzone"
          ondragover={(event) => { event.preventDefault(); dragging = true; }}
          ondragleave={() => dragging = false}
          ondrop={(event) => { event.preventDefault(); dragging = false; loadFile(event.dataTransfer?.files[0]); }}
        >
          <input type="file" accept="image/png,image/jpeg,image/webp" onchange={(event) => loadFile(event.currentTarget.files?.[0])}>
          <span class="drop-icon"><ImagePlus size={30} /></span>
          <strong>Drop it or paste it.</strong>
          <small>PNG, JPG or WebP · ⌘V / Ctrl V anywhere</small>
          <span class="browse">Choose screenshot</span>
        </label>
      {/if}
    </div>

    <aside class="controls">
      <div class="panel-heading"><div><span>MAKE IT POP</span><h2>Your frame, your rules.</h2></div><span class="beta">BETA</span></div>

      <fieldset>
        <legend>BACKGROUND</legend>
        <div class="swatches">
          {#each Object.entries(backgrounds) as [id, background]}
            <button class:active={options.background === id} style={`--swatch:linear-gradient(135deg,${background.colors.join(',')})`} onclick={() => options.background = id as BeautifyOptions['background']} aria-label={background.label}><span></span></button>
          {/each}
        </div>
      </fieldset>

      <div class="field-grid">
        <label><span>RATIO</span><select bind:value={options.aspectRatio}><option>original</option><option>1:1</option><option>16:9</option><option>4:3</option><option>3:2</option><option>9:16</option></select></label>
        <label><span>CROP</span><select bind:value={options.fit}><option value="contain">Fit</option><option value="cover">Fill</option></select></label>
      </div>

      <label class="range"><span><b>PADDING</b><output>{options.padding}px</output></span><input type="range" min="0" max="240" step="8" bind:value={options.padding}></label>
      <label class="range"><span><b>ROUNDED</b><output>{options.radius}px</output></span><input type="range" min="0" max="80" step="4" bind:value={options.radius}></label>

      <fieldset>
        <legend>SHADOW</legend>
        <div class="segmented">{#each ['none', 'soft', 'float', 'hard'] as value}<button class:active={options.shadow === value} onclick={() => options.shadow = value as BeautifyOptions['shadow']}>{value}</button>{/each}</div>
      </fieldset>

      <div class="field-grid">
        <label><span>WIDTH</span><select bind:value={options.width}><option value={1200}>1200 px</option><option value={1600}>1600 px</option><option value={2400}>2400 px</option><option value={3200}>3200 px</option></select></label>
        <label><span>FORMAT</span><select bind:value={options.format}><option value="png">PNG</option><option value="jpeg">JPG</option></select></label>
      </div>

      <button class="export" disabled={!imageDataUrl || supported !== true || exporting} onclick={download}><Download size={18} />{exporting ? 'Rendering in Chrome Beta…' : 'Download the good stuff'}</button>
      <p class="microcopy">Rendered from real HTML with Chrome’s experimental canvas pipeline.</p>
    </aside>
  </section>

  <section class="mcp-card" id="mcp">
    <div class="mcp-copy"><span class="terminal-icon"><Terminal size={22} /></span><p class="kicker">FREE MCP TOOL</p><h2>Your agent has screenshots.<br><em>Give it taste.</em></h2><p>Connect once. Then ask Claude, Codex or any MCP client to frame a screenshot and return the finished PNG in the response. No login, token or AI layer.</p></div>
    <div class="install-box"><div class="install-head"><span>ONE-LINE INSTALL</span><span class="live-dot">PUBLIC · NO AUTH</span></div><code>{installCommand}</code><button onclick={copyInstall}>{#if copied}<Check size={17} /> Copied{:else}Copy command{/if}</button><small>Streamable HTTP · tool: <b>beautify_screenshot</b></small></div>
  </section>
</main>

<footer><span>DEVSHOT · BUILT FOR SCREENSHOTS THAT DESERVE BETTER</span><span>OPEN SOURCE · ZERO AI · 100% OPINION</span></footer>
