import { z } from 'zod';

export const backgroundIds = ['lemonade', 'bubblegum', 'electric', 'sunset', 'midnight', 'paper'] as const;
export const aspectRatios = ['original', '1:1', '16:9', '4:3', '3:2', '2:1', '9:16', '4:5'] as const;
export const fitModes = ['contain', 'cover'] as const;
export const shadowStyles = ['none', 'soft', 'float', 'hard'] as const;
export const outputFormats = ['png', 'jpeg'] as const;
export const frameStyles = ['clean', 'browser', 'poster'] as const;
export const looks = ['clean', 'pop', 'noir', 'acid', 'dream'] as const;
export const effects = ['none', 'glow', 'orbit', 'grid'] as const;

export const beautifyOptionsSchema = z.object({
  background: z.enum(backgroundIds).default('lemonade'),
  aspectRatio: z.enum(aspectRatios).default('16:9'),
  fit: z.enum(fitModes).default('contain'),
  padding: z.number().int().min(0).max(320).default(96),
  radius: z.number().int().min(0).max(96).default(24),
  shadow: z.enum(shadowStyles).default('float'),
  style: z.enum(frameStyles).default('clean'),
  look: z.enum(looks).default('clean'),
  effect: z.enum(effects).default('glow'),
  focusX: z.number().min(0).max(1).default(0.5),
  focusY: z.number().min(0).max(1).default(0.5),
  zoom: z.number().min(1).max(4).default(1),
  width: z.number().int().min(320).max(4096).default(1600),
  format: z.enum(outputFormats).default('png'),
  quality: z.number().int().min(40).max(100).default(92)
});

export type BeautifyOptions = z.infer<typeof beautifyOptionsSchema>;

export const backgrounds: Record<(typeof backgroundIds)[number], { label: string; colors: string[] }> = {
  lemonade: { label: 'Lemonade', colors: ['#d8ff52', '#76e8ff', '#8465ff'] },
  bubblegum: { label: 'Bubblegum', colors: ['#ff4f9a', '#ff9a62', '#fff16a'] },
  electric: { label: 'Electric', colors: ['#7137ff', '#2575fc', '#21e6c1'] },
  sunset: { label: 'Sunset', colors: ['#ff4f64', '#ffad5f', '#fff0a5'] },
  midnight: { label: 'Midnight', colors: ['#09090b', '#22144f', '#7137ff'] },
  paper: { label: 'Paper', colors: ['#faf8f2', '#eeeae0', '#ffffff'] }
};

export function ratioValue(ratio: BeautifyOptions['aspectRatio'], sourceRatio = 16 / 9): number {
  if (ratio === 'original') return sourceRatio;
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
}
