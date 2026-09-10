<script lang="ts">
  import type { SceneInput } from '$lib/core/scene-model';
  import { sceneBackground, sceneModel } from '$lib/core/scene-model';

  let { input, contentHtml, root = $bindable() }: {
    input: SceneInput;
    contentHtml: string;
    root?: HTMLDivElement;
  } = $props();

  const model = $derived(sceneModel(input));
  const px = (value: number) => `${value}px`;
</script>

<div
  bind:this={root}
  id="scene"
  class={`fx-${model.options.effect}`}
  class:snippet={!model.visual}
  class:poster={model.options.style === 'poster'}
  drawable
  style:width={px(model.width)}
  style:height={px(model.height)}
  style:padding={px(model.padding)}
  style:--scale={model.scale}
  style:background={`linear-gradient(135deg,${sceneBackground(model.options)})`}
>
  <div class="scene-fx"></div>
  {#if model.visual}
    <div
      class={`capture look-${model.options.look}`}
      class:poster-frame={model.options.style === 'poster'}
      style:width={px(model.frameWidth)}
      style:height={px(model.frameMediaHeight + model.chromeHeight)}
      style:border-radius={px(model.radius)}
      style:box-shadow={model.shadow}
    >
      {#if model.chrome}
        <div class="browser-bar" style:height={px(model.chromeHeight)} style:border-radius={`${px(model.radius)} ${px(model.radius)} 0 0`}>
          <span class="traffic"><i></i><i></i><i></i></span>
          <span class="address">{model.label}</span>
          <b>↗</b>
        </div>
      {/if}
      <div
        class="media"
        style:width={px(model.frameWidth)}
        style:height={px(model.frameMediaHeight)}
        style:border-radius={model.chrome ? `0 0 ${px(model.radius)} ${px(model.radius)}` : px(model.radius)}
      >
        <img id="source" src={model.image} alt="" draggable="false" style:left={px(model.imageLeft)} style:top={px(model.imageTop)} style:width={px(model.imageWidth)} style:height={px(model.imageHeight)}>
      </div>
    </div>
  {:else}
    <div
      class="snippet-card"
      class:poster-frame={model.options.style === 'poster'}
      class:browser-frame={model.options.style === 'browser'}
      style:width={px(model.contentWidth)}
      style:max-height={px(model.contentHeight)}
      style:border-radius={px(model.radius)}
      style:box-shadow={model.shadow}
    >
      <div class="window-bar">
        <span class="traffic"><i></i><i></i><i></i></span>
        <span>{model.label}</span>
        <b>{model.mode === 'terminal' ? 'SHELL' : 'CODE'}</b>
      </div>
      <div class="snippet-body" style:max-height={px(model.contentHeight - Math.round(54 * model.scale))} style:--font-size={px(model.fontSize)}>
        {@html contentHtml}
      </div>
    </div>
  {/if}

  <a id="watermark" href={model.site.origin} style:--radius={px(Math.round(12 * model.scale))}>
    <svg viewBox="0 0 64 64" fill="none">
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#18181b"/>
      <rect x="17" y="14" width="36" height="30" rx="7" fill="#7137ff" transform="rotate(5 35 29)"/>
      <rect x="11" y="19" width="39" height="31" rx="8" fill="#d8ff52"/>
      <rect x="16" y="24" width="29" height="21" rx="4" fill="#18181b"/>
      <circle cx="22" cy="30" r="3" fill="#ff5a59"/>
      <path d="m18 42 8-7 5 4 5-5 7 8H18Z" fill="#f7f5ee"/>
    </svg>
    <span>Made with DevShot</span>
    <small>{model.site.hostname || model.site.host}</small>
  </a>
</div>

<style>
  :global(*){box-sizing:border-box}
  #scene{position:relative;display:flex;align-items:center;justify-content:center;isolation:isolate;overflow:hidden}
  #scene:before{content:"";position:absolute;inset:-20%;z-index:-2;background:radial-gradient(circle at 18% 12%,rgba(255,255,255,.52),transparent 28%),radial-gradient(circle at 86% 86%,rgba(255,255,255,.22),transparent 30%);mix-blend-mode:overlay}
  #scene:after{content:"POP";position:absolute;right:calc(-28px * var(--scale));bottom:calc(-70px * var(--scale));z-index:-1;color:rgba(255,255,255,.11);font:600 calc(220px * var(--scale))/.8 sans-serif;letter-spacing:-.1em;transform:rotate(-8deg)}
  .scene-fx{position:absolute;inset:0;z-index:0;pointer-events:none}
  .fx-glow .scene-fx{inset:12%;border-radius:35%;background:conic-gradient(from 25deg,#d8ff52,#76e8ff,#7137ff,#ff4f9a,#d8ff52);filter:blur(calc(55px * var(--scale)));opacity:.72;transform:scale(.82)}
  .fx-orbit .scene-fx:before,.fx-orbit .scene-fx:after{content:"";position:absolute;border:calc(5px * var(--scale)) solid rgba(255,255,255,.58);border-radius:50%;transform:rotate(-18deg)}
  .fx-orbit .scene-fx:before{width:72%;height:38%;left:-12%;top:4%;box-shadow:0 0 calc(28px * var(--scale)) rgba(216,255,82,.5)}
  .fx-orbit .scene-fx:after{width:58%;height:78%;right:-12%;bottom:-25%;border-color:rgba(113,55,255,.7)}
  .fx-grid .scene-fx{background-image:linear-gradient(rgba(255,255,255,.24) calc(2px * var(--scale)),transparent calc(2px * var(--scale))),linear-gradient(90deg,rgba(255,255,255,.24) calc(2px * var(--scale)),transparent calc(2px * var(--scale)));background-size:calc(62px * var(--scale)) calc(62px * var(--scale));mask-image:linear-gradient(155deg,transparent 4%,#000 46%,transparent 88%);transform:perspective(600px) rotateX(18deg) scale(1.18)}
  .capture{position:relative;z-index:1}
  .media{position:relative;overflow:hidden;background:rgba(255,255,255,.1)}
  .media:after{content:"";position:absolute;inset:0;pointer-events:none}
  .media img{display:block;position:absolute;max-width:none;object-fit:fill;user-select:none;-webkit-user-drag:none}
  .look-clean .media:after{backdrop-filter:contrast(1.03) saturate(1.04)}
  .look-pop .media:after{background:radial-gradient(circle at 20% 10%,rgba(255,255,255,.55),transparent 40%),linear-gradient(135deg,rgba(216,255,82,.25),rgba(113,55,255,.34));backdrop-filter:contrast(1.14) saturate(1.42);mix-blend-mode:soft-light}
  .look-noir .media img{filter:grayscale(1) contrast(1.28) brightness(.9)}
  .look-noir .media:after{background:radial-gradient(circle,transparent 38%,rgba(0,0,0,.7) 110%);mix-blend-mode:multiply}
  .look-acid .media img{filter:grayscale(1) contrast(1.3)}
  .look-acid .media:after{background:linear-gradient(135deg,#d8ff52 5%,#76e8ff 48%,#7137ff 100%);mix-blend-mode:color;opacity:.68}
  .look-dream .media img{filter:saturate(1.35) contrast(.92) brightness(1.08)}
  .look-dream .media:after{background:radial-gradient(circle at 18% 18%,rgba(255,255,255,.78),transparent 35%),linear-gradient(145deg,rgba(255,79,154,.45),transparent 44%,rgba(113,55,255,.5));mix-blend-mode:screen;backdrop-filter:blur(calc(.7px * var(--scale)))}
  .browser-bar,.window-bar{display:grid;grid-template-columns:auto 1fr auto;align-items:center}
  .browser-bar{padding:0 calc(17px * var(--scale));gap:calc(18px * var(--scale));background:#f8f6ef;color:#27262b;font:600 calc(12px * var(--scale))/1 sans-serif}
  .address{min-width:0;padding:calc(9px * var(--scale)) calc(15px * var(--scale));border-radius:999px;background:#e9e6dd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#6a676f}
  .traffic{display:flex;gap:calc(7px * var(--scale))}
  .traffic i{display:block;width:calc(10px * var(--scale));height:calc(10px * var(--scale));border-radius:50%;background:#ff5f57}
  .traffic i:nth-child(2){background:#febc2e}.traffic i:nth-child(3){background:#28c840}
  .poster-frame{transform:rotate(-1.15deg);outline:max(2px,calc(3px * var(--scale))) solid rgba(255,255,255,.78)}
  .capture.poster-frame:before{content:"";position:absolute;inset:calc(15px * var(--scale)) calc(-15px * var(--scale)) calc(-15px * var(--scale)) calc(15px * var(--scale));border-radius:inherit;background:#7137ff;z-index:-1}
  .snippet-card{position:relative;overflow:hidden;background:#121217;z-index:1}
  .window-bar{height:calc(54px * var(--scale));padding:0 calc(20px * var(--scale));grid-template-columns:1fr auto 1fr;background:#202027;color:#aaa8b2;font:600 calc(11px * var(--scale))/1 sans-serif;letter-spacing:.12em;text-transform:uppercase}
  .window-bar b{justify-self:end;color:#d8ff52;font-size:calc(9px * var(--scale))}
  .snippet-body{overflow:hidden;padding:calc(34px * var(--scale)) calc(38px * var(--scale));background:linear-gradient(145deg,#17171d,#101014)}
  .snippet-body :global(pre){margin:0!important;padding:0!important;background:transparent!important;font:var(--font-size)/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;white-space:pre-wrap;overflow-wrap:anywhere}
  .snippet-body :global(code){font:inherit}.snippet-body :global(.terminal){color:#f5f4f7;line-height:1.58}
  .browser-frame .window-bar{background:#f4f1e9;color:#5d5962}.browser-frame .snippet-body{background:#18181d}
  #watermark{position:absolute;right:calc(22px * var(--scale));bottom:calc(18px * var(--scale));z-index:5;display:grid;grid-template-columns:calc(31px * var(--scale)) auto;column-gap:calc(8px * var(--scale));align-items:center;padding:calc(7px * var(--scale)) calc(10px * var(--scale));border:1px solid rgba(255,255,255,.24);border-radius:var(--radius);background:rgba(24,24,27,.78);color:white;text-decoration:none;font-family:sans-serif;backdrop-filter:blur(calc(10px * var(--scale)))}
  #watermark svg{grid-row:1/3;width:calc(31px * var(--scale));height:calc(31px * var(--scale))}#watermark span{font-size:calc(10px * var(--scale));font-weight:600;line-height:1.15}#watermark small{color:#d8ff52;font-size:calc(8px * var(--scale));line-height:1.1}
</style>
