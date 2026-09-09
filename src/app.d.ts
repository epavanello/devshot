declare global {
  namespace App {}

  interface Window {
    __DEVSHOT_READY__?: boolean;
  }

  interface CanvasRenderingContext2D {
    drawElementImage(element: Element, dx: number, dy: number, dwidth?: number, dheight?: number, options?: { preserveElementGeometry?: boolean }): void;
  }

  interface HTMLCanvasElement {
    requestPaint(): void;
  }
}

export {};
