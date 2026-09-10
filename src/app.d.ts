declare global {
  namespace App {}

  interface Window {
    __DEVSHOT_RENDER__?: (input: import('$lib/core/scene-model').SceneInput) => Promise<void>;
  }

  interface CanvasRenderingContext2D {
    drawElementImage(element: Element, dx: number, dy: number): DOMMatrix;
    drawElementImage(element: Element, dx: number, dy: number, dwidth: number, dheight: number): DOMMatrix;
    drawElementImage(element: Element, sx: number, sy: number, swidth: number, sheight: number, dx: number, dy: number): DOMMatrix;
    drawElementImage(element: Element, sx: number, sy: number, swidth: number, sheight: number, dx: number, dy: number, dwidth: number, dheight: number): DOMMatrix;
  }

  interface HTMLCanvasElement {
    requestPaint(): void;
  }
}

declare module 'svelte/elements' {
  interface HTMLAttributes<T> {
    drawable?: boolean | '';
  }

  interface HTMLCanvasAttributes {
    layoutsubtree?: boolean | '';
  }
}

export {};
