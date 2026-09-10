<script lang="ts">
  import { onMount } from 'svelte';
  import Download from '@lucide/svelte/icons/download';
  import ImagePlus from '@lucide/svelte/icons/image-plus';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TerminalIcon from '@lucide/svelte/icons/terminal';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import LinkIcon from '@lucide/svelte/icons/link';
  import Code2 from '@lucide/svelte/icons/code-2';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
  import { backgrounds, beautifyOptionsSchema, type BeautifyOptions } from '$lib/core/options';
  import { createSceneDocument, type SceneInput } from '$lib/core/scene';
  import { getMcpUrl, getSiteUrl } from '$lib/config/site';

  type SourceMode = 'empty' | 'image' | 'website' | 'snippet';
  type SnippetMode = 'code' | 'terminal';
  type WebsiteViewport = 'desktop' | 'mobile';

  let options = $state<BeautifyOptions>(beautifyOptionsSchema.parse({}));
  let sourceMode = $state<SourceMode>('empty');
  let snippetMode = $state<SnippetMode>('code');
  let websiteViewport = $state<WebsiteViewport>('desktop');
  let imageDataUrl = $state('');
  let sourceWidth = $state(0);
  let sourceHeight = $state(0);
  let sourceLabel = $state('');
  let snippetContent = $state('');
  let language = $state('typescript');
  let draft = $state('');
  let websiteUrl = $state('');
  let dragging = $state(false);
  let capturing = $state(false);
  let sceneA = $state('');
  let sceneB = $state('');
  let sceneGenerationA = 0;
  let sceneGenerationB = 0;
  let activeSceneSlot = $state<-1 | 0 | 1>(-1);
  let serverPreviewUrl = $state('');
  let sceneLoading = $state(false);
  let copiedInstall = $state(false);
  let supported = $state<boolean | null>(null);
  let previewFrame = $state<HTMLIFrameElement>();
  let previewFrameA = $state<HTMLIFrameElement>();
  let previewFrameB = $state<HTMLIFrameElement>();
  let panning = $state(false);
  let lastPointer = { x: 0, y: 0 };
  let sceneGeneration = 0;

  const siteUrl = getSiteUrl();
  const endpoint = getMcpUrl();
  const installCommand = `claude mcp add --transport http devshot ${endpoint}`;
  const acceptedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const hasSource = $derived(sourceMode === 'snippet' ? Boolean(snippetContent.trim()) : Boolean(imageDataUrl));
  const visualSource = $derived(sourceMode === 'image' || sourceMode === 'website');

  $effect(() => {
    const currentOptions = { ...options };
    const currentMode = sourceMode;
    const currentImage = imageDataUrl;
    const currentContent = snippetContent;
    const currentSnippetMode = snippetMode;
    const currentLanguage = language;
    const currentLabel = sourceLabel;
    const currentSupported = supported;
    const width = sourceWidth;
    const height = sourceHeight;
    if ((currentMode === 'snippet' && !currentContent.trim()) ||
      ((currentMode === 'image' || currentMode === 'website') && !currentImage)) {
      sceneA = '';
      sceneB = '';
      activeSceneSlot = -1;
      previewFrame = undefined;
      if (serverPreviewUrl) URL.revokeObjectURL(serverPreviewUrl);
      serverPreviewUrl = '';
      sceneLoading = false;
      return;
    }
    if (currentMode === 'empty' || currentSupported === null) return;
    const generation = ++sceneGeneration;
    sceneLoading = true;
    const timeout = setTimeout(async () => {
      try {
        const input: SceneInput = currentMode === 'snippet'
          ? { kind: currentSnippetMode, content: currentContent, language: currentLanguage, label: currentLabel, siteUrl, options: currentOptions }
          : { kind: currentMode, imageDataUrl: currentImage, sourceWidth: width, sourceHeight: height, label: currentLabel, siteUrl, options: currentOptions };
        if (currentSupported) {
          const document = await createSceneDocument(input);
          if (generation === sceneGeneration) queueScene(document, generation);
        } else {
          await queueServerPreview(currentMode === 'snippet'
            ? { kind: currentSnippetMode, content: currentContent, language: currentLanguage, label: currentLabel, options: { ...currentOptions, format: 'png' } }
            : { kind: currentMode, imageDataUrl: currentImage, sourceWidth: width, sourceHeight: height, label: currentLabel, options: { ...currentOptions, format: 'png' } }, generation);
        }
      } catch (error) {
        if (generation === sceneGeneration) {
          sceneLoading = false;
          if (currentSupported) toast.error(errorMessage(error));
          else renderFailure(error, 'Server preview unavailable.', 'server-preview');
        }
      }
    }, currentMode === 'snippet' ? 180 : currentSupported ? 45 : 120);
    return () => clearTimeout(timeout);
  });

  function queueScene(document: string, generation: number) {
    if (serverPreviewUrl) {
      URL.revokeObjectURL(serverPreviewUrl);
      serverPreviewUrl = '';
    }
    const slot = activeSceneSlot === 0 ? 1 : 0;
    if (slot === 0) {
      sceneGenerationA = generation;
      sceneA = document;
    } else {
      sceneGenerationB = generation;
      sceneB = document;
    }
  }

  async function queueServerPreview(body: Record<string, unknown>, generation: number) {
    const response = await fetch('/api/beautify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(await response.text());
    const url = URL.createObjectURL(await response.blob());
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    if (generation !== sceneGeneration) {
      URL.revokeObjectURL(url);
      return;
    }
    const previousUrl = serverPreviewUrl;
    serverPreviewUrl = url;
    sceneA = '';
    sceneB = '';
    activeSceneSlot = -1;
    previewFrame = undefined;
    sceneLoading = false;
    if (previousUrl) setTimeout(() => URL.revokeObjectURL(previousUrl), 0);
  }

  async function sceneFrameLoaded(slot: 0 | 1) {
    const frame = slot === 0 ? previewFrameA : previewFrameB;
    const generation = slot === 0 ? sceneGenerationA : sceneGenerationB;
    if (!frame || !generation) return;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const currentGeneration = slot === 0 ? sceneGenerationA : sceneGenerationB;
      if (generation !== currentGeneration || generation !== sceneGeneration) return;
      const frameWindow = frame.contentWindow as (Window & { __DEVSHOT_READY__?: boolean }) | null;
      if (frameWindow?.__DEVSHOT_READY__) {
        const previousSlot = activeSceneSlot;
        const previousGeneration = previousSlot === 0 ? sceneGenerationA : previousSlot === 1 ? sceneGenerationB : 0;
        activeSceneSlot = slot;
        previewFrame = frame;
        sceneLoading = false;
        if (previousSlot !== -1 && previousSlot !== slot) {
          setTimeout(() => {
            if (activeSceneSlot !== slot) return;
            if (previousSlot === 0 && sceneGenerationA === previousGeneration) {
              sceneA = '';
              sceneGenerationA = 0;
            } else if (previousSlot === 1 && sceneGenerationB === previousGeneration) {
              sceneB = '';
              sceneGenerationB = 0;
            }
          }, 180);
        }
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 34));
    }
    if (generation === sceneGeneration) {
      sceneLoading = false;
      toast.error('The preview canvas did not finish rendering.');
    }
  }

  onMount(() => {
    supported = 'drawElementImage' in CanvasRenderingContext2D.prototype && 'requestPaint' in HTMLCanvasElement.prototype;
    const handlePaste = (event: ClipboardEvent) => {
      const image = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.kind === 'file' && acceptedImageTypes.has(item.type))
        ?.getAsFile();
      if (image) {
        event.preventDefault();
        void loadFile(image);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest('.source-editor,.source-field')) return;
      const text = event.clipboardData?.getData('text/plain').trim();
      if (text) {
        event.preventDefault();
        void acceptText(text);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
      if (serverPreviewUrl) URL.revokeObjectURL(serverPreviewUrl);
    };
  });

  function errorMessage(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error);
    try {
      const parsed = JSON.parse(raw) as { error?: string; message?: string };
      return parsed.error || parsed.message || raw;
    } catch {
      return raw;
    }
  }

  function looksLikeUrl(value: string): boolean {
    try {
      const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
      const url = new URL(candidate);
      return Boolean(url.hostname.includes('.'));
    } catch {
      return false;
    }
  }

  function normalizeUrl(value: string): string {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  function guessLanguage(value: string): string {
    if (/^\s*[<{][\s\S]*[>}]\s*$/.test(value) && /"[^"\n]+"\s*:/.test(value)) return 'json';
    if (/\b(interface|type|const|let|function)\b/.test(value) && /[:=][^=]/.test(value)) return 'typescript';
    if (/\b(def|import|from|print)\b/.test(value) && /:\s*(?:\n|$)/.test(value)) return 'python';
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/im.test(value)) return 'sql';
    if (/^\s*(?:#!.*(?:sh|bash)|(?:npm|pnpm|yarn|git)\s)/m.test(value)) return 'bash';
    if (/<[a-z][\s\S]*>/i.test(value)) return 'html';
    return 'text';
  }

  async function acceptText(value = draft) {
    const text = value.trim();
    if (!text) return;
    if (looksLikeUrl(text) && !text.includes('\n')) {
      websiteUrl = normalizeUrl(text);
      draft = '';
      await captureUrl();
      return;
    }
    sourceMode = 'snippet';
    snippetMode = 'code';
    snippetContent = text;
    language = guessLanguage(text);
    sourceLabel = language === 'text' ? 'snippet.txt' : `snippet.${language}`;
    options.style = 'clean';
    options.aspectRatio = '16:9';
    draft = '';
  }

  async function loadFile(file?: File) {
    if (!file || !acceptedImageTypes.has(file.type)) {
      toast.error('Choose a PNG, JPEG or WebP image.');
      return;
    }
    try {
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
      sourceMode = 'image';
      imageDataUrl = value;
      sourceWidth = dimensions.width;
      sourceHeight = dimensions.height;
      sourceLabel = file.name;
      options.style = 'clean';
      resetFocus(false);
    } catch (error) {
      toast.error('Could not read that image.', { description: errorMessage(error) });
    }
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) {
      await loadFile(file);
      return;
    }
    const text = event.dataTransfer?.getData('text/plain').trim();
    if (text) await acceptText(text);
  }

  async function captureUrl() {
    const value = websiteUrl.trim();
    if (!looksLikeUrl(value)) {
      toast.error('Enter a public website URL.');
      return;
    }
    capturing = true;
    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: normalizeUrl(value), viewport: websiteViewport })
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json() as { imageDataUrl: string; sourceWidth: number; sourceHeight: number; finalUrl: string };
      sourceMode = 'website';
      imageDataUrl = result.imageDataUrl;
      sourceWidth = result.sourceWidth;
      sourceHeight = result.sourceHeight;
      websiteUrl = result.finalUrl;
      sourceLabel = result.finalUrl;
      options.style = 'browser';
      options.fit = 'cover';
      resetFocus(false);
      toast.success('Website captured.', { description: `${result.sourceWidth} × ${result.sourceHeight}` });
    } catch (error) {
      const message = errorMessage(error);
      toast.error('Could not capture the website.', {
        description: message,
        duration: 9000,
        action: message.includes('chrome-beta') || message.includes('Chrome Beta') ? {
          label: 'Copy setup command',
          onClick: () => navigator.clipboard.writeText('pnpm exec playwright install chrome-beta')
        } : undefined
      });
    } finally {
      capturing = false;
    }
  }

  function requestBody(format = options.format) {
    const renderOptions = { ...options, format };
    return sourceMode === 'snippet'
      ? { kind: snippetMode, content: snippetContent, language, label: sourceLabel, options: renderOptions }
      : { kind: sourceMode, imageDataUrl, sourceWidth, sourceHeight, label: sourceLabel, options: renderOptions };
  }

  async function waitForLocalCanvas(): Promise<HTMLCanvasElement | null> {
    if (!supported || !previewFrame?.contentDocument) return null;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const frameWindow = previewFrame.contentWindow as (Window & { __DEVSHOT_READY__?: boolean }) | null;
      const canvas = previewFrame.contentDocument.querySelector<HTMLCanvasElement>('#shot');
      if (frameWindow?.__DEVSHOT_READY__ && canvas) return canvas;
      await new Promise((resolve) => setTimeout(resolve, 34));
    }
    return null;
  }

  async function renderedBlob(format: 'png' | 'jpeg'): Promise<Blob> {
    const canvas = await waitForLocalCanvas();
    if (canvas) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, `image/${format}`, options.quality / 100));
      if (blob) return blob;
    }
    const response = await fetch('/api/beautify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestBody(format))
    });
    if (!response.ok) throw new Error(await response.text());
    return response.blob();
  }

  function renderFailure(error: unknown, title = 'Rendering unavailable.', id?: string) {
    const message = errorMessage(error);
    toast.error(title, {
      id,
      description: message,
      duration: 10_000,
      action: message.includes('chrome-beta') || message.includes('Chrome Beta') ? {
        label: 'Copy install command',
        onClick: () => navigator.clipboard.writeText('pnpm exec playwright install chrome-beta')
      } : undefined
    });
  }

  async function download() {
    try {
      const blob = await renderedBlob(options.format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `devshot.${options.format === 'jpeg' ? 'jpg' : 'png'}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success('DevShot downloaded.');
    } catch (error) {
      renderFailure(error);
    }
  }

  async function copyImage() {
    try {
      if (!('ClipboardItem' in window) || !navigator.clipboard?.write) throw new Error('Image clipboard is not supported by this browser');
      const blob = await renderedBlob('png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('Image copied as PNG.');
    } catch (error) {
      renderFailure(error);
    }
  }

  async function copyInstall() {
    await navigator.clipboard.writeText(installCommand);
    copiedInstall = true;
    toast.success('MCP command copied.');
    setTimeout(() => copiedInstall = false, 1600);
  }

  function resetFocus(switchToFit = true) {
    options.focusX = 0.5;
    options.focusY = sourceMode === 'website' ? 0 : 0.5;
    options.zoom = 1;
    if (switchToFit) options.fit = 'contain';
  }

  function beginPan(event: PointerEvent) {
    if (!visualSource || !hasSource || options.fit !== 'cover' || (event.target as HTMLElement).closest('button,label,input')) return;
    panning = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function movePan(event: PointerEvent) {
    if (!panning) return;
    const element = event.currentTarget as HTMLElement;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    options.focusX = Math.max(0, Math.min(1, options.focusX - dx / Math.max(180, element.clientWidth * 0.55)));
    options.focusY = Math.max(0, Math.min(1, options.focusY - dy / Math.max(180, element.clientHeight * 0.55)));
    lastPointer = { x: event.clientX, y: event.clientY };
  }

  function endPan(event: PointerEvent) {
    panning = false;
    const element = event.currentTarget as HTMLElement;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  }

</script>

<svelte:head>
  <title>DevShot — screenshots with taste</title>
  <meta name="description" content="A free, opinionated screenshot beautifier for humans and MCP agents." />
  <link rel="canonical" href={siteUrl} />
  <meta property="og:url" content={siteUrl} />
</svelte:head>

<header class="topbar">
  <a class="brand" href="/" aria-label="DevShot home"><img class="brand-mark" src="/favicon.svg" alt=""><span>DevShot</span><b>LABS</b></a>
  <div class="top-actions"><span class="free-pill">FREE FOREVER</span><a href="#mcp">MCP FOR AGENTS</a></div>
</header>

<main>
  <section class="intro">
    <div><div class="kicker"><Sparkles size={15} strokeWidth={2.6} /> Screenshot beautifier with opinions</div><h1>Drop the screenshot.<br><em>Keep the taste.</em></h1></div>
    <p>Paste an image, a public URL or code.<br>DevShot picks a frame. You make it yours.</p>
  </section>

  {#if supported === false}
    <aside class="experiment-callout">
      <div class="experiment-icon">β</div>
      <div><strong>Your browser cannot render HTML-in-Canvas locally.</strong><span>Preview and downloads will use server-side Chrome Beta. For local rendering, install <a href="https://www.google.com/chrome/beta/">Chrome Beta</a> and enable <code>chrome://flags/#canvas-draw-element</code>.</span></div>
      <span class="no-fallback">SERVER MODE</span>
    </aside>
  {/if}

  <section class="workspace" class:is-unsupported={supported === false}>
    <div
      class:pan-ready={visualSource && hasSource && options.fit === 'cover'}
      class:panning
      class="stage-shell"
      role="presentation"
      onpointerdown={beginPan}
      onpointermove={movePan}
      onpointerup={endPan}
      onpointercancel={endPan}
    >
      <div class="stage-toolbar"><span>LIVE CANVAS · {visualSource && hasSource ? options.fit === 'cover' ? 'ZOOM · DRAG TO FOCUS' : 'FIT · FULL IMAGE' : sourceMode === 'snippet' ? 'EDIT IN THE PANEL' : 'PASTE TO START'}</span><span>{options.width}px · {options.aspectRatio}</span></div>
      {#if serverPreviewUrl}
        <img class="server-preview" src={serverPreviewUrl} alt="DevShot server-rendered preview">
        {#if visualSource && options.fit === 'cover'}<span class="zoom-pill">{Math.round(options.zoom * 100)}%</span>{/if}
      {:else if sceneA || sceneB}
        <iframe bind:this={previewFrameA} class:active-preview={activeSceneSlot === 0} title="DevShot preview" srcdoc={sceneA} onload={() => void sceneFrameLoaded(0)}></iframe>
        <iframe bind:this={previewFrameB} class:active-preview={activeSceneSlot === 1} title="DevShot preview buffer" srcdoc={sceneB} onload={() => void sceneFrameLoaded(1)}></iframe>
        {#if visualSource && options.fit === 'cover'}<span class="zoom-pill">{Math.round(options.zoom * 100)}%</span>{/if}
      {:else if sceneLoading}
        <div class="stage-loading"><Sparkles size={24} /> Building the frame…</div>
      {:else if hasSource}
        <div class="stage-unavailable"><Sparkles size={24} /><strong>Preview unavailable.</strong><span>Your source is still loaded. Check the rendering setup, then change any option to retry.</span></div>
      {:else}
        <div
          class:dragging
          class="dropzone smart-dropzone"
          role="group"
          ondragover={(event) => { event.preventDefault(); dragging = true; }}
          ondragleave={() => dragging = false}
          ondrop={(event) => void handleDrop(event)}
        >
          <span class="drop-icon"><ImagePlus size={30} /></span>
          <strong>Drop anything worth framing.</strong>
          <small>Image, public URL or code · paste anywhere</small>
          <form class="smart-entry" onsubmit={(event) => { event.preventDefault(); void acceptText(); }}>
            <textarea class="source-field" bind:value={draft} rows="2" placeholder="Paste a URL or code…" onpaste={(event) => { const text = event.clipboardData?.getData('text/plain'); if (text) { event.preventDefault(); void acceptText(text); } }}></textarea>
            <Button type="submit" size="icon" variant="accent" icon={ArrowRight} aria-label="Use pasted content" disabled={!draft.trim()} />
          </form>
          <div class="drop-actions">
            <label class="browse"><ImagePlus size={15} /> Choose image<input type="file" accept="image/png,image/jpeg,image/webp" onchange={(event) => loadFile(event.currentTarget.files?.[0])}></label>
            <button type="button" onclick={() => { draft = 'https://'; }}><LinkIcon size={14} /> URL</button>
            <button type="button" onclick={() => { draft = 'const '; }}><Code2 size={14} /> Code</button>
          </div>
        </div>
      {/if}
    </div>

    <aside class="controls">
      <div class="panel-heading"><div><span>MAKE IT POP</span><h2>Your frame, your rules.</h2></div><span class="beta">BETA</span></div>

      {#if sourceMode === 'image'}
        <div class="source-block"><div class="source-title"><span>IMAGE</span><b>{sourceLabel}</b></div><label class="replace-source">Replace<input type="file" accept="image/png,image/jpeg,image/webp" onchange={(event) => loadFile(event.currentTarget.files?.[0])}></label></div>
      {:else if sourceMode === 'website'}
        <div class="source-block"><div class="source-title"><span>WEBSITE</span><b>{sourceWidth} × {sourceHeight}</b></div><div class="url-row"><input class="source-field" bind:value={websiteUrl} aria-label="Website URL"><Button size="icon-sm" variant="outline" icon={ArrowRight} onclick={captureUrl} loading={capturing} aria-label="Capture URL" /></div><div class="mini-switch"><button class:active={websiteViewport === 'desktop'} onclick={() => websiteViewport = 'desktop'}>Desktop</button><button class:active={websiteViewport === 'mobile'} onclick={() => websiteViewport = 'mobile'}>Mobile</button></div></div>
      {:else if sourceMode === 'snippet'}
        <div class="source-block"><div class="snippet-switch"><button class:active={snippetMode === 'code'} onclick={() => snippetMode = 'code'}>Code</button><button class:active={snippetMode === 'terminal'} onclick={() => snippetMode = 'terminal'}>Terminal</button></div><textarea class="source-editor" bind:value={snippetContent} rows="8" aria-label="Snippet content"></textarea><div class="snippet-meta"><input class="source-field" bind:value={sourceLabel} placeholder="filename.ts" aria-label="Filename">{#if snippetMode === 'code'}<select bind:value={language} aria-label="Language"><option value="text">Plain text</option><option value="typescript">TypeScript</option><option value="javascript">JavaScript</option><option value="tsx">TSX</option><option value="python">Python</option><option value="rust">Rust</option><option value="go">Go</option><option value="bash">Bash</option><option value="json">JSON</option><option value="html">HTML</option><option value="css">CSS</option><option value="sql">SQL</option><option value="svelte">Svelte</option></select>{/if}</div></div>
      {/if}

      {#if sourceMode === 'empty'}
        <div class="empty-hint"><Sparkles size={18} /> Your controls appear after the first paste.</div>
      {:else}
        <fieldset><legend>STYLE</legend><div class="style-grid">{#each ['clean', 'browser', 'poster'] as value}<button class:active={options.style === value} onclick={() => options.style = value as BeautifyOptions['style']}><i class={`style-${value}`}></i>{value}</button>{/each}</div></fieldset>

        <fieldset><legend>BACKGROUND</legend><div class="swatches">{#each Object.entries(backgrounds) as [id, background]}<button class:active={options.background === id} style={`--swatch:linear-gradient(135deg,${background.colors.join(',')})`} onclick={() => options.background = id as BeautifyOptions['background']} aria-label={background.label}><span></span></button>{/each}</div></fieldset>

        <div class="field-grid"><label><span>SHAPE</span><select bind:value={options.aspectRatio}><option>original</option><option>1:1</option><option>16:9</option><option>4:3</option><option>3:2</option><option>9:16</option></select></label>{#if visualSource}<label><span>VIEW</span><select bind:value={options.fit} onchange={() => { if (options.fit === 'contain') resetFocus(false); }}><option value="contain">Fit</option><option value="cover">Zoom</option></select></label>{:else}<label><span>FORMAT</span><select bind:value={options.format}><option value="png">PNG</option><option value="jpeg">JPG</option></select></label>{/if}</div>

        <label class="range"><span><b>PADDING</b><output>{options.padding}px</output></span><input type="range" min="0" max="240" step="8" bind:value={options.padding}></label>
        {#if visualSource && options.fit === 'cover'}<label class="range"><span><b>ZOOM</b><output>{Math.round(options.zoom * 100)}%</output></span><input type="range" min="1" max="4" step="0.05" bind:value={options.zoom}></label><button class="reset-focus" onclick={() => resetFocus(false)}><RotateCcw size={13} /> Reset focus</button>{/if}

        <div class="field-grid"><label><span>WIDTH</span><select bind:value={options.width}><option value={1200}>1200 px</option><option value={1600}>1600 px</option><option value={2400}>2400 px</option><option value={3200}>3200 px</option></select></label>{#if visualSource}<label><span>FORMAT</span><select bind:value={options.format}><option value="png">PNG</option><option value="jpeg">JPG</option></select></label>{:else}<label><span>ROUNDED</span><select bind:value={options.radius}><option value={0}>Sharp</option><option value={24}>Soft</option><option value={48}>Round</option></select></label>{/if}</div>

        <div class="export-actions"><Button class="export" size="lg" icon={Download} onclick={download} loadingContent="Rendering…" disabled={!hasSource || sceneLoading}>Download the good stuff</Button><Button class="copy-image" size="icon" variant="accent" icon={Copy} onclick={copyImage} loadingContent="" disabled={!hasSource || sceneLoading} aria-label="Copy image" title="Copy image as PNG" /></div>
        <p class="microcopy">Local canvas when supported · server-side Chrome Beta otherwise.</p>
      {/if}
    </aside>
  </section>

  <section class="mcp-card" id="mcp">
    <div class="mcp-copy"><span class="terminal-icon"><TerminalIcon size={22} /></span><p class="kicker">FREE MCP TOOL</p><h2>Your agent has screenshots.<br><em>Give it taste.</em></h2><p>Connect once. Then ask Claude, Codex or any MCP client to frame a screenshot and return the finished PNG in the response.</p></div>
    <div class="install-box"><div class="install-head"><span>ONE-LINE INSTALL</span><span class="live-dot">PUBLIC · NO AUTH</span></div><code>{installCommand}</code><Button variant="accent" size="sm" icon={copiedInstall ? Check : Copy} onclick={copyInstall}>{copiedInstall ? 'Copied' : 'Copy command'}</Button><small>Streamable HTTP · tool: <b>beautify_screenshot</b></small></div>
  </section>
</main>

<footer><span>DEVSHOT · BUILT FOR SCREENSHOTS THAT DESERVE BETTER</span><span>OPEN SOURCE · ZERO AI · 100% OPINION</span></footer>
