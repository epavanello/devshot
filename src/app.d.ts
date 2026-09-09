declare global {
  namespace App {}

  interface Window {
    __DEVSHOT_READY__?: boolean;
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

export {};
