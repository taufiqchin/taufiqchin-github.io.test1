declare module "pica" {
  interface PicaResizeOptions {
    unsharpAmount?: number
  }
  interface Pica {
    resize(from: HTMLCanvasElement, to: HTMLCanvasElement, options?: PicaResizeOptions): Promise<void>
  }
  export default function pica(): Pica
}
