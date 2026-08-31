import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [clampAlbedoChannel((value >> 16) & 255), clampAlbedoChannel((value >> 8) & 255), clampAlbedoChannel(value & 255)];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampAlbedoChannel(value: number): number {
  return Math.max(30, Math.min(240, Math.round(value)));
}

function clampPbrF0(value: number): number {
  return Math.max(0.02, Math.min(1, value));
}

function clampPbrIor(value: number): number {
  return Math.max(1, Math.min(2.5, value));
}

function clampPbrMetalness(value: number): number {
  return value >= 0.5 ? 1 : 0;
}

function clampedAlbedoColor(spec: SculptMaterialSpec): THREE.Color {
  const source = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  // setStyle with an explicit SRGBColorSpace, NOT the numeric constructor.
  //
  // `new THREE.Color(r, g, b)` treats its arguments as LINEAR working-space components,
  // while an authored `baseColor` hex is sRGB. Feeding one to the other skipped the
  // transfer function and lifted every dark albedo: #2e2a28, authored as a near-black
  // vinyl, rendered at roughly sRGB 0.46 — a mid grey. The error is largest exactly where
  // it matters most, because the transfer curve is steepest near black.
  return new THREE.Color().setStyle(source, THREE.SRGBColorSpace);
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [clampAlbedoChannel(Number(match[1])), clampAlbedoChannel(Number(match[2])), clampAlbedoChannel(Number(match[3]))];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions, denseComponent = false): THREE.MeshPhysicalMaterial {
  // A material that declares -- with evidence -- that its subject carries no texture
  // detail gets NO texture set. Synthesising one anyway is not a harmless default: the
  // branch below then forces color to white and roughness to 1 and reads both from the
  // generated maps, so the authored albedo and the reference-derived roughness are both
  // discarded, and the model gains mottling the reference does not have. Measured on the
  // tuxedo cat, whose black fur rendered as speckled grey-and-white from a palette that
  // only ever described two flat regions.
  const textureless = (spec.textureless as { declared?: boolean } | undefined)?.declared === true;
  const textures = textureless
    ? null
    : makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : clampedAlbedoColor(spec),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clampPbrMetalness(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: clampPbrIor(readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: clampPbrIor(readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clampPbrF0(readLayerNumber(spec.specularF0 ?? spec.f0 ?? spec.specularIntensity, ['base', 'value'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
    flatShading: spec.flatShading === true,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const denseMesh = denseComponent || spec.denseMesh === true || spec.geometryDensity === 'dense' || spec.topologyClass === 'dense';
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    const effectiveBumpScale = denseMesh ? Math.max(0.05, bumpScale) : bumpScale;
    if (effectiveBumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = effectiveBumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    const effectiveDisplacementScale = denseMesh ? Math.max(0.005, displacementScale) : displacementScale;
    if (effectiveDisplacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = effectiveDisplacementScale;
      material.displacementBias = -effectiveDisplacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrConstraints = { albedoRange: [30, 240], binaryMetalness: true, f0Range: [0.02, 1], iorRange: [1, 2.5] };
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.userData.referenceMaterialId = spec.referenceMaterialId ?? spec.materialReference?.profileId ?? null;
  material.userData.materialEvidence = spec.materialEvidence ?? null;
  material.userData.validationViews = spec.materialReference?.validationViews ?? [];
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: Chaoyang Clocktower Campus
// Sculpt build pass: structural-pass
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createChaoyangClocktowerCampusModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "Chaoyang Clocktower Campus";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": false, "fovDegrees": 40.0, "aspect": 1.7768331562167907, "orientation": {"yaw": 28, "pitch": 26, "roll": 0}, "positionHint": [19, 23, 42], "note": "Approximate from visible façade slopes; not a calibrated survey camera", "projection": "orthographic", "target": [0, 4.4, 0], "verticalSpan": 21.5}, "approximationNotes": []};
  root.userData.materialPipeline = {};
  root.userData.materialReferenceRegistry = null;

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["stone"] = createSculptMaterial(
    "stone",
    {"id": "stone", "name": "stone", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#e2ccb1", "color": "#e2ccb1", "albedo": {"dominant": "#e2ccb1", "secondary": ["#e2ccb1"], "samplingNotes": "Observed pixel crop 652,345,24,66; de-lighting required before map use"}, "colorVariation": {"palette": ["#e2ccb1"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "stone-variation", "region": "component surfaces", "color": "#e2ccb1", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\stone.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.751, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_albedo.png", "url": "/pbr/stone/stone_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_roughness.png", "url": "/pbr/stone/stone_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_height.png", "url": "/pbr/stone/stone_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_normal.png", "url": "/pbr/stone/stone_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\stone\\stone_ao.png", "url": "/pbr/stone/stone_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["brick"] = createSculptMaterial(
    "brick",
    {"id": "brick", "name": "brick", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#c56b41", "color": "#c56b41", "albedo": {"dominant": "#c56b41", "secondary": ["#c56b41"], "samplingNotes": "Observed pixel crop 627,529,40,30; de-lighting required before map use"}, "colorVariation": {"palette": ["#c56b41"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "brick-variation", "region": "component surfaces", "color": "#c56b41", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\brick.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.8, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_albedo.png", "url": "/pbr/brick/brick_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_roughness.png", "url": "/pbr/brick/brick_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_height.png", "url": "/pbr/brick/brick_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_normal.png", "url": "/pbr/brick/brick_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\brick\\brick_ao.png", "url": "/pbr/brick/brick_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["roof"] = createSculptMaterial(
    "roof",
    {"id": "roof", "name": "roof", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#b87c63", "color": "#b87c63", "albedo": {"dominant": "#b87c63", "secondary": ["#b87c63"], "samplingNotes": "Observed pixel crop 1170,396,63,25; de-lighting required before map use"}, "colorVariation": {"palette": ["#b87c63"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "roof-variation", "region": "component surfaces", "color": "#b87c63", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\roof.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.769, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_albedo.png", "url": "/pbr/roof/roof_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_roughness.png", "url": "/pbr/roof/roof_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_height.png", "url": "/pbr/roof/roof_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_normal.png", "url": "/pbr/roof/roof_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\roof\\roof_ao.png", "url": "/pbr/roof/roof_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["foliage"] = createSculptMaterial(
    "foliage",
    {"id": "foliage", "name": "foliage", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#a6ab47", "color": "#a6ab47", "albedo": {"dominant": "#a6ab47", "secondary": ["#a6ab47"], "samplingNotes": "Observed pixel crop 1273,483,53,31; de-lighting required before map use"}, "colorVariation": {"palette": ["#a6ab47"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "foliage-variation", "region": "component surfaces", "color": "#a6ab47", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\foliage.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.793, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_albedo.png", "url": "/pbr/foliage/foliage_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_roughness.png", "url": "/pbr/foliage/foliage_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_height.png", "url": "/pbr/foliage/foliage_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_normal.png", "url": "/pbr/foliage/foliage_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\foliage\\foliage_ao.png", "url": "/pbr/foliage/foliage_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["base"] = createSculptMaterial(
    "base",
    {"id": "base", "name": "base", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#cdaa82", "color": "#cdaa82", "albedo": {"dominant": "#cdaa82", "secondary": ["#cdaa82"], "samplingNotes": "Observed pixel crop 125,688,110,26; de-lighting required before map use"}, "colorVariation": {"palette": ["#cdaa82"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "base-variation", "region": "component surfaces", "color": "#cdaa82", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\base.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.758, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_albedo.png", "url": "/pbr/base/base_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_roughness.png", "url": "/pbr/base/base_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_height.png", "url": "/pbr/base/base_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_normal.png", "url": "/pbr/base/base_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\base\\base_ao.png", "url": "/pbr/base/base_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["paving"] = createSculptMaterial(
    "paving",
    {"id": "paving", "name": "paving", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#faecdb", "color": "#faecdb", "albedo": {"dominant": "#faecdb", "secondary": ["#faecdb"], "samplingNotes": "Observed pixel crop 260,630,25,16; de-lighting required before map use"}, "colorVariation": {"palette": ["#faecdb"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "paving-variation", "region": "component surfaces", "color": "#faecdb", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\paving.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.777, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_albedo.png", "url": "/pbr/paving/paving_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_roughness.png", "url": "/pbr/paving/paving_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_height.png", "url": "/pbr/paving/paving_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_normal.png", "url": "/pbr/paving/paving_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\paving\\paving_ao.png", "url": "/pbr/paving/paving_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["glass"] = createSculptMaterial(
    "glass",
    {"id": "glass", "name": "glass", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#98afb3", "color": "#98afb3", "albedo": {"dominant": "#98afb3", "secondary": ["#98afb3"], "samplingNotes": "Observed pixel crop 824,237,15,31; de-lighting required before map use"}, "colorVariation": {"palette": ["#98afb3"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.29, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "glass-variation", "region": "component surfaces", "color": "#98afb3", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "clearcoat": 0.15, "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\glass.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.833, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_albedo.png", "url": "/pbr/glass/glass_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_roughness.png", "url": "/pbr/glass/glass_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_height.png", "url": "/pbr/glass/glass_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_normal.png", "url": "/pbr/glass/glass_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\glass\\glass_ao.png", "url": "/pbr/glass/glass_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["grass"] = createSculptMaterial(
    "grass",
    {"id": "grass", "name": "grass", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#b0ad3c", "color": "#b0ad3c", "albedo": {"dominant": "#b0ad3c", "secondary": ["#b0ad3c"], "samplingNotes": "Observed pixel crop 573,654,38,14; de-lighting required before map use"}, "colorVariation": {"palette": ["#b0ad3c"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "grass-variation", "region": "component surfaces", "color": "#b0ad3c", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\grass.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.776, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_albedo.png", "url": "/pbr/grass/grass_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_roughness.png", "url": "/pbr/grass/grass_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_height.png", "url": "/pbr/grass/grass_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_normal.png", "url": "/pbr/grass/grass_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\grass\\grass_ao.png", "url": "/pbr/grass/grass_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["trim"] = createSculptMaterial(
    "trim",
    {"id": "trim", "name": "trim", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#efd7bc", "color": "#efd7bc", "albedo": {"dominant": "#efd7bc", "secondary": ["#efd7bc"], "samplingNotes": "Observed pixel crop 810,356,53,14; de-lighting required before map use"}, "colorVariation": {"palette": ["#efd7bc"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "trim-variation", "region": "component surfaces", "color": "#efd7bc", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\trim.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.775, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_albedo.png", "url": "/pbr/trim/trim_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_roughness.png", "url": "/pbr/trim/trim_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_height.png", "url": "/pbr/trim/trim_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_normal.png", "url": "/pbr/trim/trim_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\trim\\trim_ao.png", "url": "/pbr/trim/trim_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["road"] = createSculptMaterial(
    "road",
    {"id": "road", "name": "road", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#d1bfaf", "color": "#d1bfaf", "albedo": {"dominant": "#d1bfaf", "secondary": ["#d1bfaf"], "samplingNotes": "Observed pixel crop 652,764,76,16; de-lighting required before map use"}, "colorVariation": {"palette": ["#d1bfaf"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "road-variation", "region": "component surfaces", "color": "#d1bfaf", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\road.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.827, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_albedo.png", "url": "/pbr/road/road_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_roughness.png", "url": "/pbr/road/road_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_height.png", "url": "/pbr/road/road_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_normal.png", "url": "/pbr/road/road_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\road\\road_ao.png", "url": "/pbr/road/road_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );
  materialMap["metal"] = createSculptMaterial(
    "metal",
    {"id": "metal", "name": "metal", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#665c4e", "color": "#665c4e", "albedo": {"dominant": "#665c4e", "secondary": ["#665c4e"], "samplingNotes": "Observed pixel crop 248,612,4,32; de-lighting required before map use"}, "colorVariation": {"palette": ["#665c4e"], "pattern": "mottled", "amplitude": 0.045, "heightCorrelation": 0.3}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.42, "role": "broad color and height breakup"}, {"id": "meso", "frequency": 12.0, "amplitude": 0.22, "role": "ridges, pores, grain, dents, or equivalent visible relief"}, {"id": "micro", "frequency": 56.0, "amplitude": 0.08, "role": "highlight breakup visible under grazing light"}], "roughness": {"base": 0.83, "variation": 0.15, "map": "independent-procedural-field", "localResponse": "higher roughness in cavities, lower roughness on worn edges"}, "metalness": {"base": 0.0, "variation": 0.0}, "normal": {"pattern": "derived-from-independent-height-field", "strength": 0.12, "scale": 24.0, "space": "tangent"}, "bump": {"pattern": "fine grain", "amplitude": 0.012, "scale": 20}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.25, "contactShadowBias": 0.35, "notes": "Darken creases, seams, intersections, and recessed local features."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "metal-variation", "region": "component surfaces", "color": "#665c4e", "roughness": 0.77, "evidenceRefs": ["full-object"], "description": "Subtle instance variation and contact-shaded relief"}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there."], "notes": "Sampled reference median; source lighting is not physical albedo", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\evidence\\material-crops\\metal.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "usable": true, "confidence": 0.77, "targetThreshold": 0.7, "verdict": "pass", "maps": {"albedo": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_albedo.png", "url": "/pbr/metal/metal_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_roughness.png", "url": "/pbr/metal/metal_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_height.png", "url": "/pbr/metal/metal_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_normal.png", "url": "/pbr/metal/metal_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\tony428tw\\Desktop\\img2threejs\\campus\\public\\pbr\\metal\\metal_ao.png", "url": "/pbr/metal/metal_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}}},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const endpoint_root_0 = makeAttachmentEndpoint(null);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "\u6821\u5712\u5fae\u7e2e\u666f\u89c0__pivot";
  node_root_0.scale.set(1, 1, 1);
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "校園微縮景觀", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "container", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 28, "height": 14, "depth": 17.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [28, 14, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": ["root"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "root-shape", "type": "raised ridge", "placement": [0, 0, 0], "size": [28, 14, 17.5], "geometryEffect": "container", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["校園微縮景觀"], "fidelityTier": "blockout", "campus": {"kind": "container", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_root_0.userData.actionProfile = {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [28, 14, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": ["root"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_root_0) {
    mesh_root_0Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "\u6821\u5712\u5fae\u7e2e\u666f\u89c0";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "校園微縮景觀", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "container", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": null, "attachment": null, "dimensions": {"width": 28, "height": 14, "depth": 17.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [28, 14, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": ["root"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "root-shape", "type": "raised ridge", "placement": [0, 0, 0], "size": [28, 14, 17.5], "geometryEffect": "container", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["校園微縮景觀"], "fidelityTier": "blockout", "campus": {"kind": "container", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "box", "offset": [0, 0, 0], "scale": [28, 14, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_root_0);
  const socket_root_assembly_origin_0 = new THREE.Object3D();
  socket_root_assembly_origin_0.name = "assembly-origin";
  socket_root_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_root_assembly_origin_0.rotation.set(0, 0, 0);
  socket_root_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_root_0.add(socket_root_assembly_origin_0);
  sockets["root:assembly-origin"] = socket_root_assembly_origin_0;

  const endpoint_plinth_1 = makeAttachmentEndpoint(null);
  const node_plinth_1 = new THREE.Group();
  node_plinth_1.name = "\u5713\u89d2\u5c55\u793a\u5e95\u5ea7__pivot";
  node_plinth_1.scale.set(1, 1, 1);
  if (endpoint_plinth_1) {
    node_plinth_1.position.copy(endpoint_plinth_1.start);
    node_plinth_1.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_plinth_1.position.set(0.0, -0.6, 0.0);
    node_plinth_1.rotation.set(0.0, 0.0, 0.0);
  }
  node_plinth_1.userData.sculptComponent = {"id": "plinth", "name": "圓角展示底座", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "plinth", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 28, "height": 1.2, "depth": 17.5}, "transform": {"position": [0, -0.6, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [28, 1.2, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "plinth", "seamRefs": [], "detachableFragments": ["plinth"], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "plinth-shape", "type": "raised ridge", "placement": [0, -0.6, 0], "size": [28, 1.2, 17.5], "geometryEffect": "plinth", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["圓角展示底座"], "fidelityTier": "blockout", "campus": {"kind": "plinth", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(205, 170, 130, 1)", "secondaryAlbedo": "rgba(205, 170, 130, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_plinth_1.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [28, 1.2, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "plinth", "seamRefs": [], "detachableFragments": ["plinth"], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_plinth_1);
  nodes["plinth"] = node_plinth_1;
  const mesh_plinth_1Geometry = endpoint_plinth_1
    ? new THREE.CylinderGeometry(endpoint_plinth_1.endRadius, endpoint_plinth_1.baseRadius, endpoint_plinth_1.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_plinth_1) {
    mesh_plinth_1Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_plinth_1 = new THREE.Mesh(
    mesh_plinth_1Geometry,
    materialMap["base"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_plinth_1.name = "\u5713\u89d2\u5c55\u793a\u5e95\u5ea7";
  if (endpoint_plinth_1) {
    mesh_plinth_1.position.copy(endpoint_plinth_1.midpoint);
    mesh_plinth_1.quaternion.copy(endpoint_plinth_1.quaternion);
  }
  mesh_plinth_1.castShadow = options.castShadow ?? true;
  mesh_plinth_1.receiveShadow = options.receiveShadow ?? true;
  mesh_plinth_1.userData.sculptComponent = {"id": "plinth", "name": "圓角展示底座", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "plinth", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 28, "height": 1.2, "depth": 17.5}, "transform": {"position": [0, -0.6, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [28, 1.2, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "plinth", "seamRefs": [], "detachableFragments": ["plinth"], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "base", "materialLayers": ["base"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "plinth-shape", "type": "raised ridge", "placement": [0, -0.6, 0], "size": [28, 1.2, 17.5], "geometryEffect": "plinth", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["圓角展示底座"], "fidelityTier": "blockout", "campus": {"kind": "plinth", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(205, 170, 130, 1)", "secondaryAlbedo": "rgba(205, 170, 130, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_plinth_1.add(mesh_plinth_1);
  meshes["plinth"] = mesh_plinth_1;
  colliders["plinth"] = {"type": "box", "offset": [0, 0, 0], "scale": [28, 1.2, 17.5], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["plinth"] ??= [];
  destructionGroups["plinth"].push(node_plinth_1);
  const socket_plinth_assembly_origin_0 = new THREE.Object3D();
  socket_plinth_assembly_origin_0.name = "assembly-origin";
  socket_plinth_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_plinth_assembly_origin_0.rotation.set(0, 0, 0);
  socket_plinth_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_plinth_1.add(socket_plinth_assembly_origin_0);
  sockets["plinth:assembly-origin"] = socket_plinth_assembly_origin_0;

  const endpoint_landscape_2 = makeAttachmentEndpoint(null);
  const node_landscape_2 = new THREE.Group();
  node_landscape_2.name = "\u62ac\u9ad8\u5ead\u5712__pivot";
  node_landscape_2.scale.set(1, 1, 1);
  if (endpoint_landscape_2) {
    node_landscape_2.position.copy(endpoint_landscape_2.start);
    node_landscape_2.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_landscape_2.position.set(0.0, 0.15, -1.4);
    node_landscape_2.rotation.set(0.0, 0.0, 0.0);
  }
  node_landscape_2.userData.sculptComponent = {"id": "landscape", "name": "抬高庭園", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "garden-base", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 26.8, "height": 0.32, "depth": 12.9}, "transform": {"position": [0, 0.15, -1.4], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.32, 12.9], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "landscape", "seamRefs": [], "detachableFragments": ["landscape"], "breakImpulse": 0.0, "debrisMaterial": "grass"}}, "material": "grass", "materialLayers": ["grass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "landscape-shape", "type": "raised ridge", "placement": [0, 0.15, -1.4], "size": [26.8, 0.32, 12.9], "geometryEffect": "garden-base", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["抬高庭園"], "fidelityTier": "blockout", "campus": {"kind": "garden-base", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(176, 173, 60, 1)", "secondaryAlbedo": "rgba(176, 173, 60, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_landscape_2.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.32, 12.9], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "landscape", "seamRefs": [], "detachableFragments": ["landscape"], "breakImpulse": 0.0, "debrisMaterial": "grass"}};
  (nodes["root"] ?? root).add(node_landscape_2);
  nodes["landscape"] = node_landscape_2;
  const mesh_landscape_2Geometry = endpoint_landscape_2
    ? new THREE.CylinderGeometry(endpoint_landscape_2.endRadius, endpoint_landscape_2.baseRadius, endpoint_landscape_2.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_landscape_2) {
    mesh_landscape_2Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_landscape_2 = new THREE.Mesh(
    mesh_landscape_2Geometry,
    materialMap["grass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_landscape_2.name = "\u62ac\u9ad8\u5ead\u5712";
  if (endpoint_landscape_2) {
    mesh_landscape_2.position.copy(endpoint_landscape_2.midpoint);
    mesh_landscape_2.quaternion.copy(endpoint_landscape_2.quaternion);
  }
  mesh_landscape_2.castShadow = options.castShadow ?? true;
  mesh_landscape_2.receiveShadow = options.receiveShadow ?? true;
  mesh_landscape_2.userData.sculptComponent = {"id": "landscape", "name": "抬高庭園", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "garden-base", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 26.8, "height": 0.32, "depth": 12.9}, "transform": {"position": [0, 0.15, -1.4], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.32, 12.9], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "landscape", "seamRefs": [], "detachableFragments": ["landscape"], "breakImpulse": 0.0, "debrisMaterial": "grass"}}, "material": "grass", "materialLayers": ["grass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "landscape-shape", "type": "raised ridge", "placement": [0, 0.15, -1.4], "size": [26.8, 0.32, 12.9], "geometryEffect": "garden-base", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["抬高庭園"], "fidelityTier": "blockout", "campus": {"kind": "garden-base", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(176, 173, 60, 1)", "secondaryAlbedo": "rgba(176, 173, 60, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_landscape_2.add(mesh_landscape_2);
  meshes["landscape"] = mesh_landscape_2;
  colliders["landscape"] = {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.32, 12.9], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["landscape"] ??= [];
  destructionGroups["landscape"].push(node_landscape_2);
  const socket_landscape_assembly_origin_0 = new THREE.Object3D();
  socket_landscape_assembly_origin_0.name = "assembly-origin";
  socket_landscape_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_landscape_assembly_origin_0.rotation.set(0, 0, 0);
  socket_landscape_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_landscape_2.add(socket_landscape_assembly_origin_0);
  sockets["landscape:assembly-origin"] = socket_landscape_assembly_origin_0;

  const endpoint_west_wing_3 = makeAttachmentEndpoint(null);
  const node_west_wing_3 = new THREE.Group();
  node_west_wing_3.name = "\u897f\u5074\u6821\u820d__pivot";
  node_west_wing_3.scale.set(1, 1, 1);
  if (endpoint_west_wing_3) {
    node_west_wing_3.position.copy(endpoint_west_wing_3.start);
    node_west_wing_3.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_wing_3.position.set(-5.4, 3.75, -1.3);
    node_west_wing_3.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_wing_3.userData.sculptComponent = {"id": "west-wing", "name": "西側校舍", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "wing", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 6.7, "depth": 5.2}, "transform": {"position": [-5.4, 3.75, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-wing", "seamRefs": [], "detachableFragments": ["west-wing"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-wing-shape", "type": "raised ridge", "placement": [-6.4, 4.4, -1.3], "size": [6.6, 7.7, 5.2], "geometryEffect": "wing", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["西側校舍"], "fidelityTier": "blockout", "campus": {"kind": "wing", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_wing_3.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-wing", "seamRefs": [], "detachableFragments": ["west-wing"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_west_wing_3);
  nodes["west-wing"] = node_west_wing_3;
  const mesh_west_wing_3Geometry = endpoint_west_wing_3
    ? new THREE.CylinderGeometry(endpoint_west_wing_3.endRadius, endpoint_west_wing_3.baseRadius, endpoint_west_wing_3.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_wing_3) {
    mesh_west_wing_3Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_wing_3 = new THREE.Mesh(
    mesh_west_wing_3Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_wing_3.name = "\u897f\u5074\u6821\u820d";
  if (endpoint_west_wing_3) {
    mesh_west_wing_3.position.copy(endpoint_west_wing_3.midpoint);
    mesh_west_wing_3.quaternion.copy(endpoint_west_wing_3.quaternion);
  }
  mesh_west_wing_3.castShadow = options.castShadow ?? true;
  mesh_west_wing_3.receiveShadow = options.receiveShadow ?? true;
  mesh_west_wing_3.userData.sculptComponent = {"id": "west-wing", "name": "西側校舍", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "wing", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 6.7, "depth": 5.2}, "transform": {"position": [-5.4, 3.75, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-wing", "seamRefs": [], "detachableFragments": ["west-wing"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-wing-shape", "type": "raised ridge", "placement": [-6.4, 4.4, -1.3], "size": [6.6, 7.7, 5.2], "geometryEffect": "wing", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["西側校舍"], "fidelityTier": "blockout", "campus": {"kind": "wing", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_wing_3.add(mesh_west_wing_3);
  meshes["west-wing"] = mesh_west_wing_3;
  colliders["west-wing"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-wing"] ??= [];
  destructionGroups["west-wing"].push(node_west_wing_3);
  const socket_west_wing_assembly_origin_0 = new THREE.Object3D();
  socket_west_wing_assembly_origin_0.name = "assembly-origin";
  socket_west_wing_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_wing_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_wing_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_wing_3.add(socket_west_wing_assembly_origin_0);
  sockets["west-wing:assembly-origin"] = socket_west_wing_assembly_origin_0;

  const endpoint_east_wing_4 = makeAttachmentEndpoint(null);
  const node_east_wing_4 = new THREE.Group();
  node_east_wing_4.name = "\u6771\u5074\u6821\u820d__pivot";
  node_east_wing_4.scale.set(1, 1, 1);
  if (endpoint_east_wing_4) {
    node_east_wing_4.position.copy(endpoint_east_wing_4.start);
    node_east_wing_4.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_wing_4.position.set(7.4, 3.75, -1.3);
    node_east_wing_4.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_wing_4.userData.sculptComponent = {"id": "east-wing", "name": "東側校舍", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "wing", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 6.7, "depth": 5.2}, "transform": {"position": [7.4, 3.75, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-wing", "seamRefs": [], "detachableFragments": ["east-wing"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-wing-shape", "type": "raised ridge", "placement": [6.4, 4.4, -1.3], "size": [6.6, 7.7, 5.2], "geometryEffect": "wing", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["東側校舍"], "fidelityTier": "blockout", "campus": {"kind": "wing", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_wing_4.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-wing", "seamRefs": [], "detachableFragments": ["east-wing"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_east_wing_4);
  nodes["east-wing"] = node_east_wing_4;
  const mesh_east_wing_4Geometry = endpoint_east_wing_4
    ? new THREE.CylinderGeometry(endpoint_east_wing_4.endRadius, endpoint_east_wing_4.baseRadius, endpoint_east_wing_4.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_wing_4) {
    mesh_east_wing_4Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_wing_4 = new THREE.Mesh(
    mesh_east_wing_4Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_wing_4.name = "\u6771\u5074\u6821\u820d";
  if (endpoint_east_wing_4) {
    mesh_east_wing_4.position.copy(endpoint_east_wing_4.midpoint);
    mesh_east_wing_4.quaternion.copy(endpoint_east_wing_4.quaternion);
  }
  mesh_east_wing_4.castShadow = options.castShadow ?? true;
  mesh_east_wing_4.receiveShadow = options.receiveShadow ?? true;
  mesh_east_wing_4.userData.sculptComponent = {"id": "east-wing", "name": "東側校舍", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "wing", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 6.7, "depth": 5.2}, "transform": {"position": [7.4, 3.75, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-wing", "seamRefs": [], "detachableFragments": ["east-wing"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-wing-shape", "type": "raised ridge", "placement": [6.4, 4.4, -1.3], "size": [6.6, 7.7, 5.2], "geometryEffect": "wing", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["東側校舍"], "fidelityTier": "blockout", "campus": {"kind": "wing", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_wing_4.add(mesh_east_wing_4);
  meshes["east-wing"] = mesh_east_wing_4;
  colliders["east-wing"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 7.7, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-wing"] ??= [];
  destructionGroups["east-wing"].push(node_east_wing_4);
  const socket_east_wing_assembly_origin_0 = new THREE.Object3D();
  socket_east_wing_assembly_origin_0.name = "assembly-origin";
  socket_east_wing_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_wing_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_wing_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_wing_4.add(socket_east_wing_assembly_origin_0);
  sockets["east-wing:assembly-origin"] = socket_east_wing_assembly_origin_0;

  const endpoint_central_block_5 = makeAttachmentEndpoint(null);
  const node_central_block_5 = new THREE.Group();
  node_central_block_5.name = "\u4e2d\u592e\u6821\u820d__pivot";
  node_central_block_5.scale.set(1, 1, 1);
  if (endpoint_central_block_5) {
    node_central_block_5.position.copy(endpoint_central_block_5.start);
    node_central_block_5.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_central_block_5.position.set(1.0, 4.55, -1.7);
    node_central_block_5.rotation.set(0.0, 0.0, 0.0);
  }
  node_central_block_5.userData.sculptComponent = {"id": "central-block", "name": "中央校舍", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "wing", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.4, "height": 8.3, "depth": 5.2}, "transform": {"position": [1.0, 4.55, -1.7], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.4, 8.3, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-block", "seamRefs": [], "detachableFragments": ["central-block"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-block-shape", "type": "raised ridge", "placement": [0, 4.7, -1.7], "size": [6.4, 8.3, 5.2], "geometryEffect": "wing", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央校舍"], "fidelityTier": "blockout", "campus": {"kind": "wing", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_block_5.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.4, 8.3, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-block", "seamRefs": [], "detachableFragments": ["central-block"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_central_block_5);
  nodes["central-block"] = node_central_block_5;
  const mesh_central_block_5Geometry = endpoint_central_block_5
    ? new THREE.CylinderGeometry(endpoint_central_block_5.endRadius, endpoint_central_block_5.baseRadius, endpoint_central_block_5.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_central_block_5) {
    mesh_central_block_5Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_central_block_5 = new THREE.Mesh(
    mesh_central_block_5Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_central_block_5.name = "\u4e2d\u592e\u6821\u820d";
  if (endpoint_central_block_5) {
    mesh_central_block_5.position.copy(endpoint_central_block_5.midpoint);
    mesh_central_block_5.quaternion.copy(endpoint_central_block_5.quaternion);
  }
  mesh_central_block_5.castShadow = options.castShadow ?? true;
  mesh_central_block_5.receiveShadow = options.receiveShadow ?? true;
  mesh_central_block_5.userData.sculptComponent = {"id": "central-block", "name": "中央校舍", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "wing", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.4, "height": 8.3, "depth": 5.2}, "transform": {"position": [1.0, 4.55, -1.7], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.4, 8.3, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-block", "seamRefs": [], "detachableFragments": ["central-block"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-block-shape", "type": "raised ridge", "placement": [0, 4.7, -1.7], "size": [6.4, 8.3, 5.2], "geometryEffect": "wing", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央校舍"], "fidelityTier": "blockout", "campus": {"kind": "wing", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_block_5.add(mesh_central_block_5);
  meshes["central-block"] = mesh_central_block_5;
  colliders["central-block"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.4, 8.3, 5.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["central-block"] ??= [];
  destructionGroups["central-block"].push(node_central_block_5);
  const socket_central_block_assembly_origin_0 = new THREE.Object3D();
  socket_central_block_assembly_origin_0.name = "assembly-origin";
  socket_central_block_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_central_block_assembly_origin_0.rotation.set(0, 0, 0);
  socket_central_block_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_central_block_5.add(socket_central_block_assembly_origin_0);
  sockets["central-block:assembly-origin"] = socket_central_block_assembly_origin_0;

  const endpoint_tower_6 = makeAttachmentEndpoint(null);
  const node_tower_6 = new THREE.Group();
  node_tower_6.name = "\u9418\u6a13\u5854\u8eab__pivot";
  node_tower_6.scale.set(1, 1, 1);
  if (endpoint_tower_6) {
    node_tower_6.position.copy(endpoint_tower_6.start);
    node_tower_6.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_tower_6.position.set(1.0, 9.35, -0.35);
    node_tower_6.rotation.set(0.0, 0.0, 0.0);
  }
  node_tower_6.userData.sculptComponent = {"id": "tower", "name": "鐘樓塔身", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "tower", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 2.6, "height": 7.6, "depth": 2.75}, "transform": {"position": [1.0, 9.35, -0.35], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.6, 7.6, 2.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower", "seamRefs": [], "detachableFragments": ["tower"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-shape", "type": "raised ridge", "placement": [0, 9.5, -0.35], "size": [2.6, 7.6, 2.75], "geometryEffect": "tower", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓塔身"], "fidelityTier": "blockout", "campus": {"kind": "tower", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_6.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.6, 7.6, 2.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower", "seamRefs": [], "detachableFragments": ["tower"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_tower_6);
  nodes["tower"] = node_tower_6;
  const mesh_tower_6Geometry = endpoint_tower_6
    ? new THREE.CylinderGeometry(endpoint_tower_6.endRadius, endpoint_tower_6.baseRadius, endpoint_tower_6.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_tower_6) {
    mesh_tower_6Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_tower_6 = new THREE.Mesh(
    mesh_tower_6Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_tower_6.name = "\u9418\u6a13\u5854\u8eab";
  if (endpoint_tower_6) {
    mesh_tower_6.position.copy(endpoint_tower_6.midpoint);
    mesh_tower_6.quaternion.copy(endpoint_tower_6.quaternion);
  }
  mesh_tower_6.castShadow = options.castShadow ?? true;
  mesh_tower_6.receiveShadow = options.receiveShadow ?? true;
  mesh_tower_6.userData.sculptComponent = {"id": "tower", "name": "鐘樓塔身", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "tower", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 2.6, "height": 7.6, "depth": 2.75}, "transform": {"position": [1.0, 9.35, -0.35], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.6, 7.6, 2.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower", "seamRefs": [], "detachableFragments": ["tower"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-shape", "type": "raised ridge", "placement": [0, 9.5, -0.35], "size": [2.6, 7.6, 2.75], "geometryEffect": "tower", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓塔身"], "fidelityTier": "blockout", "campus": {"kind": "tower", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_6.add(mesh_tower_6);
  meshes["tower"] = mesh_tower_6;
  colliders["tower"] = {"type": "box", "offset": [0, 0, 0], "scale": [2.6, 7.6, 2.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["tower"] ??= [];
  destructionGroups["tower"].push(node_tower_6);
  const socket_tower_assembly_origin_0 = new THREE.Object3D();
  socket_tower_assembly_origin_0.name = "assembly-origin";
  socket_tower_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_tower_assembly_origin_0.rotation.set(0, 0, 0);
  socket_tower_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_tower_6.add(socket_tower_assembly_origin_0);
  sockets["tower:assembly-origin"] = socket_tower_assembly_origin_0;

  const endpoint_tower_roof_7 = makeAttachmentEndpoint(null);
  const node_tower_roof_7 = new THREE.Group();
  node_tower_roof_7.name = "\u9418\u6a13\u5c16\u9802__pivot";
  node_tower_roof_7.scale.set(1, 1, 1);
  if (endpoint_tower_roof_7) {
    node_tower_roof_7.position.copy(endpoint_tower_roof_7.start);
    node_tower_roof_7.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_tower_roof_7.position.set(1.0, 13.17, -0.35);
    node_tower_roof_7.rotation.set(0.0, 0.0, 0.0);
  }
  node_tower_roof_7.userData.sculptComponent = {"id": "tower-roof", "name": "鐘樓尖頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.3, "height": 1.42, "depth": 3.4}, "transform": {"position": [1.0, 13.17, -0.35], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.3, 1.42, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-roof", "seamRefs": [], "detachableFragments": ["tower-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-roof-shape", "type": "raised ridge", "placement": [0, 13.32, -0.35], "size": [3.3, 1.42, 3.4], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓尖頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.015}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_roof_7.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.3, 1.42, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-roof", "seamRefs": [], "detachableFragments": ["tower-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_tower_roof_7);
  nodes["tower-roof"] = node_tower_roof_7;
  const mesh_tower_roof_7Geometry = endpoint_tower_roof_7
    ? new THREE.CylinderGeometry(endpoint_tower_roof_7.endRadius, endpoint_tower_roof_7.baseRadius, endpoint_tower_roof_7.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_tower_roof_7) {
    mesh_tower_roof_7Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_tower_roof_7 = new THREE.Mesh(
    mesh_tower_roof_7Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_tower_roof_7.name = "\u9418\u6a13\u5c16\u9802";
  if (endpoint_tower_roof_7) {
    mesh_tower_roof_7.position.copy(endpoint_tower_roof_7.midpoint);
    mesh_tower_roof_7.quaternion.copy(endpoint_tower_roof_7.quaternion);
  }
  mesh_tower_roof_7.castShadow = options.castShadow ?? true;
  mesh_tower_roof_7.receiveShadow = options.receiveShadow ?? true;
  mesh_tower_roof_7.userData.sculptComponent = {"id": "tower-roof", "name": "鐘樓尖頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.3, "height": 1.42, "depth": 3.4}, "transform": {"position": [1.0, 13.17, -0.35], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.3, 1.42, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-roof", "seamRefs": [], "detachableFragments": ["tower-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-roof-shape", "type": "raised ridge", "placement": [0, 13.32, -0.35], "size": [3.3, 1.42, 3.4], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓尖頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.015}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_roof_7.add(mesh_tower_roof_7);
  meshes["tower-roof"] = mesh_tower_roof_7;
  colliders["tower-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.3, 1.42, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["tower-roof"] ??= [];
  destructionGroups["tower-roof"].push(node_tower_roof_7);
  const socket_tower_roof_assembly_origin_0 = new THREE.Object3D();
  socket_tower_roof_assembly_origin_0.name = "assembly-origin";
  socket_tower_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_tower_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_tower_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_tower_roof_7.add(socket_tower_roof_assembly_origin_0);
  sockets["tower-roof:assembly-origin"] = socket_tower_roof_assembly_origin_0;

  const endpoint_west_roof_8 = makeAttachmentEndpoint(null);
  const node_west_roof_8 = new THREE.Group();
  node_west_roof_8.name = "\u5074\u7ffc\u7d05\u74e6\u5c4b\u9802__pivot";
  node_west_roof_8.scale.set(1, 1, 1);
  if (endpoint_west_roof_8) {
    node_west_roof_8.position.copy(endpoint_west_roof_8.start);
    node_west_roof_8.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_roof_8.position.set(-5.4, 7.119999999999999, -1.3);
    node_west_roof_8.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_roof_8.userData.sculptComponent = {"id": "west-roof", "name": "側翼紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.1, "height": 1.65, "depth": 5.7}, "transform": {"position": [-5.4, 7.119999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-roof", "seamRefs": [], "detachableFragments": ["west-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-roof-shape", "type": "raised ridge", "placement": [-6.4, 8.27, -1.3], "size": [7.1, 1.65, 5.7], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.65}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_roof_8.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-roof", "seamRefs": [], "detachableFragments": ["west-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_west_roof_8);
  nodes["west-roof"] = node_west_roof_8;
  const mesh_west_roof_8Geometry = endpoint_west_roof_8
    ? new THREE.CylinderGeometry(endpoint_west_roof_8.endRadius, endpoint_west_roof_8.baseRadius, endpoint_west_roof_8.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_roof_8) {
    mesh_west_roof_8Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_roof_8 = new THREE.Mesh(
    mesh_west_roof_8Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_roof_8.name = "\u5074\u7ffc\u7d05\u74e6\u5c4b\u9802";
  if (endpoint_west_roof_8) {
    mesh_west_roof_8.position.copy(endpoint_west_roof_8.midpoint);
    mesh_west_roof_8.quaternion.copy(endpoint_west_roof_8.quaternion);
  }
  mesh_west_roof_8.castShadow = options.castShadow ?? true;
  mesh_west_roof_8.receiveShadow = options.receiveShadow ?? true;
  mesh_west_roof_8.userData.sculptComponent = {"id": "west-roof", "name": "側翼紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.1, "height": 1.65, "depth": 5.7}, "transform": {"position": [-5.4, 7.119999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-roof", "seamRefs": [], "detachableFragments": ["west-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-roof-shape", "type": "raised ridge", "placement": [-6.4, 8.27, -1.3], "size": [7.1, 1.65, 5.7], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.65}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_roof_8.add(mesh_west_roof_8);
  meshes["west-roof"] = mesh_west_roof_8;
  colliders["west-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-roof"] ??= [];
  destructionGroups["west-roof"].push(node_west_roof_8);
  const socket_west_roof_assembly_origin_0 = new THREE.Object3D();
  socket_west_roof_assembly_origin_0.name = "assembly-origin";
  socket_west_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_roof_8.add(socket_west_roof_assembly_origin_0);
  sockets["west-roof:assembly-origin"] = socket_west_roof_assembly_origin_0;

  const endpoint_east_roof_9 = makeAttachmentEndpoint(null);
  const node_east_roof_9 = new THREE.Group();
  node_east_roof_9.name = "\u5074\u7ffc\u7d05\u74e6\u5c4b\u9802__pivot";
  node_east_roof_9.scale.set(1, 1, 1);
  if (endpoint_east_roof_9) {
    node_east_roof_9.position.copy(endpoint_east_roof_9.start);
    node_east_roof_9.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_roof_9.position.set(7.4, 7.119999999999999, -1.3);
    node_east_roof_9.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_roof_9.userData.sculptComponent = {"id": "east-roof", "name": "側翼紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.1, "height": 1.65, "depth": 5.7}, "transform": {"position": [7.4, 7.119999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-roof", "seamRefs": [], "detachableFragments": ["east-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-roof-shape", "type": "raised ridge", "placement": [6.4, 8.27, -1.3], "size": [7.1, 1.65, 5.7], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.65}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_roof_9.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-roof", "seamRefs": [], "detachableFragments": ["east-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_east_roof_9);
  nodes["east-roof"] = node_east_roof_9;
  const mesh_east_roof_9Geometry = endpoint_east_roof_9
    ? new THREE.CylinderGeometry(endpoint_east_roof_9.endRadius, endpoint_east_roof_9.baseRadius, endpoint_east_roof_9.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_roof_9) {
    mesh_east_roof_9Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_roof_9 = new THREE.Mesh(
    mesh_east_roof_9Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_roof_9.name = "\u5074\u7ffc\u7d05\u74e6\u5c4b\u9802";
  if (endpoint_east_roof_9) {
    mesh_east_roof_9.position.copy(endpoint_east_roof_9.midpoint);
    mesh_east_roof_9.quaternion.copy(endpoint_east_roof_9.quaternion);
  }
  mesh_east_roof_9.castShadow = options.castShadow ?? true;
  mesh_east_roof_9.receiveShadow = options.receiveShadow ?? true;
  mesh_east_roof_9.userData.sculptComponent = {"id": "east-roof", "name": "側翼紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.1, "height": 1.65, "depth": 5.7}, "transform": {"position": [7.4, 7.119999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-roof", "seamRefs": [], "detachableFragments": ["east-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-roof-shape", "type": "raised ridge", "placement": [6.4, 8.27, -1.3], "size": [7.1, 1.65, 5.7], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.65}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_roof_9.add(mesh_east_roof_9);
  meshes["east-roof"] = mesh_east_roof_9;
  colliders["east-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [7.1, 1.65, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-roof"] ??= [];
  destructionGroups["east-roof"].push(node_east_roof_9);
  const socket_east_roof_assembly_origin_0 = new THREE.Object3D();
  socket_east_roof_assembly_origin_0.name = "assembly-origin";
  socket_east_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_roof_9.add(socket_east_roof_assembly_origin_0);
  sockets["east-roof:assembly-origin"] = socket_east_roof_assembly_origin_0;

  const endpoint_central_roof_10 = makeAttachmentEndpoint(null);
  const node_central_roof_10 = new THREE.Group();
  node_central_roof_10.name = "\u4e2d\u592e\u7d05\u74e6\u5c4b\u9802__pivot";
  node_central_roof_10.scale.set(1, 1, 1);
  if (endpoint_central_roof_10) {
    node_central_roof_10.position.copy(endpoint_central_roof_10.start);
    node_central_roof_10.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_central_roof_10.position.set(1.0, 8.73, -1.7);
    node_central_roof_10.rotation.set(0.0, 0.0, 0.0);
  }
  node_central_roof_10.userData.sculptComponent = {"id": "central-roof", "name": "中央紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.0, "height": 1.7, "depth": 5.7}, "transform": {"position": [1.0, 8.73, -1.7], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 1.7, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-roof", "seamRefs": [], "detachableFragments": ["central-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-roof-shape", "type": "raised ridge", "placement": [0, 8.88, -1.7], "size": [7.0, 1.7, 5.7], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.6}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_roof_10.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 1.7, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-roof", "seamRefs": [], "detachableFragments": ["central-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_central_roof_10);
  nodes["central-roof"] = node_central_roof_10;
  const mesh_central_roof_10Geometry = endpoint_central_roof_10
    ? new THREE.CylinderGeometry(endpoint_central_roof_10.endRadius, endpoint_central_roof_10.baseRadius, endpoint_central_roof_10.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_central_roof_10) {
    mesh_central_roof_10Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_central_roof_10 = new THREE.Mesh(
    mesh_central_roof_10Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_central_roof_10.name = "\u4e2d\u592e\u7d05\u74e6\u5c4b\u9802";
  if (endpoint_central_roof_10) {
    mesh_central_roof_10.position.copy(endpoint_central_roof_10.midpoint);
    mesh_central_roof_10.quaternion.copy(endpoint_central_roof_10.quaternion);
  }
  mesh_central_roof_10.castShadow = options.castShadow ?? true;
  mesh_central_roof_10.receiveShadow = options.receiveShadow ?? true;
  mesh_central_roof_10.userData.sculptComponent = {"id": "central-roof", "name": "中央紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.0, "height": 1.7, "depth": 5.7}, "transform": {"position": [1.0, 8.73, -1.7], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 1.7, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-roof", "seamRefs": [], "detachableFragments": ["central-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-roof-shape", "type": "raised ridge", "placement": [0, 8.88, -1.7], "size": [7.0, 1.7, 5.7], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.6}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_roof_10.add(mesh_central_roof_10);
  meshes["central-roof"] = mesh_central_roof_10;
  colliders["central-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 1.7, 5.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["central-roof"] ??= [];
  destructionGroups["central-roof"].push(node_central_roof_10);
  const socket_central_roof_assembly_origin_0 = new THREE.Object3D();
  socket_central_roof_assembly_origin_0.name = "assembly-origin";
  socket_central_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_central_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_central_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_central_roof_10.add(socket_central_roof_assembly_origin_0);
  sockets["central-roof:assembly-origin"] = socket_central_roof_assembly_origin_0;

  const endpoint_arcade_11 = makeAttachmentEndpoint(null);
  const node_arcade_11 = new THREE.Group();
  node_arcade_11.name = "\u5165\u53e3\u4e09\u62f1\u5eca__pivot";
  node_arcade_11.scale.set(1, 1, 1);
  if (endpoint_arcade_11) {
    node_arcade_11.position.copy(endpoint_arcade_11.start);
    node_arcade_11.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_arcade_11.position.set(1.0, 0.4, 3.1);
    node_arcade_11.rotation.set(0.0, 0.0, 0.0);
  }
  node_arcade_11.userData.sculptComponent = {"id": "arcade", "name": "入口三拱廊", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arcade", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 8.4, "height": 2.8, "depth": 2.6}, "transform": {"position": [1.0, 0.4, 3.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 2.8, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "arcade", "seamRefs": [], "detachableFragments": ["arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}}, "material": "brick", "materialLayers": ["brick"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arcade-shape", "type": "raised ridge", "placement": [0, 0.55, 3.1], "size": [8.4, 2.8, 2.6], "geometryEffect": "arcade", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["入口三拱廊"], "fidelityTier": "blockout", "campus": {"kind": "arcade", "stage": 0, "count": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(197, 107, 65, 1)", "secondaryAlbedo": "rgba(197, 107, 65, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_arcade_11.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 2.8, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "arcade", "seamRefs": [], "detachableFragments": ["arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}};
  (nodes["root"] ?? root).add(node_arcade_11);
  nodes["arcade"] = node_arcade_11;
  const mesh_arcade_11Geometry = endpoint_arcade_11
    ? new THREE.CylinderGeometry(endpoint_arcade_11.endRadius, endpoint_arcade_11.baseRadius, endpoint_arcade_11.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_arcade_11) {
    mesh_arcade_11Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_arcade_11 = new THREE.Mesh(
    mesh_arcade_11Geometry,
    materialMap["brick"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arcade_11.name = "\u5165\u53e3\u4e09\u62f1\u5eca";
  if (endpoint_arcade_11) {
    mesh_arcade_11.position.copy(endpoint_arcade_11.midpoint);
    mesh_arcade_11.quaternion.copy(endpoint_arcade_11.quaternion);
  }
  mesh_arcade_11.castShadow = options.castShadow ?? true;
  mesh_arcade_11.receiveShadow = options.receiveShadow ?? true;
  mesh_arcade_11.userData.sculptComponent = {"id": "arcade", "name": "入口三拱廊", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arcade", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 8.4, "height": 2.8, "depth": 2.6}, "transform": {"position": [1.0, 0.4, 3.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 2.8, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "arcade", "seamRefs": [], "detachableFragments": ["arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}}, "material": "brick", "materialLayers": ["brick"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arcade-shape", "type": "raised ridge", "placement": [0, 0.55, 3.1], "size": [8.4, 2.8, 2.6], "geometryEffect": "arcade", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["入口三拱廊"], "fidelityTier": "blockout", "campus": {"kind": "arcade", "stage": 0, "count": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(197, 107, 65, 1)", "secondaryAlbedo": "rgba(197, 107, 65, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_arcade_11.add(mesh_arcade_11);
  meshes["arcade"] = mesh_arcade_11;
  colliders["arcade"] = {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 2.8, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["arcade"] ??= [];
  destructionGroups["arcade"].push(node_arcade_11);
  const socket_arcade_assembly_origin_0 = new THREE.Object3D();
  socket_arcade_assembly_origin_0.name = "assembly-origin";
  socket_arcade_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_arcade_assembly_origin_0.rotation.set(0, 0, 0);
  socket_arcade_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_arcade_11.add(socket_arcade_assembly_origin_0);
  sockets["arcade:assembly-origin"] = socket_arcade_assembly_origin_0;

  const endpoint_arcade_roof_12 = makeAttachmentEndpoint(null);
  const node_arcade_roof_12 = new THREE.Group();
  node_arcade_roof_12.name = "\u5165\u53e3\u4f4e\u7d05\u74e6\u5c4b\u9802__pivot";
  node_arcade_roof_12.scale.set(1, 1, 1);
  if (endpoint_arcade_roof_12) {
    node_arcade_roof_12.position.copy(endpoint_arcade_roof_12.start);
    node_arcade_roof_12.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_arcade_roof_12.position.set(1.0, 3.19, 3.0);
    node_arcade_roof_12.rotation.set(0.0, 0.0, 0.0);
  }
  node_arcade_roof_12.userData.sculptComponent = {"id": "arcade-roof", "name": "入口低紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 9.0, "height": 1.25, "depth": 3.35}, "transform": {"position": [1.0, 3.19, 3.0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [9.0, 1.25, 3.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "arcade-roof", "seamRefs": [], "detachableFragments": ["arcade-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arcade-roof-shape", "type": "raised ridge", "placement": [0, 3.34, 3.0], "size": [9.0, 1.25, 3.35], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["入口低紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.69}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_arcade_roof_12.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [9.0, 1.25, 3.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "arcade-roof", "seamRefs": [], "detachableFragments": ["arcade-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_arcade_roof_12);
  nodes["arcade-roof"] = node_arcade_roof_12;
  const mesh_arcade_roof_12Geometry = endpoint_arcade_roof_12
    ? new THREE.CylinderGeometry(endpoint_arcade_roof_12.endRadius, endpoint_arcade_roof_12.baseRadius, endpoint_arcade_roof_12.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_arcade_roof_12) {
    mesh_arcade_roof_12Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_arcade_roof_12 = new THREE.Mesh(
    mesh_arcade_roof_12Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arcade_roof_12.name = "\u5165\u53e3\u4f4e\u7d05\u74e6\u5c4b\u9802";
  if (endpoint_arcade_roof_12) {
    mesh_arcade_roof_12.position.copy(endpoint_arcade_roof_12.midpoint);
    mesh_arcade_roof_12.quaternion.copy(endpoint_arcade_roof_12.quaternion);
  }
  mesh_arcade_roof_12.castShadow = options.castShadow ?? true;
  mesh_arcade_roof_12.receiveShadow = options.receiveShadow ?? true;
  mesh_arcade_roof_12.userData.sculptComponent = {"id": "arcade-roof", "name": "入口低紅瓦屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 9.0, "height": 1.25, "depth": 3.35}, "transform": {"position": [1.0, 3.19, 3.0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [9.0, 1.25, 3.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "arcade-roof", "seamRefs": [], "detachableFragments": ["arcade-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "arcade-roof-shape", "type": "raised ridge", "placement": [0, 3.34, 3.0], "size": [9.0, 1.25, 3.35], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["入口低紅瓦屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.69}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_arcade_roof_12.add(mesh_arcade_roof_12);
  meshes["arcade-roof"] = mesh_arcade_roof_12;
  colliders["arcade-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [9.0, 1.25, 3.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["arcade-roof"] ??= [];
  destructionGroups["arcade-roof"].push(node_arcade_roof_12);
  const socket_arcade_roof_assembly_origin_0 = new THREE.Object3D();
  socket_arcade_roof_assembly_origin_0.name = "assembly-origin";
  socket_arcade_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_arcade_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_arcade_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_arcade_roof_12.add(socket_arcade_roof_assembly_origin_0);
  sockets["arcade-roof:assembly-origin"] = socket_arcade_roof_assembly_origin_0;

  const endpoint_west_turret_13 = makeAttachmentEndpoint(null);
  const node_west_turret_13 = new THREE.Group();
  node_west_turret_13.name = "\u524d\u65b9\u77f3\u780c\u89d2\u5854__pivot";
  node_west_turret_13.scale.set(1, 1, 1);
  if (endpoint_west_turret_13) {
    node_west_turret_13.position.copy(endpoint_west_turret_13.start);
    node_west_turret_13.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_turret_13.position.set(-2.15, 5.949999999999999, 1.1);
    node_west_turret_13.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_turret_13.userData.sculptComponent = {"id": "west-turret", "name": "前方石砌角塔", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "turret", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.8, "height": 5.6, "depth": 1.75}, "transform": {"position": [-2.15, 5.949999999999999, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-turret", "seamRefs": [], "detachableFragments": ["west-turret"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-turret-shape", "type": "raised ridge", "placement": [-3.15, 5.8, 1.1], "size": [1.8, 5.0, 1.75], "geometryEffect": "turret", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["前方石砌角塔"], "fidelityTier": "blockout", "campus": {"kind": "turret", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_turret_13.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-turret", "seamRefs": [], "detachableFragments": ["west-turret"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_west_turret_13);
  nodes["west-turret"] = node_west_turret_13;
  const mesh_west_turret_13Geometry = endpoint_west_turret_13
    ? new THREE.CylinderGeometry(endpoint_west_turret_13.endRadius, endpoint_west_turret_13.baseRadius, endpoint_west_turret_13.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_turret_13) {
    mesh_west_turret_13Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_turret_13 = new THREE.Mesh(
    mesh_west_turret_13Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_turret_13.name = "\u524d\u65b9\u77f3\u780c\u89d2\u5854";
  if (endpoint_west_turret_13) {
    mesh_west_turret_13.position.copy(endpoint_west_turret_13.midpoint);
    mesh_west_turret_13.quaternion.copy(endpoint_west_turret_13.quaternion);
  }
  mesh_west_turret_13.castShadow = options.castShadow ?? true;
  mesh_west_turret_13.receiveShadow = options.receiveShadow ?? true;
  mesh_west_turret_13.userData.sculptComponent = {"id": "west-turret", "name": "前方石砌角塔", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "turret", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.8, "height": 5.6, "depth": 1.75}, "transform": {"position": [-2.15, 5.949999999999999, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-turret", "seamRefs": [], "detachableFragments": ["west-turret"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-turret-shape", "type": "raised ridge", "placement": [-3.15, 5.8, 1.1], "size": [1.8, 5.0, 1.75], "geometryEffect": "turret", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["前方石砌角塔"], "fidelityTier": "blockout", "campus": {"kind": "turret", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_turret_13.add(mesh_west_turret_13);
  meshes["west-turret"] = mesh_west_turret_13;
  colliders["west-turret"] = {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-turret"] ??= [];
  destructionGroups["west-turret"].push(node_west_turret_13);
  const socket_west_turret_assembly_origin_0 = new THREE.Object3D();
  socket_west_turret_assembly_origin_0.name = "assembly-origin";
  socket_west_turret_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_turret_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_turret_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_turret_13.add(socket_west_turret_assembly_origin_0);
  sockets["west-turret:assembly-origin"] = socket_west_turret_assembly_origin_0;

  const endpoint_west_turret_roof_14 = makeAttachmentEndpoint(null);
  const node_west_turret_roof_14 = new THREE.Group();
  node_west_turret_roof_14.name = "\u89d2\u5854\u56db\u5761\u5c4b\u9802__pivot";
  node_west_turret_roof_14.scale.set(1, 1, 1);
  if (endpoint_west_turret_roof_14) {
    node_west_turret_roof_14.position.copy(endpoint_west_turret_roof_14.start);
    node_west_turret_roof_14.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_turret_roof_14.position.set(-2.15, 8.78, 1.1);
    node_west_turret_roof_14.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_turret_roof_14.userData.sculptComponent = {"id": "west-turret-roof", "name": "角塔四坡屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 2.15, "height": 1.5, "depth": 2.15}, "transform": {"position": [-2.15, 8.78, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-turret-roof", "seamRefs": [], "detachableFragments": ["west-turret-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-turret-roof-shape", "type": "raised ridge", "placement": [-3.15, 8.33, 1.1], "size": [2.15, 1.5, 2.15], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["角塔四坡屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.43}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_turret_roof_14.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-turret-roof", "seamRefs": [], "detachableFragments": ["west-turret-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_west_turret_roof_14);
  nodes["west-turret-roof"] = node_west_turret_roof_14;
  const mesh_west_turret_roof_14Geometry = endpoint_west_turret_roof_14
    ? new THREE.CylinderGeometry(endpoint_west_turret_roof_14.endRadius, endpoint_west_turret_roof_14.baseRadius, endpoint_west_turret_roof_14.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_turret_roof_14) {
    mesh_west_turret_roof_14Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_turret_roof_14 = new THREE.Mesh(
    mesh_west_turret_roof_14Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_turret_roof_14.name = "\u89d2\u5854\u56db\u5761\u5c4b\u9802";
  if (endpoint_west_turret_roof_14) {
    mesh_west_turret_roof_14.position.copy(endpoint_west_turret_roof_14.midpoint);
    mesh_west_turret_roof_14.quaternion.copy(endpoint_west_turret_roof_14.quaternion);
  }
  mesh_west_turret_roof_14.castShadow = options.castShadow ?? true;
  mesh_west_turret_roof_14.receiveShadow = options.receiveShadow ?? true;
  mesh_west_turret_roof_14.userData.sculptComponent = {"id": "west-turret-roof", "name": "角塔四坡屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 2.15, "height": 1.5, "depth": 2.15}, "transform": {"position": [-2.15, 8.78, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-turret-roof", "seamRefs": [], "detachableFragments": ["west-turret-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-turret-roof-shape", "type": "raised ridge", "placement": [-3.15, 8.33, 1.1], "size": [2.15, 1.5, 2.15], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["角塔四坡屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.43}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_turret_roof_14.add(mesh_west_turret_roof_14);
  meshes["west-turret-roof"] = mesh_west_turret_roof_14;
  colliders["west-turret-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-turret-roof"] ??= [];
  destructionGroups["west-turret-roof"].push(node_west_turret_roof_14);
  const socket_west_turret_roof_assembly_origin_0 = new THREE.Object3D();
  socket_west_turret_roof_assembly_origin_0.name = "assembly-origin";
  socket_west_turret_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_turret_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_turret_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_turret_roof_14.add(socket_west_turret_roof_assembly_origin_0);
  sockets["west-turret-roof:assembly-origin"] = socket_west_turret_roof_assembly_origin_0;

  const endpoint_east_turret_15 = makeAttachmentEndpoint(null);
  const node_east_turret_15 = new THREE.Group();
  node_east_turret_15.name = "\u524d\u65b9\u77f3\u780c\u89d2\u5854__pivot";
  node_east_turret_15.scale.set(1, 1, 1);
  if (endpoint_east_turret_15) {
    node_east_turret_15.position.copy(endpoint_east_turret_15.start);
    node_east_turret_15.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_turret_15.position.set(4.15, 5.949999999999999, 1.1);
    node_east_turret_15.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_turret_15.userData.sculptComponent = {"id": "east-turret", "name": "前方石砌角塔", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "turret", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.8, "height": 5.6, "depth": 1.75}, "transform": {"position": [4.15, 5.949999999999999, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-turret", "seamRefs": [], "detachableFragments": ["east-turret"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-turret-shape", "type": "raised ridge", "placement": [3.15, 5.8, 1.1], "size": [1.8, 5.0, 1.75], "geometryEffect": "turret", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["前方石砌角塔"], "fidelityTier": "blockout", "campus": {"kind": "turret", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_turret_15.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-turret", "seamRefs": [], "detachableFragments": ["east-turret"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_east_turret_15);
  nodes["east-turret"] = node_east_turret_15;
  const mesh_east_turret_15Geometry = endpoint_east_turret_15
    ? new THREE.CylinderGeometry(endpoint_east_turret_15.endRadius, endpoint_east_turret_15.baseRadius, endpoint_east_turret_15.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_turret_15) {
    mesh_east_turret_15Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_turret_15 = new THREE.Mesh(
    mesh_east_turret_15Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_turret_15.name = "\u524d\u65b9\u77f3\u780c\u89d2\u5854";
  if (endpoint_east_turret_15) {
    mesh_east_turret_15.position.copy(endpoint_east_turret_15.midpoint);
    mesh_east_turret_15.quaternion.copy(endpoint_east_turret_15.quaternion);
  }
  mesh_east_turret_15.castShadow = options.castShadow ?? true;
  mesh_east_turret_15.receiveShadow = options.receiveShadow ?? true;
  mesh_east_turret_15.userData.sculptComponent = {"id": "east-turret", "name": "前方石砌角塔", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "turret", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.8, "height": 5.6, "depth": 1.75}, "transform": {"position": [4.15, 5.949999999999999, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-turret", "seamRefs": [], "detachableFragments": ["east-turret"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-turret-shape", "type": "raised ridge", "placement": [3.15, 5.8, 1.1], "size": [1.8, 5.0, 1.75], "geometryEffect": "turret", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["前方石砌角塔"], "fidelityTier": "blockout", "campus": {"kind": "turret", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_turret_15.add(mesh_east_turret_15);
  meshes["east-turret"] = mesh_east_turret_15;
  colliders["east-turret"] = {"type": "box", "offset": [0, 0, 0], "scale": [1.8, 5.0, 1.75], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-turret"] ??= [];
  destructionGroups["east-turret"].push(node_east_turret_15);
  const socket_east_turret_assembly_origin_0 = new THREE.Object3D();
  socket_east_turret_assembly_origin_0.name = "assembly-origin";
  socket_east_turret_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_turret_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_turret_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_turret_15.add(socket_east_turret_assembly_origin_0);
  sockets["east-turret:assembly-origin"] = socket_east_turret_assembly_origin_0;

  const endpoint_east_turret_roof_16 = makeAttachmentEndpoint(null);
  const node_east_turret_roof_16 = new THREE.Group();
  node_east_turret_roof_16.name = "\u89d2\u5854\u56db\u5761\u5c4b\u9802__pivot";
  node_east_turret_roof_16.scale.set(1, 1, 1);
  if (endpoint_east_turret_roof_16) {
    node_east_turret_roof_16.position.copy(endpoint_east_turret_roof_16.start);
    node_east_turret_roof_16.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_turret_roof_16.position.set(4.15, 8.78, 1.1);
    node_east_turret_roof_16.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_turret_roof_16.userData.sculptComponent = {"id": "east-turret-roof", "name": "角塔四坡屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 2.15, "height": 1.5, "depth": 2.15}, "transform": {"position": [4.15, 8.78, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-turret-roof", "seamRefs": [], "detachableFragments": ["east-turret-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-turret-roof-shape", "type": "raised ridge", "placement": [3.15, 8.33, 1.1], "size": [2.15, 1.5, 2.15], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["角塔四坡屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.43}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_turret_roof_16.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-turret-roof", "seamRefs": [], "detachableFragments": ["east-turret-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}};
  (nodes["root"] ?? root).add(node_east_turret_roof_16);
  nodes["east-turret-roof"] = node_east_turret_roof_16;
  const mesh_east_turret_roof_16Geometry = endpoint_east_turret_roof_16
    ? new THREE.CylinderGeometry(endpoint_east_turret_roof_16.endRadius, endpoint_east_turret_roof_16.baseRadius, endpoint_east_turret_roof_16.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_turret_roof_16) {
    mesh_east_turret_roof_16Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_turret_roof_16 = new THREE.Mesh(
    mesh_east_turret_roof_16Geometry,
    materialMap["roof"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_turret_roof_16.name = "\u89d2\u5854\u56db\u5761\u5c4b\u9802";
  if (endpoint_east_turret_roof_16) {
    mesh_east_turret_roof_16.position.copy(endpoint_east_turret_roof_16.midpoint);
    mesh_east_turret_roof_16.quaternion.copy(endpoint_east_turret_roof_16.quaternion);
  }
  mesh_east_turret_roof_16.castShadow = options.castShadow ?? true;
  mesh_east_turret_roof_16.receiveShadow = options.receiveShadow ?? true;
  mesh_east_turret_roof_16.userData.sculptComponent = {"id": "east-turret-roof", "name": "角塔四坡屋頂", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hip", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 2.15, "height": 1.5, "depth": 2.15}, "transform": {"position": [4.15, 8.78, 1.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-turret-roof", "seamRefs": [], "detachableFragments": ["east-turret-roof"], "breakImpulse": 0.0, "debrisMaterial": "roof"}}, "material": "roof", "materialLayers": ["roof"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-turret-roof-shape", "type": "raised ridge", "placement": [3.15, 8.33, 1.1], "size": [2.15, 1.5, 2.15], "geometryEffect": "hip", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["角塔四坡屋頂"], "fidelityTier": "blockout", "campus": {"kind": "hip", "stage": 0, "topRatio": 0.43}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(184, 124, 99, 1)", "secondaryAlbedo": "rgba(184, 124, 99, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_turret_roof_16.add(mesh_east_turret_roof_16);
  meshes["east-turret-roof"] = mesh_east_turret_roof_16;
  colliders["east-turret-roof"] = {"type": "box", "offset": [0, 0, 0], "scale": [2.15, 1.5, 2.15], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-turret-roof"] ??= [];
  destructionGroups["east-turret-roof"].push(node_east_turret_roof_16);
  const socket_east_turret_roof_assembly_origin_0 = new THREE.Object3D();
  socket_east_turret_roof_assembly_origin_0.name = "assembly-origin";
  socket_east_turret_roof_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_turret_roof_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_turret_roof_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_turret_roof_16.add(socket_east_turret_roof_assembly_origin_0);
  sockets["east-turret-roof:assembly-origin"] = socket_east_turret_roof_assembly_origin_0;

  const endpoint_west_arcade_17 = makeAttachmentEndpoint(null);
  const node_west_arcade_17 = new THREE.Group();
  node_west_arcade_17.name = "\u5074\u7ffc\u78da\u62f1\u7a97__pivot";
  node_west_arcade_17.scale.set(1, 1, 1);
  if (endpoint_west_arcade_17) {
    node_west_arcade_17.position.copy(endpoint_west_arcade_17.start);
    node_west_arcade_17.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_arcade_17.position.set(-5.4, 0.4, 1.46);
    node_west_arcade_17.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_arcade_17.userData.sculptComponent = {"id": "west-arcade", "name": "側翼磚拱窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arcade", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 2.35, "depth": 0.45}, "transform": {"position": [-5.4, 0.4, 1.46], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-arcade", "seamRefs": [], "detachableFragments": ["west-arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}}, "material": "brick", "materialLayers": ["brick"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-arcade-shape", "type": "raised ridge", "placement": [-6.4, 0.55, 1.46], "size": [6.6, 2.35, 0.45], "geometryEffect": "arcade", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼磚拱窗"], "fidelityTier": "structural-pass", "campus": {"kind": "arcade", "stage": 1, "count": 4, "glazed": true}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(197, 107, 65, 1)", "secondaryAlbedo": "rgba(197, 107, 65, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_arcade_17.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-arcade", "seamRefs": [], "detachableFragments": ["west-arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}};
  (nodes["root"] ?? root).add(node_west_arcade_17);
  nodes["west-arcade"] = node_west_arcade_17;
  const mesh_west_arcade_17Geometry = endpoint_west_arcade_17
    ? new THREE.CylinderGeometry(endpoint_west_arcade_17.endRadius, endpoint_west_arcade_17.baseRadius, endpoint_west_arcade_17.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_arcade_17) {
    mesh_west_arcade_17Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_arcade_17 = new THREE.Mesh(
    mesh_west_arcade_17Geometry,
    materialMap["brick"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_arcade_17.name = "\u5074\u7ffc\u78da\u62f1\u7a97";
  if (endpoint_west_arcade_17) {
    mesh_west_arcade_17.position.copy(endpoint_west_arcade_17.midpoint);
    mesh_west_arcade_17.quaternion.copy(endpoint_west_arcade_17.quaternion);
  }
  mesh_west_arcade_17.castShadow = options.castShadow ?? true;
  mesh_west_arcade_17.receiveShadow = options.receiveShadow ?? true;
  mesh_west_arcade_17.userData.sculptComponent = {"id": "west-arcade", "name": "側翼磚拱窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arcade", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 2.35, "depth": 0.45}, "transform": {"position": [-5.4, 0.4, 1.46], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-arcade", "seamRefs": [], "detachableFragments": ["west-arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}}, "material": "brick", "materialLayers": ["brick"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-arcade-shape", "type": "raised ridge", "placement": [-6.4, 0.55, 1.46], "size": [6.6, 2.35, 0.45], "geometryEffect": "arcade", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼磚拱窗"], "fidelityTier": "structural-pass", "campus": {"kind": "arcade", "stage": 1, "count": 4, "glazed": true}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(197, 107, 65, 1)", "secondaryAlbedo": "rgba(197, 107, 65, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_arcade_17.add(mesh_west_arcade_17);
  meshes["west-arcade"] = mesh_west_arcade_17;
  colliders["west-arcade"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-arcade"] ??= [];
  destructionGroups["west-arcade"].push(node_west_arcade_17);
  const socket_west_arcade_assembly_origin_0 = new THREE.Object3D();
  socket_west_arcade_assembly_origin_0.name = "assembly-origin";
  socket_west_arcade_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_arcade_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_arcade_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_arcade_17.add(socket_west_arcade_assembly_origin_0);
  sockets["west-arcade:assembly-origin"] = socket_west_arcade_assembly_origin_0;

  const endpoint_west_windows_18 = makeAttachmentEndpoint(null);
  const node_west_windows_18 = new THREE.Group();
  node_west_windows_18.name = "\u4e09\u5c64\u85cd\u7070\u7a97\u683c__pivot";
  node_west_windows_18.scale.set(1, 1, 1);
  if (endpoint_west_windows_18) {
    node_west_windows_18.position.copy(endpoint_west_windows_18.start);
    node_west_windows_18.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_windows_18.position.set(-5.4, 2.88, 1.36);
    node_west_windows_18.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_windows_18.userData.sculptComponent = {"id": "west-windows", "name": "三層藍灰窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.15, "depth": 0.2}, "transform": {"position": [-5.4, 2.88, 1.36], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-windows", "seamRefs": [], "detachableFragments": ["west-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-windows-shape", "type": "raised ridge", "placement": [-6.4, 3.25, 1.36], "size": [6.6, 4.8, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["三層藍灰窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 5, "rows": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_windows_18.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-windows", "seamRefs": [], "detachableFragments": ["west-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_west_windows_18);
  nodes["west-windows"] = node_west_windows_18;
  const mesh_west_windows_18Geometry = endpoint_west_windows_18
    ? new THREE.CylinderGeometry(endpoint_west_windows_18.endRadius, endpoint_west_windows_18.baseRadius, endpoint_west_windows_18.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_windows_18) {
    mesh_west_windows_18Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_windows_18 = new THREE.Mesh(
    mesh_west_windows_18Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_windows_18.name = "\u4e09\u5c64\u85cd\u7070\u7a97\u683c";
  if (endpoint_west_windows_18) {
    mesh_west_windows_18.position.copy(endpoint_west_windows_18.midpoint);
    mesh_west_windows_18.quaternion.copy(endpoint_west_windows_18.quaternion);
  }
  mesh_west_windows_18.castShadow = options.castShadow ?? true;
  mesh_west_windows_18.receiveShadow = options.receiveShadow ?? true;
  mesh_west_windows_18.userData.sculptComponent = {"id": "west-windows", "name": "三層藍灰窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.15, "depth": 0.2}, "transform": {"position": [-5.4, 2.88, 1.36], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-windows", "seamRefs": [], "detachableFragments": ["west-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-windows-shape", "type": "raised ridge", "placement": [-6.4, 3.25, 1.36], "size": [6.6, 4.8, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["三層藍灰窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 5, "rows": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_windows_18.add(mesh_west_windows_18);
  meshes["west-windows"] = mesh_west_windows_18;
  colliders["west-windows"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-windows"] ??= [];
  destructionGroups["west-windows"].push(node_west_windows_18);
  const socket_west_windows_assembly_origin_0 = new THREE.Object3D();
  socket_west_windows_assembly_origin_0.name = "assembly-origin";
  socket_west_windows_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_windows_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_windows_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_windows_18.add(socket_west_windows_assembly_origin_0);
  sockets["west-windows:assembly-origin"] = socket_west_windows_assembly_origin_0;

  const endpoint_west_piers_19 = makeAttachmentEndpoint(null);
  const node_west_piers_19 = new THREE.Group();
  node_west_piers_19.name = "\u77f3\u67f1\u8207\u8170\u7dda__pivot";
  node_west_piers_19.scale.set(1, 1, 1);
  if (endpoint_west_piers_19) {
    node_west_piers_19.position.copy(endpoint_west_piers_19.start);
    node_west_piers_19.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_piers_19.position.set(-5.4, 2.85, 1.42);
    node_west_piers_19.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_piers_19.userData.sculptComponent = {"id": "west-piers", "name": "石柱與腰線", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "piers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.25, "depth": 0.25}, "transform": {"position": [-5.4, 2.85, 1.42], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-piers", "seamRefs": [], "detachableFragments": ["west-piers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-piers-shape", "type": "raised ridge", "placement": [-6.4, 3.0, 1.42], "size": [6.6, 5.25, 0.25], "geometryEffect": "piers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["石柱與腰線"], "fidelityTier": "structural-pass", "campus": {"kind": "piers", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_piers_19.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-piers", "seamRefs": [], "detachableFragments": ["west-piers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_west_piers_19);
  nodes["west-piers"] = node_west_piers_19;
  const mesh_west_piers_19Geometry = endpoint_west_piers_19
    ? new THREE.CylinderGeometry(endpoint_west_piers_19.endRadius, endpoint_west_piers_19.baseRadius, endpoint_west_piers_19.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_piers_19) {
    mesh_west_piers_19Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_piers_19 = new THREE.Mesh(
    mesh_west_piers_19Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_piers_19.name = "\u77f3\u67f1\u8207\u8170\u7dda";
  if (endpoint_west_piers_19) {
    mesh_west_piers_19.position.copy(endpoint_west_piers_19.midpoint);
    mesh_west_piers_19.quaternion.copy(endpoint_west_piers_19.quaternion);
  }
  mesh_west_piers_19.castShadow = options.castShadow ?? true;
  mesh_west_piers_19.receiveShadow = options.receiveShadow ?? true;
  mesh_west_piers_19.userData.sculptComponent = {"id": "west-piers", "name": "石柱與腰線", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "piers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.25, "depth": 0.25}, "transform": {"position": [-5.4, 2.85, 1.42], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-piers", "seamRefs": [], "detachableFragments": ["west-piers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-piers-shape", "type": "raised ridge", "placement": [-6.4, 3.0, 1.42], "size": [6.6, 5.25, 0.25], "geometryEffect": "piers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["石柱與腰線"], "fidelityTier": "structural-pass", "campus": {"kind": "piers", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_piers_19.add(mesh_west_piers_19);
  meshes["west-piers"] = mesh_west_piers_19;
  colliders["west-piers"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-piers"] ??= [];
  destructionGroups["west-piers"].push(node_west_piers_19);
  const socket_west_piers_assembly_origin_0 = new THREE.Object3D();
  socket_west_piers_assembly_origin_0.name = "assembly-origin";
  socket_west_piers_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_piers_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_piers_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_piers_19.add(socket_west_piers_assembly_origin_0);
  sockets["west-piers:assembly-origin"] = socket_west_piers_assembly_origin_0;

  const endpoint_west_dormers_20 = makeAttachmentEndpoint(null);
  const node_west_dormers_20 = new THREE.Group();
  node_west_dormers_20.name = "\u96d9\u8001\u864e\u7a97__pivot";
  node_west_dormers_20.scale.set(1, 1, 1);
  if (endpoint_west_dormers_20) {
    node_west_dormers_20.position.copy(endpoint_west_dormers_20.start);
    node_west_dormers_20.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_dormers_20.position.set(-5.4, 7.569999999999999, 0.94);
    node_west_dormers_20.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_dormers_20.userData.sculptComponent = {"id": "west-dormers", "name": "雙老虎窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "dormers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 1.15, "depth": 1.0}, "transform": {"position": [-5.4, 7.569999999999999, 0.94], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-dormers", "seamRefs": [], "detachableFragments": ["west-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-dormers-shape", "type": "raised ridge", "placement": [-6.4, 8.72, 0.94], "size": [6.6, 1.15, 1.0], "geometryEffect": "dormers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["雙老虎窗"], "fidelityTier": "structural-pass", "campus": {"kind": "dormers", "stage": 1, "count": 2}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_dormers_20.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-dormers", "seamRefs": [], "detachableFragments": ["west-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_west_dormers_20);
  nodes["west-dormers"] = node_west_dormers_20;
  const mesh_west_dormers_20Geometry = endpoint_west_dormers_20
    ? new THREE.CylinderGeometry(endpoint_west_dormers_20.endRadius, endpoint_west_dormers_20.baseRadius, endpoint_west_dormers_20.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_dormers_20) {
    mesh_west_dormers_20Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_dormers_20 = new THREE.Mesh(
    mesh_west_dormers_20Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_dormers_20.name = "\u96d9\u8001\u864e\u7a97";
  if (endpoint_west_dormers_20) {
    mesh_west_dormers_20.position.copy(endpoint_west_dormers_20.midpoint);
    mesh_west_dormers_20.quaternion.copy(endpoint_west_dormers_20.quaternion);
  }
  mesh_west_dormers_20.castShadow = options.castShadow ?? true;
  mesh_west_dormers_20.receiveShadow = options.receiveShadow ?? true;
  mesh_west_dormers_20.userData.sculptComponent = {"id": "west-dormers", "name": "雙老虎窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "dormers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 1.15, "depth": 1.0}, "transform": {"position": [-5.4, 7.569999999999999, 0.94], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-dormers", "seamRefs": [], "detachableFragments": ["west-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-dormers-shape", "type": "raised ridge", "placement": [-6.4, 8.72, 0.94], "size": [6.6, 1.15, 1.0], "geometryEffect": "dormers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["雙老虎窗"], "fidelityTier": "structural-pass", "campus": {"kind": "dormers", "stage": 1, "count": 2}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_dormers_20.add(mesh_west_dormers_20);
  meshes["west-dormers"] = mesh_west_dormers_20;
  colliders["west-dormers"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-dormers"] ??= [];
  destructionGroups["west-dormers"].push(node_west_dormers_20);
  const socket_west_dormers_assembly_origin_0 = new THREE.Object3D();
  socket_west_dormers_assembly_origin_0.name = "assembly-origin";
  socket_west_dormers_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_dormers_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_dormers_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_dormers_20.add(socket_west_dormers_assembly_origin_0);
  sockets["west-dormers:assembly-origin"] = socket_west_dormers_assembly_origin_0;

  const endpoint_west_parapets_21 = makeAttachmentEndpoint(null);
  const node_west_parapets_21 = new THREE.Group();
  node_west_parapets_21.name = "\u5c4b\u9802\u5973\u5152\u7246__pivot";
  node_west_parapets_21.scale.set(1, 1, 1);
  if (endpoint_west_parapets_21) {
    node_west_parapets_21.position.copy(endpoint_west_parapets_21.start);
    node_west_parapets_21.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_parapets_21.position.set(-5.4, 8.709999999999999, -1.3);
    node_west_parapets_21.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_parapets_21.userData.sculptComponent = {"id": "west-parapets", "name": "屋頂女兒牆", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "parapet", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.6, "height": 0.38, "depth": 3.7}, "transform": {"position": [-5.4, 8.709999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-parapets", "seamRefs": [], "detachableFragments": ["west-parapets"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-parapets-shape", "type": "raised ridge", "placement": [-6.4, 9.86, -1.3], "size": [4.6, 0.38, 3.7], "geometryEffect": "parapet", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["屋頂女兒牆"], "fidelityTier": "structural-pass", "campus": {"kind": "parapet", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_parapets_21.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-parapets", "seamRefs": [], "detachableFragments": ["west-parapets"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_west_parapets_21);
  nodes["west-parapets"] = node_west_parapets_21;
  const mesh_west_parapets_21Geometry = endpoint_west_parapets_21
    ? new THREE.CylinderGeometry(endpoint_west_parapets_21.endRadius, endpoint_west_parapets_21.baseRadius, endpoint_west_parapets_21.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_parapets_21) {
    mesh_west_parapets_21Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_parapets_21 = new THREE.Mesh(
    mesh_west_parapets_21Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_parapets_21.name = "\u5c4b\u9802\u5973\u5152\u7246";
  if (endpoint_west_parapets_21) {
    mesh_west_parapets_21.position.copy(endpoint_west_parapets_21.midpoint);
    mesh_west_parapets_21.quaternion.copy(endpoint_west_parapets_21.quaternion);
  }
  mesh_west_parapets_21.castShadow = options.castShadow ?? true;
  mesh_west_parapets_21.receiveShadow = options.receiveShadow ?? true;
  mesh_west_parapets_21.userData.sculptComponent = {"id": "west-parapets", "name": "屋頂女兒牆", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "parapet", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.6, "height": 0.38, "depth": 3.7}, "transform": {"position": [-5.4, 8.709999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-parapets", "seamRefs": [], "detachableFragments": ["west-parapets"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-parapets-shape", "type": "raised ridge", "placement": [-6.4, 9.86, -1.3], "size": [4.6, 0.38, 3.7], "geometryEffect": "parapet", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["屋頂女兒牆"], "fidelityTier": "structural-pass", "campus": {"kind": "parapet", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_parapets_21.add(mesh_west_parapets_21);
  meshes["west-parapets"] = mesh_west_parapets_21;
  colliders["west-parapets"] = {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-parapets"] ??= [];
  destructionGroups["west-parapets"].push(node_west_parapets_21);
  const socket_west_parapets_assembly_origin_0 = new THREE.Object3D();
  socket_west_parapets_assembly_origin_0.name = "assembly-origin";
  socket_west_parapets_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_parapets_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_parapets_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_parapets_21.add(socket_west_parapets_assembly_origin_0);
  sockets["west-parapets:assembly-origin"] = socket_west_parapets_assembly_origin_0;

  const endpoint_west_side_windows_22 = makeAttachmentEndpoint(null);
  const node_west_side_windows_22 = new THREE.Group();
  node_west_side_windows_22.name = "\u5074\u7acb\u9762\u7a97\u683c__pivot";
  node_west_side_windows_22.scale.set(1, 1, 1);
  if (endpoint_west_side_windows_22) {
    node_west_side_windows_22.position.copy(endpoint_west_side_windows_22.start);
    node_west_side_windows_22.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_side_windows_22.position.set(-8.72, 2.88, -1.3);
    node_west_side_windows_22.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_side_windows_22.userData.sculptComponent = {"id": "west-side-windows", "name": "側立面窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "side-windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 5.2, "height": 4.15, "depth": 0.2}, "transform": {"position": [-8.72, 2.88, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-side-windows", "seamRefs": [], "detachableFragments": ["west-side-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-side-windows-shape", "type": "raised ridge", "placement": [-9.72, 3.25, -1.3], "size": [5.2, 4.8, 0.2], "geometryEffect": "side-windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側立面窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "side-windows", "stage": 1, "columns": 3, "rows": 3, "side": "west"}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_side_windows_22.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-side-windows", "seamRefs": [], "detachableFragments": ["west-side-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_west_side_windows_22);
  nodes["west-side-windows"] = node_west_side_windows_22;
  const mesh_west_side_windows_22Geometry = endpoint_west_side_windows_22
    ? new THREE.CylinderGeometry(endpoint_west_side_windows_22.endRadius, endpoint_west_side_windows_22.baseRadius, endpoint_west_side_windows_22.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_side_windows_22) {
    mesh_west_side_windows_22Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_side_windows_22 = new THREE.Mesh(
    mesh_west_side_windows_22Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_side_windows_22.name = "\u5074\u7acb\u9762\u7a97\u683c";
  if (endpoint_west_side_windows_22) {
    mesh_west_side_windows_22.position.copy(endpoint_west_side_windows_22.midpoint);
    mesh_west_side_windows_22.quaternion.copy(endpoint_west_side_windows_22.quaternion);
  }
  mesh_west_side_windows_22.castShadow = options.castShadow ?? true;
  mesh_west_side_windows_22.receiveShadow = options.receiveShadow ?? true;
  mesh_west_side_windows_22.userData.sculptComponent = {"id": "west-side-windows", "name": "側立面窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "side-windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 5.2, "height": 4.15, "depth": 0.2}, "transform": {"position": [-8.72, 2.88, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-side-windows", "seamRefs": [], "detachableFragments": ["west-side-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-side-windows-shape", "type": "raised ridge", "placement": [-9.72, 3.25, -1.3], "size": [5.2, 4.8, 0.2], "geometryEffect": "side-windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側立面窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "side-windows", "stage": 1, "columns": 3, "rows": 3, "side": "west"}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_side_windows_22.add(mesh_west_side_windows_22);
  meshes["west-side-windows"] = mesh_west_side_windows_22;
  colliders["west-side-windows"] = {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-side-windows"] ??= [];
  destructionGroups["west-side-windows"].push(node_west_side_windows_22);
  const socket_west_side_windows_assembly_origin_0 = new THREE.Object3D();
  socket_west_side_windows_assembly_origin_0.name = "assembly-origin";
  socket_west_side_windows_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_side_windows_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_side_windows_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_side_windows_22.add(socket_west_side_windows_assembly_origin_0);
  sockets["west-side-windows:assembly-origin"] = socket_west_side_windows_assembly_origin_0;

  const endpoint_east_arcade_23 = makeAttachmentEndpoint(null);
  const node_east_arcade_23 = new THREE.Group();
  node_east_arcade_23.name = "\u5074\u7ffc\u78da\u62f1\u7a97__pivot";
  node_east_arcade_23.scale.set(1, 1, 1);
  if (endpoint_east_arcade_23) {
    node_east_arcade_23.position.copy(endpoint_east_arcade_23.start);
    node_east_arcade_23.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_arcade_23.position.set(7.4, 0.4, 1.46);
    node_east_arcade_23.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_arcade_23.userData.sculptComponent = {"id": "east-arcade", "name": "側翼磚拱窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arcade", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 2.35, "depth": 0.45}, "transform": {"position": [7.4, 0.4, 1.46], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-arcade", "seamRefs": [], "detachableFragments": ["east-arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}}, "material": "brick", "materialLayers": ["brick"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-arcade-shape", "type": "raised ridge", "placement": [6.4, 0.55, 1.46], "size": [6.6, 2.35, 0.45], "geometryEffect": "arcade", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼磚拱窗"], "fidelityTier": "structural-pass", "campus": {"kind": "arcade", "stage": 1, "count": 4, "glazed": true}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(197, 107, 65, 1)", "secondaryAlbedo": "rgba(197, 107, 65, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_arcade_23.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-arcade", "seamRefs": [], "detachableFragments": ["east-arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}};
  (nodes["root"] ?? root).add(node_east_arcade_23);
  nodes["east-arcade"] = node_east_arcade_23;
  const mesh_east_arcade_23Geometry = endpoint_east_arcade_23
    ? new THREE.CylinderGeometry(endpoint_east_arcade_23.endRadius, endpoint_east_arcade_23.baseRadius, endpoint_east_arcade_23.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_arcade_23) {
    mesh_east_arcade_23Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_arcade_23 = new THREE.Mesh(
    mesh_east_arcade_23Geometry,
    materialMap["brick"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_arcade_23.name = "\u5074\u7ffc\u78da\u62f1\u7a97";
  if (endpoint_east_arcade_23) {
    mesh_east_arcade_23.position.copy(endpoint_east_arcade_23.midpoint);
    mesh_east_arcade_23.quaternion.copy(endpoint_east_arcade_23.quaternion);
  }
  mesh_east_arcade_23.castShadow = options.castShadow ?? true;
  mesh_east_arcade_23.receiveShadow = options.receiveShadow ?? true;
  mesh_east_arcade_23.userData.sculptComponent = {"id": "east-arcade", "name": "側翼磚拱窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arcade", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 2.35, "depth": 0.45}, "transform": {"position": [7.4, 0.4, 1.46], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-arcade", "seamRefs": [], "detachableFragments": ["east-arcade"], "breakImpulse": 0.0, "debrisMaterial": "brick"}}, "material": "brick", "materialLayers": ["brick"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-arcade-shape", "type": "raised ridge", "placement": [6.4, 0.55, 1.46], "size": [6.6, 2.35, 0.45], "geometryEffect": "arcade", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側翼磚拱窗"], "fidelityTier": "structural-pass", "campus": {"kind": "arcade", "stage": 1, "count": 4, "glazed": true}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(197, 107, 65, 1)", "secondaryAlbedo": "rgba(197, 107, 65, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_arcade_23.add(mesh_east_arcade_23);
  meshes["east-arcade"] = mesh_east_arcade_23;
  colliders["east-arcade"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 2.35, 0.45], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-arcade"] ??= [];
  destructionGroups["east-arcade"].push(node_east_arcade_23);
  const socket_east_arcade_assembly_origin_0 = new THREE.Object3D();
  socket_east_arcade_assembly_origin_0.name = "assembly-origin";
  socket_east_arcade_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_arcade_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_arcade_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_arcade_23.add(socket_east_arcade_assembly_origin_0);
  sockets["east-arcade:assembly-origin"] = socket_east_arcade_assembly_origin_0;

  const endpoint_east_windows_24 = makeAttachmentEndpoint(null);
  const node_east_windows_24 = new THREE.Group();
  node_east_windows_24.name = "\u4e09\u5c64\u85cd\u7070\u7a97\u683c__pivot";
  node_east_windows_24.scale.set(1, 1, 1);
  if (endpoint_east_windows_24) {
    node_east_windows_24.position.copy(endpoint_east_windows_24.start);
    node_east_windows_24.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_windows_24.position.set(7.4, 2.88, 1.36);
    node_east_windows_24.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_windows_24.userData.sculptComponent = {"id": "east-windows", "name": "三層藍灰窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.15, "depth": 0.2}, "transform": {"position": [7.4, 2.88, 1.36], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-windows", "seamRefs": [], "detachableFragments": ["east-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-windows-shape", "type": "raised ridge", "placement": [6.4, 3.25, 1.36], "size": [6.6, 4.8, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["三層藍灰窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 5, "rows": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_windows_24.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-windows", "seamRefs": [], "detachableFragments": ["east-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_east_windows_24);
  nodes["east-windows"] = node_east_windows_24;
  const mesh_east_windows_24Geometry = endpoint_east_windows_24
    ? new THREE.CylinderGeometry(endpoint_east_windows_24.endRadius, endpoint_east_windows_24.baseRadius, endpoint_east_windows_24.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_windows_24) {
    mesh_east_windows_24Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_windows_24 = new THREE.Mesh(
    mesh_east_windows_24Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_windows_24.name = "\u4e09\u5c64\u85cd\u7070\u7a97\u683c";
  if (endpoint_east_windows_24) {
    mesh_east_windows_24.position.copy(endpoint_east_windows_24.midpoint);
    mesh_east_windows_24.quaternion.copy(endpoint_east_windows_24.quaternion);
  }
  mesh_east_windows_24.castShadow = options.castShadow ?? true;
  mesh_east_windows_24.receiveShadow = options.receiveShadow ?? true;
  mesh_east_windows_24.userData.sculptComponent = {"id": "east-windows", "name": "三層藍灰窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.15, "depth": 0.2}, "transform": {"position": [7.4, 2.88, 1.36], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-windows", "seamRefs": [], "detachableFragments": ["east-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-windows-shape", "type": "raised ridge", "placement": [6.4, 3.25, 1.36], "size": [6.6, 4.8, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["三層藍灰窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 5, "rows": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_windows_24.add(mesh_east_windows_24);
  meshes["east-windows"] = mesh_east_windows_24;
  colliders["east-windows"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-windows"] ??= [];
  destructionGroups["east-windows"].push(node_east_windows_24);
  const socket_east_windows_assembly_origin_0 = new THREE.Object3D();
  socket_east_windows_assembly_origin_0.name = "assembly-origin";
  socket_east_windows_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_windows_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_windows_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_windows_24.add(socket_east_windows_assembly_origin_0);
  sockets["east-windows:assembly-origin"] = socket_east_windows_assembly_origin_0;

  const endpoint_east_piers_25 = makeAttachmentEndpoint(null);
  const node_east_piers_25 = new THREE.Group();
  node_east_piers_25.name = "\u77f3\u67f1\u8207\u8170\u7dda__pivot";
  node_east_piers_25.scale.set(1, 1, 1);
  if (endpoint_east_piers_25) {
    node_east_piers_25.position.copy(endpoint_east_piers_25.start);
    node_east_piers_25.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_piers_25.position.set(7.4, 2.85, 1.42);
    node_east_piers_25.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_piers_25.userData.sculptComponent = {"id": "east-piers", "name": "石柱與腰線", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "piers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.25, "depth": 0.25}, "transform": {"position": [7.4, 2.85, 1.42], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-piers", "seamRefs": [], "detachableFragments": ["east-piers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-piers-shape", "type": "raised ridge", "placement": [6.4, 3.0, 1.42], "size": [6.6, 5.25, 0.25], "geometryEffect": "piers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["石柱與腰線"], "fidelityTier": "structural-pass", "campus": {"kind": "piers", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_piers_25.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-piers", "seamRefs": [], "detachableFragments": ["east-piers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_east_piers_25);
  nodes["east-piers"] = node_east_piers_25;
  const mesh_east_piers_25Geometry = endpoint_east_piers_25
    ? new THREE.CylinderGeometry(endpoint_east_piers_25.endRadius, endpoint_east_piers_25.baseRadius, endpoint_east_piers_25.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_piers_25) {
    mesh_east_piers_25Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_piers_25 = new THREE.Mesh(
    mesh_east_piers_25Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_piers_25.name = "\u77f3\u67f1\u8207\u8170\u7dda";
  if (endpoint_east_piers_25) {
    mesh_east_piers_25.position.copy(endpoint_east_piers_25.midpoint);
    mesh_east_piers_25.quaternion.copy(endpoint_east_piers_25.quaternion);
  }
  mesh_east_piers_25.castShadow = options.castShadow ?? true;
  mesh_east_piers_25.receiveShadow = options.receiveShadow ?? true;
  mesh_east_piers_25.userData.sculptComponent = {"id": "east-piers", "name": "石柱與腰線", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "piers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 4.25, "depth": 0.25}, "transform": {"position": [7.4, 2.85, 1.42], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-piers", "seamRefs": [], "detachableFragments": ["east-piers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-piers-shape", "type": "raised ridge", "placement": [6.4, 3.0, 1.42], "size": [6.6, 5.25, 0.25], "geometryEffect": "piers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["石柱與腰線"], "fidelityTier": "structural-pass", "campus": {"kind": "piers", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_piers_25.add(mesh_east_piers_25);
  meshes["east-piers"] = mesh_east_piers_25;
  colliders["east-piers"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 5.25, 0.25], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-piers"] ??= [];
  destructionGroups["east-piers"].push(node_east_piers_25);
  const socket_east_piers_assembly_origin_0 = new THREE.Object3D();
  socket_east_piers_assembly_origin_0.name = "assembly-origin";
  socket_east_piers_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_piers_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_piers_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_piers_25.add(socket_east_piers_assembly_origin_0);
  sockets["east-piers:assembly-origin"] = socket_east_piers_assembly_origin_0;

  const endpoint_east_dormers_26 = makeAttachmentEndpoint(null);
  const node_east_dormers_26 = new THREE.Group();
  node_east_dormers_26.name = "\u96d9\u8001\u864e\u7a97__pivot";
  node_east_dormers_26.scale.set(1, 1, 1);
  if (endpoint_east_dormers_26) {
    node_east_dormers_26.position.copy(endpoint_east_dormers_26.start);
    node_east_dormers_26.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_dormers_26.position.set(7.4, 7.569999999999999, 0.94);
    node_east_dormers_26.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_dormers_26.userData.sculptComponent = {"id": "east-dormers", "name": "雙老虎窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "dormers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 1.15, "depth": 1.0}, "transform": {"position": [7.4, 7.569999999999999, 0.94], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-dormers", "seamRefs": [], "detachableFragments": ["east-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-dormers-shape", "type": "raised ridge", "placement": [6.4, 8.72, 0.94], "size": [6.6, 1.15, 1.0], "geometryEffect": "dormers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["雙老虎窗"], "fidelityTier": "structural-pass", "campus": {"kind": "dormers", "stage": 1, "count": 2}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_dormers_26.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-dormers", "seamRefs": [], "detachableFragments": ["east-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_east_dormers_26);
  nodes["east-dormers"] = node_east_dormers_26;
  const mesh_east_dormers_26Geometry = endpoint_east_dormers_26
    ? new THREE.CylinderGeometry(endpoint_east_dormers_26.endRadius, endpoint_east_dormers_26.baseRadius, endpoint_east_dormers_26.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_dormers_26) {
    mesh_east_dormers_26Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_dormers_26 = new THREE.Mesh(
    mesh_east_dormers_26Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_dormers_26.name = "\u96d9\u8001\u864e\u7a97";
  if (endpoint_east_dormers_26) {
    mesh_east_dormers_26.position.copy(endpoint_east_dormers_26.midpoint);
    mesh_east_dormers_26.quaternion.copy(endpoint_east_dormers_26.quaternion);
  }
  mesh_east_dormers_26.castShadow = options.castShadow ?? true;
  mesh_east_dormers_26.receiveShadow = options.receiveShadow ?? true;
  mesh_east_dormers_26.userData.sculptComponent = {"id": "east-dormers", "name": "雙老虎窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "dormers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.6, "height": 1.15, "depth": 1.0}, "transform": {"position": [7.4, 7.569999999999999, 0.94], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-dormers", "seamRefs": [], "detachableFragments": ["east-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-dormers-shape", "type": "raised ridge", "placement": [6.4, 8.72, 0.94], "size": [6.6, 1.15, 1.0], "geometryEffect": "dormers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["雙老虎窗"], "fidelityTier": "structural-pass", "campus": {"kind": "dormers", "stage": 1, "count": 2}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_dormers_26.add(mesh_east_dormers_26);
  meshes["east-dormers"] = mesh_east_dormers_26;
  colliders["east-dormers"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.6, 1.15, 1.0], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-dormers"] ??= [];
  destructionGroups["east-dormers"].push(node_east_dormers_26);
  const socket_east_dormers_assembly_origin_0 = new THREE.Object3D();
  socket_east_dormers_assembly_origin_0.name = "assembly-origin";
  socket_east_dormers_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_dormers_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_dormers_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_dormers_26.add(socket_east_dormers_assembly_origin_0);
  sockets["east-dormers:assembly-origin"] = socket_east_dormers_assembly_origin_0;

  const endpoint_east_parapets_27 = makeAttachmentEndpoint(null);
  const node_east_parapets_27 = new THREE.Group();
  node_east_parapets_27.name = "\u5c4b\u9802\u5973\u5152\u7246__pivot";
  node_east_parapets_27.scale.set(1, 1, 1);
  if (endpoint_east_parapets_27) {
    node_east_parapets_27.position.copy(endpoint_east_parapets_27.start);
    node_east_parapets_27.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_parapets_27.position.set(7.4, 8.709999999999999, -1.3);
    node_east_parapets_27.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_parapets_27.userData.sculptComponent = {"id": "east-parapets", "name": "屋頂女兒牆", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "parapet", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.6, "height": 0.38, "depth": 3.7}, "transform": {"position": [7.4, 8.709999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-parapets", "seamRefs": [], "detachableFragments": ["east-parapets"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-parapets-shape", "type": "raised ridge", "placement": [6.4, 9.86, -1.3], "size": [4.6, 0.38, 3.7], "geometryEffect": "parapet", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["屋頂女兒牆"], "fidelityTier": "structural-pass", "campus": {"kind": "parapet", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_parapets_27.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-parapets", "seamRefs": [], "detachableFragments": ["east-parapets"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_east_parapets_27);
  nodes["east-parapets"] = node_east_parapets_27;
  const mesh_east_parapets_27Geometry = endpoint_east_parapets_27
    ? new THREE.CylinderGeometry(endpoint_east_parapets_27.endRadius, endpoint_east_parapets_27.baseRadius, endpoint_east_parapets_27.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_parapets_27) {
    mesh_east_parapets_27Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_parapets_27 = new THREE.Mesh(
    mesh_east_parapets_27Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_parapets_27.name = "\u5c4b\u9802\u5973\u5152\u7246";
  if (endpoint_east_parapets_27) {
    mesh_east_parapets_27.position.copy(endpoint_east_parapets_27.midpoint);
    mesh_east_parapets_27.quaternion.copy(endpoint_east_parapets_27.quaternion);
  }
  mesh_east_parapets_27.castShadow = options.castShadow ?? true;
  mesh_east_parapets_27.receiveShadow = options.receiveShadow ?? true;
  mesh_east_parapets_27.userData.sculptComponent = {"id": "east-parapets", "name": "屋頂女兒牆", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "parapet", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.6, "height": 0.38, "depth": 3.7}, "transform": {"position": [7.4, 8.709999999999999, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-parapets", "seamRefs": [], "detachableFragments": ["east-parapets"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-parapets-shape", "type": "raised ridge", "placement": [6.4, 9.86, -1.3], "size": [4.6, 0.38, 3.7], "geometryEffect": "parapet", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["屋頂女兒牆"], "fidelityTier": "structural-pass", "campus": {"kind": "parapet", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_parapets_27.add(mesh_east_parapets_27);
  meshes["east-parapets"] = mesh_east_parapets_27;
  colliders["east-parapets"] = {"type": "box", "offset": [0, 0, 0], "scale": [4.6, 0.38, 3.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-parapets"] ??= [];
  destructionGroups["east-parapets"].push(node_east_parapets_27);
  const socket_east_parapets_assembly_origin_0 = new THREE.Object3D();
  socket_east_parapets_assembly_origin_0.name = "assembly-origin";
  socket_east_parapets_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_parapets_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_parapets_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_parapets_27.add(socket_east_parapets_assembly_origin_0);
  sockets["east-parapets:assembly-origin"] = socket_east_parapets_assembly_origin_0;

  const endpoint_east_side_windows_28 = makeAttachmentEndpoint(null);
  const node_east_side_windows_28 = new THREE.Group();
  node_east_side_windows_28.name = "\u5074\u7acb\u9762\u7a97\u683c__pivot";
  node_east_side_windows_28.scale.set(1, 1, 1);
  if (endpoint_east_side_windows_28) {
    node_east_side_windows_28.position.copy(endpoint_east_side_windows_28.start);
    node_east_side_windows_28.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_side_windows_28.position.set(10.72, 2.88, -1.3);
    node_east_side_windows_28.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_side_windows_28.userData.sculptComponent = {"id": "east-side-windows", "name": "側立面窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "side-windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 5.2, "height": 4.15, "depth": 0.2}, "transform": {"position": [10.72, 2.88, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-side-windows", "seamRefs": [], "detachableFragments": ["east-side-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-side-windows-shape", "type": "raised ridge", "placement": [9.72, 3.25, -1.3], "size": [5.2, 4.8, 0.2], "geometryEffect": "side-windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側立面窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "side-windows", "stage": 1, "columns": 3, "rows": 3, "side": "east"}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_side_windows_28.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-side-windows", "seamRefs": [], "detachableFragments": ["east-side-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_east_side_windows_28);
  nodes["east-side-windows"] = node_east_side_windows_28;
  const mesh_east_side_windows_28Geometry = endpoint_east_side_windows_28
    ? new THREE.CylinderGeometry(endpoint_east_side_windows_28.endRadius, endpoint_east_side_windows_28.baseRadius, endpoint_east_side_windows_28.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_side_windows_28) {
    mesh_east_side_windows_28Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_side_windows_28 = new THREE.Mesh(
    mesh_east_side_windows_28Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_side_windows_28.name = "\u5074\u7acb\u9762\u7a97\u683c";
  if (endpoint_east_side_windows_28) {
    mesh_east_side_windows_28.position.copy(endpoint_east_side_windows_28.midpoint);
    mesh_east_side_windows_28.quaternion.copy(endpoint_east_side_windows_28.quaternion);
  }
  mesh_east_side_windows_28.castShadow = options.castShadow ?? true;
  mesh_east_side_windows_28.receiveShadow = options.receiveShadow ?? true;
  mesh_east_side_windows_28.userData.sculptComponent = {"id": "east-side-windows", "name": "側立面窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "side-windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 5.2, "height": 4.15, "depth": 0.2}, "transform": {"position": [10.72, 2.88, -1.3], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-side-windows", "seamRefs": [], "detachableFragments": ["east-side-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-side-windows-shape", "type": "raised ridge", "placement": [9.72, 3.25, -1.3], "size": [5.2, 4.8, 0.2], "geometryEffect": "side-windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["側立面窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "side-windows", "stage": 1, "columns": 3, "rows": 3, "side": "east"}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_side_windows_28.add(mesh_east_side_windows_28);
  meshes["east-side-windows"] = mesh_east_side_windows_28;
  colliders["east-side-windows"] = {"type": "box", "offset": [0, 0, 0], "scale": [5.2, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-side-windows"] ??= [];
  destructionGroups["east-side-windows"].push(node_east_side_windows_28);
  const socket_east_side_windows_assembly_origin_0 = new THREE.Object3D();
  socket_east_side_windows_assembly_origin_0.name = "assembly-origin";
  socket_east_side_windows_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_side_windows_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_side_windows_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_side_windows_28.add(socket_east_side_windows_assembly_origin_0);
  sockets["east-side-windows:assembly-origin"] = socket_east_side_windows_assembly_origin_0;

  const endpoint_central_windows_29 = makeAttachmentEndpoint(null);
  const node_central_windows_29 = new THREE.Group();
  node_central_windows_29.name = "\u4e2d\u592e\u7acb\u9762\u7a97\u683c__pivot";
  node_central_windows_29.scale.set(1, 1, 1);
  if (endpoint_central_windows_29) {
    node_central_windows_29.position.copy(endpoint_central_windows_29.start);
    node_central_windows_29.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_central_windows_29.position.set(1.0, 3.0500000000000003, 0.95);
    node_central_windows_29.rotation.set(0.0, 0.0, 0.0);
  }
  node_central_windows_29.userData.sculptComponent = {"id": "central-windows", "name": "中央立面窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.0, "height": 4.8, "depth": 0.2}, "transform": {"position": [1.0, 3.0500000000000003, 0.95], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.0, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-windows", "seamRefs": [], "detachableFragments": ["central-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-windows-shape", "type": "raised ridge", "placement": [0, 3.2, 0.95], "size": [6.0, 4.8, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央立面窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 4, "rows": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_windows_29.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.0, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-windows", "seamRefs": [], "detachableFragments": ["central-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_central_windows_29);
  nodes["central-windows"] = node_central_windows_29;
  const mesh_central_windows_29Geometry = endpoint_central_windows_29
    ? new THREE.CylinderGeometry(endpoint_central_windows_29.endRadius, endpoint_central_windows_29.baseRadius, endpoint_central_windows_29.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_central_windows_29) {
    mesh_central_windows_29Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_central_windows_29 = new THREE.Mesh(
    mesh_central_windows_29Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_central_windows_29.name = "\u4e2d\u592e\u7acb\u9762\u7a97\u683c";
  if (endpoint_central_windows_29) {
    mesh_central_windows_29.position.copy(endpoint_central_windows_29.midpoint);
    mesh_central_windows_29.quaternion.copy(endpoint_central_windows_29.quaternion);
  }
  mesh_central_windows_29.castShadow = options.castShadow ?? true;
  mesh_central_windows_29.receiveShadow = options.receiveShadow ?? true;
  mesh_central_windows_29.userData.sculptComponent = {"id": "central-windows", "name": "中央立面窗格", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 6.0, "height": 4.8, "depth": 0.2}, "transform": {"position": [1.0, 3.0500000000000003, 0.95], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [6.0, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-windows", "seamRefs": [], "detachableFragments": ["central-windows"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-windows-shape", "type": "raised ridge", "placement": [0, 3.2, 0.95], "size": [6.0, 4.8, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央立面窗格"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 4, "rows": 3}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_windows_29.add(mesh_central_windows_29);
  meshes["central-windows"] = mesh_central_windows_29;
  colliders["central-windows"] = {"type": "box", "offset": [0, 0, 0], "scale": [6.0, 4.8, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["central-windows"] ??= [];
  destructionGroups["central-windows"].push(node_central_windows_29);
  const socket_central_windows_assembly_origin_0 = new THREE.Object3D();
  socket_central_windows_assembly_origin_0.name = "assembly-origin";
  socket_central_windows_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_central_windows_assembly_origin_0.rotation.set(0, 0, 0);
  socket_central_windows_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_central_windows_29.add(socket_central_windows_assembly_origin_0);
  sockets["central-windows:assembly-origin"] = socket_central_windows_assembly_origin_0;

  const endpoint_tower_clock_30 = makeAttachmentEndpoint(null);
  const node_tower_clock_30 = new THREE.Group();
  node_tower_clock_30.name = "\u5713\u5f62\u6642\u9418__pivot";
  node_tower_clock_30.scale.set(1, 1, 1);
  if (endpoint_tower_clock_30) {
    node_tower_clock_30.position.copy(endpoint_tower_clock_30.start);
    node_tower_clock_30.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_tower_clock_30.position.set(1.0, 12.06, 1.075);
    node_tower_clock_30.rotation.set(0.0, 0.0, 0.0);
  }
  node_tower_clock_30.userData.sculptComponent = {"id": "tower-clock", "name": "圓形時鐘", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "clock", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.38, "height": 1.38, "depth": 0.2}, "transform": {"position": [1.0, 12.06, 1.075], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.38, 1.38, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-clock", "seamRefs": [], "detachableFragments": ["tower-clock"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-clock-shape", "type": "raised ridge", "placement": [0, 12.21, 1.075], "size": [1.38, 1.38, 0.2], "geometryEffect": "clock", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["圓形時鐘"], "fidelityTier": "structural-pass", "campus": {"kind": "clock", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_clock_30.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.38, 1.38, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-clock", "seamRefs": [], "detachableFragments": ["tower-clock"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_tower_clock_30);
  nodes["tower-clock"] = node_tower_clock_30;
  const mesh_tower_clock_30Geometry = endpoint_tower_clock_30
    ? new THREE.CylinderGeometry(endpoint_tower_clock_30.endRadius, endpoint_tower_clock_30.baseRadius, endpoint_tower_clock_30.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_tower_clock_30) {
    mesh_tower_clock_30Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_tower_clock_30 = new THREE.Mesh(
    mesh_tower_clock_30Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_tower_clock_30.name = "\u5713\u5f62\u6642\u9418";
  if (endpoint_tower_clock_30) {
    mesh_tower_clock_30.position.copy(endpoint_tower_clock_30.midpoint);
    mesh_tower_clock_30.quaternion.copy(endpoint_tower_clock_30.quaternion);
  }
  mesh_tower_clock_30.castShadow = options.castShadow ?? true;
  mesh_tower_clock_30.receiveShadow = options.receiveShadow ?? true;
  mesh_tower_clock_30.userData.sculptComponent = {"id": "tower-clock", "name": "圓形時鐘", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "clock", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.38, "height": 1.38, "depth": 0.2}, "transform": {"position": [1.0, 12.06, 1.075], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.38, 1.38, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-clock", "seamRefs": [], "detachableFragments": ["tower-clock"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-clock-shape", "type": "raised ridge", "placement": [0, 12.21, 1.075], "size": [1.38, 1.38, 0.2], "geometryEffect": "clock", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["圓形時鐘"], "fidelityTier": "structural-pass", "campus": {"kind": "clock", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_clock_30.add(mesh_tower_clock_30);
  meshes["tower-clock"] = mesh_tower_clock_30;
  colliders["tower-clock"] = {"type": "box", "offset": [0, 0, 0], "scale": [1.38, 1.38, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["tower-clock"] ??= [];
  destructionGroups["tower-clock"].push(node_tower_clock_30);
  const socket_tower_clock_assembly_origin_0 = new THREE.Object3D();
  socket_tower_clock_assembly_origin_0.name = "assembly-origin";
  socket_tower_clock_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_tower_clock_assembly_origin_0.rotation.set(0, 0, 0);
  socket_tower_clock_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_tower_clock_30.add(socket_tower_clock_assembly_origin_0);
  sockets["tower-clock:assembly-origin"] = socket_tower_clock_assembly_origin_0;

  const endpoint_tower_window_31 = makeAttachmentEndpoint(null);
  const node_tower_window_31 = new THREE.Group();
  node_tower_window_31.name = "\u9418\u6a13\u9577\u62f1\u7a97__pivot";
  node_tower_window_31.scale.set(1, 1, 1);
  if (endpoint_tower_window_31) {
    node_tower_window_31.position.copy(endpoint_tower_window_31.start);
    node_tower_window_31.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_tower_window_31.position.set(1.0, 8.799999999999999, 1.045);
    node_tower_window_31.rotation.set(0.0, 0.0, 0.0);
  }
  node_tower_window_31.userData.sculptComponent = {"id": "tower-window", "name": "鐘樓長拱窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arched-window", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.0, "height": 2.7, "depth": 0.18}, "transform": {"position": [1.0, 8.799999999999999, 1.045], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.0, 2.7, 0.18], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-window", "seamRefs": [], "detachableFragments": ["tower-window"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-window-shape", "type": "raised ridge", "placement": [0, 8.95, 1.045], "size": [1.0, 2.7, 0.18], "geometryEffect": "arched-window", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓長拱窗"], "fidelityTier": "structural-pass", "campus": {"kind": "arched-window", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_window_31.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.0, 2.7, 0.18], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-window", "seamRefs": [], "detachableFragments": ["tower-window"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_tower_window_31);
  nodes["tower-window"] = node_tower_window_31;
  const mesh_tower_window_31Geometry = endpoint_tower_window_31
    ? new THREE.CylinderGeometry(endpoint_tower_window_31.endRadius, endpoint_tower_window_31.baseRadius, endpoint_tower_window_31.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_tower_window_31) {
    mesh_tower_window_31Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_tower_window_31 = new THREE.Mesh(
    mesh_tower_window_31Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_tower_window_31.name = "\u9418\u6a13\u9577\u62f1\u7a97";
  if (endpoint_tower_window_31) {
    mesh_tower_window_31.position.copy(endpoint_tower_window_31.midpoint);
    mesh_tower_window_31.quaternion.copy(endpoint_tower_window_31.quaternion);
  }
  mesh_tower_window_31.castShadow = options.castShadow ?? true;
  mesh_tower_window_31.receiveShadow = options.receiveShadow ?? true;
  mesh_tower_window_31.userData.sculptComponent = {"id": "tower-window", "name": "鐘樓長拱窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "arched-window", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.0, "height": 2.7, "depth": 0.18}, "transform": {"position": [1.0, 8.799999999999999, 1.045], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.0, 2.7, 0.18], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-window", "seamRefs": [], "detachableFragments": ["tower-window"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-window-shape", "type": "raised ridge", "placement": [0, 8.95, 1.045], "size": [1.0, 2.7, 0.18], "geometryEffect": "arched-window", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓長拱窗"], "fidelityTier": "structural-pass", "campus": {"kind": "arched-window", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_window_31.add(mesh_tower_window_31);
  meshes["tower-window"] = mesh_tower_window_31;
  colliders["tower-window"] = {"type": "box", "offset": [0, 0, 0], "scale": [1.0, 2.7, 0.18], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["tower-window"] ??= [];
  destructionGroups["tower-window"].push(node_tower_window_31);
  const socket_tower_window_assembly_origin_0 = new THREE.Object3D();
  socket_tower_window_assembly_origin_0.name = "assembly-origin";
  socket_tower_window_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_tower_window_assembly_origin_0.rotation.set(0, 0, 0);
  socket_tower_window_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_tower_window_31.add(socket_tower_window_assembly_origin_0);
  sockets["tower-window:assembly-origin"] = socket_tower_window_assembly_origin_0;

  const endpoint_tower_lower_window_32 = makeAttachmentEndpoint(null);
  const node_tower_lower_window_32 = new THREE.Group();
  node_tower_lower_window_32.name = "\u9418\u6a13\u5e95\u5c64\u7a97__pivot";
  node_tower_lower_window_32.scale.set(1, 1, 1);
  if (endpoint_tower_lower_window_32) {
    node_tower_lower_window_32.position.copy(endpoint_tower_lower_window_32.start);
    node_tower_lower_window_32.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_tower_lower_window_32.position.set(1.0, 6.1499999999999995, 1.055);
    node_tower_lower_window_32.rotation.set(0.0, 0.0, 0.0);
  }
  node_tower_lower_window_32.userData.sculptComponent = {"id": "tower-lower-window", "name": "鐘樓底層窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.2, "height": 1.15, "depth": 0.2}, "transform": {"position": [1.0, 6.1499999999999995, 1.055], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.2, 1.15, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-lower-window", "seamRefs": [], "detachableFragments": ["tower-lower-window"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-lower-window-shape", "type": "raised ridge", "placement": [0, 6.3, 1.055], "size": [1.2, 1.15, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓底層窗"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 1, "rows": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_lower_window_32.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.2, 1.15, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-lower-window", "seamRefs": [], "detachableFragments": ["tower-lower-window"], "breakImpulse": 0.0, "debrisMaterial": "glass"}};
  (nodes["root"] ?? root).add(node_tower_lower_window_32);
  nodes["tower-lower-window"] = node_tower_lower_window_32;
  const mesh_tower_lower_window_32Geometry = endpoint_tower_lower_window_32
    ? new THREE.CylinderGeometry(endpoint_tower_lower_window_32.endRadius, endpoint_tower_lower_window_32.baseRadius, endpoint_tower_lower_window_32.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_tower_lower_window_32) {
    mesh_tower_lower_window_32Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_tower_lower_window_32 = new THREE.Mesh(
    mesh_tower_lower_window_32Geometry,
    materialMap["glass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_tower_lower_window_32.name = "\u9418\u6a13\u5e95\u5c64\u7a97";
  if (endpoint_tower_lower_window_32) {
    mesh_tower_lower_window_32.position.copy(endpoint_tower_lower_window_32.midpoint);
    mesh_tower_lower_window_32.quaternion.copy(endpoint_tower_lower_window_32.quaternion);
  }
  mesh_tower_lower_window_32.castShadow = options.castShadow ?? true;
  mesh_tower_lower_window_32.receiveShadow = options.receiveShadow ?? true;
  mesh_tower_lower_window_32.userData.sculptComponent = {"id": "tower-lower-window", "name": "鐘樓底層窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "windows", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 1.2, "height": 1.15, "depth": 0.2}, "transform": {"position": [1.0, 6.1499999999999995, 1.055], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1.2, 1.15, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "tower-lower-window", "seamRefs": [], "detachableFragments": ["tower-lower-window"], "breakImpulse": 0.0, "debrisMaterial": "glass"}}, "material": "glass", "materialLayers": ["glass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "tower-lower-window-shape", "type": "raised ridge", "placement": [0, 6.3, 1.055], "size": [1.2, 1.15, 0.2], "geometryEffect": "windows", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["鐘樓底層窗"], "fidelityTier": "structural-pass", "campus": {"kind": "windows", "stage": 1, "columns": 1, "rows": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(152, 175, 179, 1)", "secondaryAlbedo": "rgba(152, 175, 179, 1)", "materialClass": "glass", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_tower_lower_window_32.add(mesh_tower_lower_window_32);
  meshes["tower-lower-window"] = mesh_tower_lower_window_32;
  colliders["tower-lower-window"] = {"type": "box", "offset": [0, 0, 0], "scale": [1.2, 1.15, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["tower-lower-window"] ??= [];
  destructionGroups["tower-lower-window"].push(node_tower_lower_window_32);
  const socket_tower_lower_window_assembly_origin_0 = new THREE.Object3D();
  socket_tower_lower_window_assembly_origin_0.name = "assembly-origin";
  socket_tower_lower_window_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_tower_lower_window_assembly_origin_0.rotation.set(0, 0, 0);
  socket_tower_lower_window_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_tower_lower_window_32.add(socket_tower_lower_window_assembly_origin_0);
  sockets["tower-lower-window:assembly-origin"] = socket_tower_lower_window_assembly_origin_0;

  const endpoint_balcony_33 = makeAttachmentEndpoint(null);
  const node_balcony_33 = new THREE.Group();
  node_balcony_33.name = "\u96d9\u62f1\u967d\u53f0__pivot";
  node_balcony_33.scale.set(1, 1, 1);
  if (endpoint_balcony_33) {
    node_balcony_33.position.copy(endpoint_balcony_33.start);
    node_balcony_33.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_balcony_33.position.set(1.0, 4.35, 1.98);
    node_balcony_33.rotation.set(0.0, 0.0, 0.0);
  }
  node_balcony_33.userData.sculptComponent = {"id": "balcony", "name": "雙拱陽台", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "balcony", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.65, "height": 1.95, "depth": 1.65}, "transform": {"position": [1.0, 4.35, 1.98], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.65, 1.95, 1.65], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "balcony", "seamRefs": [], "detachableFragments": ["balcony"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "balcony-shape", "type": "raised ridge", "placement": [0, 4.5, 1.98], "size": [3.65, 1.95, 1.65], "geometryEffect": "balcony", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["雙拱陽台"], "fidelityTier": "structural-pass", "campus": {"kind": "balcony", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_balcony_33.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.65, 1.95, 1.65], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "balcony", "seamRefs": [], "detachableFragments": ["balcony"], "breakImpulse": 0.0, "debrisMaterial": "stone"}};
  (nodes["root"] ?? root).add(node_balcony_33);
  nodes["balcony"] = node_balcony_33;
  const mesh_balcony_33Geometry = endpoint_balcony_33
    ? new THREE.CylinderGeometry(endpoint_balcony_33.endRadius, endpoint_balcony_33.baseRadius, endpoint_balcony_33.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_balcony_33) {
    mesh_balcony_33Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_balcony_33 = new THREE.Mesh(
    mesh_balcony_33Geometry,
    materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_balcony_33.name = "\u96d9\u62f1\u967d\u53f0";
  if (endpoint_balcony_33) {
    mesh_balcony_33.position.copy(endpoint_balcony_33.midpoint);
    mesh_balcony_33.quaternion.copy(endpoint_balcony_33.quaternion);
  }
  mesh_balcony_33.castShadow = options.castShadow ?? true;
  mesh_balcony_33.receiveShadow = options.receiveShadow ?? true;
  mesh_balcony_33.userData.sculptComponent = {"id": "balcony", "name": "雙拱陽台", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "balcony", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.65, "height": 1.95, "depth": 1.65}, "transform": {"position": [1.0, 4.35, 1.98], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.65, 1.95, 1.65], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "balcony", "seamRefs": [], "detachableFragments": ["balcony"], "breakImpulse": 0.0, "debrisMaterial": "stone"}}, "material": "stone", "materialLayers": ["stone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "balcony-shape", "type": "raised ridge", "placement": [0, 4.5, 1.98], "size": [3.65, 1.95, 1.65], "geometryEffect": "balcony", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["雙拱陽台"], "fidelityTier": "structural-pass", "campus": {"kind": "balcony", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(226, 204, 177, 1)", "secondaryAlbedo": "rgba(226, 204, 177, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_balcony_33.add(mesh_balcony_33);
  meshes["balcony"] = mesh_balcony_33;
  colliders["balcony"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.65, 1.95, 1.65], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["balcony"] ??= [];
  destructionGroups["balcony"].push(node_balcony_33);
  const socket_balcony_assembly_origin_0 = new THREE.Object3D();
  socket_balcony_assembly_origin_0.name = "assembly-origin";
  socket_balcony_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_balcony_assembly_origin_0.rotation.set(0, 0, 0);
  socket_balcony_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_balcony_33.add(socket_balcony_assembly_origin_0);
  sockets["balcony:assembly-origin"] = socket_balcony_assembly_origin_0;

  const endpoint_stairs_34 = makeAttachmentEndpoint(null);
  const node_stairs_34 = new THREE.Group();
  node_stairs_34.name = "\u4e2d\u592e\u968e\u68af__pivot";
  node_stairs_34.scale.set(1, 1, 1);
  if (endpoint_stairs_34) {
    node_stairs_34.position.copy(endpoint_stairs_34.start);
    node_stairs_34.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_stairs_34.position.set(0.0, 0.05, 5.35);
    node_stairs_34.rotation.set(0.0, 0.0, 0.0);
  }
  node_stairs_34.userData.sculptComponent = {"id": "stairs", "name": "中央階梯", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "stairs", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.2, "height": 0.82, "depth": 2.6}, "transform": {"position": [0, 0.05, 5.35], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.2, 0.82, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "stairs", "seamRefs": [], "detachableFragments": ["stairs"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "stairs-shape", "type": "raised ridge", "placement": [0, 0.05, 5.35], "size": [4.2, 0.82, 2.6], "geometryEffect": "stairs", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央階梯"], "fidelityTier": "structural-pass", "campus": {"kind": "stairs", "stage": 1, "count": 9}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_stairs_34.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.2, 0.82, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "stairs", "seamRefs": [], "detachableFragments": ["stairs"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_stairs_34);
  nodes["stairs"] = node_stairs_34;
  const mesh_stairs_34Geometry = endpoint_stairs_34
    ? new THREE.CylinderGeometry(endpoint_stairs_34.endRadius, endpoint_stairs_34.baseRadius, endpoint_stairs_34.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_stairs_34) {
    mesh_stairs_34Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_stairs_34 = new THREE.Mesh(
    mesh_stairs_34Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_stairs_34.name = "\u4e2d\u592e\u968e\u68af";
  if (endpoint_stairs_34) {
    mesh_stairs_34.position.copy(endpoint_stairs_34.midpoint);
    mesh_stairs_34.quaternion.copy(endpoint_stairs_34.quaternion);
  }
  mesh_stairs_34.castShadow = options.castShadow ?? true;
  mesh_stairs_34.receiveShadow = options.receiveShadow ?? true;
  mesh_stairs_34.userData.sculptComponent = {"id": "stairs", "name": "中央階梯", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "stairs", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.2, "height": 0.82, "depth": 2.6}, "transform": {"position": [0, 0.05, 5.35], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.2, 0.82, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "stairs", "seamRefs": [], "detachableFragments": ["stairs"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "stairs-shape", "type": "raised ridge", "placement": [0, 0.05, 5.35], "size": [4.2, 0.82, 2.6], "geometryEffect": "stairs", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央階梯"], "fidelityTier": "structural-pass", "campus": {"kind": "stairs", "stage": 1, "count": 9}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_stairs_34.add(mesh_stairs_34);
  meshes["stairs"] = mesh_stairs_34;
  colliders["stairs"] = {"type": "box", "offset": [0, 0, 0], "scale": [4.2, 0.82, 2.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["stairs"] ??= [];
  destructionGroups["stairs"].push(node_stairs_34);
  const socket_stairs_assembly_origin_0 = new THREE.Object3D();
  socket_stairs_assembly_origin_0.name = "assembly-origin";
  socket_stairs_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_stairs_assembly_origin_0.rotation.set(0, 0, 0);
  socket_stairs_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_stairs_34.add(socket_stairs_assembly_origin_0);
  sockets["stairs:assembly-origin"] = socket_stairs_assembly_origin_0;

  const endpoint_pavement_35 = makeAttachmentEndpoint(null);
  const node_pavement_35 = new THREE.Group();
  node_pavement_35.name = "\u524d\u65b9\u4eba\u884c\u9053__pivot";
  node_pavement_35.scale.set(1, 1, 1);
  if (endpoint_pavement_35) {
    node_pavement_35.position.copy(endpoint_pavement_35.start);
    node_pavement_35.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_pavement_35.position.set(0.0, 0.065, 6.46);
    node_pavement_35.rotation.set(0.0, 0.0, 0.0);
  }
  node_pavement_35.userData.sculptComponent = {"id": "pavement", "name": "前方人行道", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "pavement", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 27, "height": 0.13, "depth": 1.7}, "transform": {"position": [0, 0.065, 6.46], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [27, 0.13, 1.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "pavement", "seamRefs": [], "detachableFragments": ["pavement"], "breakImpulse": 0.0, "debrisMaterial": "paving"}}, "material": "paving", "materialLayers": ["paving"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "pavement-shape", "type": "raised ridge", "placement": [0, 0.065, 6.46], "size": [27, 0.13, 1.7], "geometryEffect": "pavement", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["前方人行道"], "fidelityTier": "structural-pass", "campus": {"kind": "pavement", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(250, 236, 219, 1)", "secondaryAlbedo": "rgba(250, 236, 219, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_pavement_35.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [27, 0.13, 1.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "pavement", "seamRefs": [], "detachableFragments": ["pavement"], "breakImpulse": 0.0, "debrisMaterial": "paving"}};
  (nodes["root"] ?? root).add(node_pavement_35);
  nodes["pavement"] = node_pavement_35;
  const mesh_pavement_35Geometry = endpoint_pavement_35
    ? new THREE.CylinderGeometry(endpoint_pavement_35.endRadius, endpoint_pavement_35.baseRadius, endpoint_pavement_35.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_pavement_35) {
    mesh_pavement_35Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_pavement_35 = new THREE.Mesh(
    mesh_pavement_35Geometry,
    materialMap["paving"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_pavement_35.name = "\u524d\u65b9\u4eba\u884c\u9053";
  if (endpoint_pavement_35) {
    mesh_pavement_35.position.copy(endpoint_pavement_35.midpoint);
    mesh_pavement_35.quaternion.copy(endpoint_pavement_35.quaternion);
  }
  mesh_pavement_35.castShadow = options.castShadow ?? true;
  mesh_pavement_35.receiveShadow = options.receiveShadow ?? true;
  mesh_pavement_35.userData.sculptComponent = {"id": "pavement", "name": "前方人行道", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "pavement", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 27, "height": 0.13, "depth": 1.7}, "transform": {"position": [0, 0.065, 6.46], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [27, 0.13, 1.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "pavement", "seamRefs": [], "detachableFragments": ["pavement"], "breakImpulse": 0.0, "debrisMaterial": "paving"}}, "material": "paving", "materialLayers": ["paving"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "pavement-shape", "type": "raised ridge", "placement": [0, 0.065, 6.46], "size": [27, 0.13, 1.7], "geometryEffect": "pavement", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["前方人行道"], "fidelityTier": "structural-pass", "campus": {"kind": "pavement", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(250, 236, 219, 1)", "secondaryAlbedo": "rgba(250, 236, 219, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_pavement_35.add(mesh_pavement_35);
  meshes["pavement"] = mesh_pavement_35;
  colliders["pavement"] = {"type": "box", "offset": [0, 0, 0], "scale": [27, 0.13, 1.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["pavement"] ??= [];
  destructionGroups["pavement"].push(node_pavement_35);
  const socket_pavement_assembly_origin_0 = new THREE.Object3D();
  socket_pavement_assembly_origin_0.name = "assembly-origin";
  socket_pavement_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_pavement_assembly_origin_0.rotation.set(0, 0, 0);
  socket_pavement_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_pavement_35.add(socket_pavement_assembly_origin_0);
  sockets["pavement:assembly-origin"] = socket_pavement_assembly_origin_0;

  const endpoint_road_36 = makeAttachmentEndpoint(null);
  const node_road_36 = new THREE.Group();
  node_road_36.name = "\u6821\u9580\u524d\u9053\u8def__pivot";
  node_road_36.scale.set(1, 1, 1);
  if (endpoint_road_36) {
    node_road_36.position.copy(endpoint_road_36.start);
    node_road_36.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_road_36.position.set(0.0, 0.12, 7.65);
    node_road_36.rotation.set(0.0, 0.0, 0.0);
  }
  node_road_36.userData.sculptComponent = {"id": "road", "name": "校門前道路", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "road", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 26.8, "height": 0.06, "depth": 1.8}, "transform": {"position": [0, 0.12, 7.65], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.06, 2.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "road", "seamRefs": [], "detachableFragments": ["road"], "breakImpulse": 0.0, "debrisMaterial": "road"}}, "material": "road", "materialLayers": ["road"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "road-shape", "type": "raised ridge", "placement": [0, 0.025, 7.9], "size": [26.8, 0.06, 2.7], "geometryEffect": "road", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["校門前道路"], "fidelityTier": "blockout", "campus": {"kind": "road", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(209, 191, 175, 1)", "secondaryAlbedo": "rgba(209, 191, 175, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_road_36.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.06, 2.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "road", "seamRefs": [], "detachableFragments": ["road"], "breakImpulse": 0.0, "debrisMaterial": "road"}};
  (nodes["root"] ?? root).add(node_road_36);
  nodes["road"] = node_road_36;
  const mesh_road_36Geometry = endpoint_road_36
    ? new THREE.CylinderGeometry(endpoint_road_36.endRadius, endpoint_road_36.baseRadius, endpoint_road_36.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_road_36) {
    mesh_road_36Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_road_36 = new THREE.Mesh(
    mesh_road_36Geometry,
    materialMap["road"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_road_36.name = "\u6821\u9580\u524d\u9053\u8def";
  if (endpoint_road_36) {
    mesh_road_36.position.copy(endpoint_road_36.midpoint);
    mesh_road_36.quaternion.copy(endpoint_road_36.quaternion);
  }
  mesh_road_36.castShadow = options.castShadow ?? true;
  mesh_road_36.receiveShadow = options.receiveShadow ?? true;
  mesh_road_36.userData.sculptComponent = {"id": "road", "name": "校門前道路", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "road", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 26.8, "height": 0.06, "depth": 1.8}, "transform": {"position": [0, 0.12, 7.65], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.06, 2.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "road", "seamRefs": [], "detachableFragments": ["road"], "breakImpulse": 0.0, "debrisMaterial": "road"}}, "material": "road", "materialLayers": ["road"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "road-shape", "type": "raised ridge", "placement": [0, 0.025, 7.9], "size": [26.8, 0.06, 2.7], "geometryEffect": "road", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["校門前道路"], "fidelityTier": "blockout", "campus": {"kind": "road", "stage": 0}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(209, 191, 175, 1)", "secondaryAlbedo": "rgba(209, 191, 175, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_road_36.add(mesh_road_36);
  meshes["road"] = mesh_road_36;
  colliders["road"] = {"type": "box", "offset": [0, 0, 0], "scale": [26.8, 0.06, 2.7], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["road"] ??= [];
  destructionGroups["road"].push(node_road_36);
  const socket_road_assembly_origin_0 = new THREE.Object3D();
  socket_road_assembly_origin_0.name = "assembly-origin";
  socket_road_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_road_assembly_origin_0.rotation.set(0, 0, 0);
  socket_road_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_road_36.add(socket_road_assembly_origin_0);
  sockets["road:assembly-origin"] = socket_road_assembly_origin_0;

  const endpoint_roof_dormers_37 = makeAttachmentEndpoint(null);
  const node_roof_dormers_37 = new THREE.Group();
  node_roof_dormers_37.name = "\u5165\u53e3\u56db\u8001\u864e\u7a97__pivot";
  node_roof_dormers_37.scale.set(1, 1, 1);
  if (endpoint_roof_dormers_37) {
    node_roof_dormers_37.position.copy(endpoint_roof_dormers_37.start);
    node_roof_dormers_37.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_roof_dormers_37.position.set(1.0, 3.65, 4.08);
    node_roof_dormers_37.rotation.set(0.0, 0.0, 0.0);
  }
  node_roof_dormers_37.userData.sculptComponent = {"id": "roof-dormers", "name": "入口四老虎窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "dormers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 8.4, "height": 0.88, "depth": 0.74}, "transform": {"position": [1.0, 3.65, 4.08], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 0.88, 0.74], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "roof-dormers", "seamRefs": [], "detachableFragments": ["roof-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "roof-dormers-shape", "type": "raised ridge", "placement": [0, 3.8, 4.08], "size": [8.4, 0.88, 0.74], "geometryEffect": "dormers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["入口四老虎窗"], "fidelityTier": "structural-pass", "campus": {"kind": "dormers", "stage": 1, "count": 4}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_roof_dormers_37.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 0.88, 0.74], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "roof-dormers", "seamRefs": [], "detachableFragments": ["roof-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_roof_dormers_37);
  nodes["roof-dormers"] = node_roof_dormers_37;
  const mesh_roof_dormers_37Geometry = endpoint_roof_dormers_37
    ? new THREE.CylinderGeometry(endpoint_roof_dormers_37.endRadius, endpoint_roof_dormers_37.baseRadius, endpoint_roof_dormers_37.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_roof_dormers_37) {
    mesh_roof_dormers_37Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_roof_dormers_37 = new THREE.Mesh(
    mesh_roof_dormers_37Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_roof_dormers_37.name = "\u5165\u53e3\u56db\u8001\u864e\u7a97";
  if (endpoint_roof_dormers_37) {
    mesh_roof_dormers_37.position.copy(endpoint_roof_dormers_37.midpoint);
    mesh_roof_dormers_37.quaternion.copy(endpoint_roof_dormers_37.quaternion);
  }
  mesh_roof_dormers_37.castShadow = options.castShadow ?? true;
  mesh_roof_dormers_37.receiveShadow = options.receiveShadow ?? true;
  mesh_roof_dormers_37.userData.sculptComponent = {"id": "roof-dormers", "name": "入口四老虎窗", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "dormers", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 8.4, "height": 0.88, "depth": 0.74}, "transform": {"position": [1.0, 3.65, 4.08], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 0.88, 0.74], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "roof-dormers", "seamRefs": [], "detachableFragments": ["roof-dormers"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "roof-dormers-shape", "type": "raised ridge", "placement": [0, 3.8, 4.08], "size": [8.4, 0.88, 0.74], "geometryEffect": "dormers", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["入口四老虎窗"], "fidelityTier": "structural-pass", "campus": {"kind": "dormers", "stage": 1, "count": 4}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_roof_dormers_37.add(mesh_roof_dormers_37);
  meshes["roof-dormers"] = mesh_roof_dormers_37;
  colliders["roof-dormers"] = {"type": "box", "offset": [0, 0, 0], "scale": [8.4, 0.88, 0.74], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["roof-dormers"] ??= [];
  destructionGroups["roof-dormers"].push(node_roof_dormers_37);
  const socket_roof_dormers_assembly_origin_0 = new THREE.Object3D();
  socket_roof_dormers_assembly_origin_0.name = "assembly-origin";
  socket_roof_dormers_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_roof_dormers_assembly_origin_0.rotation.set(0, 0, 0);
  socket_roof_dormers_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_roof_dormers_37.add(socket_roof_dormers_assembly_origin_0);
  sockets["roof-dormers:assembly-origin"] = socket_roof_dormers_assembly_origin_0;

  const endpoint_central_parapet_38 = makeAttachmentEndpoint(null);
  const node_central_parapet_38 = new THREE.Group();
  node_central_parapet_38.name = "\u4e2d\u592e\u5c4b\u9802\u570d\u7246__pivot";
  node_central_parapet_38.scale.set(1, 1, 1);
  if (endpoint_central_parapet_38) {
    node_central_parapet_38.position.copy(endpoint_central_parapet_38.start);
    node_central_parapet_38.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_central_parapet_38.position.set(1.0, 10.34, -1.7);
    node_central_parapet_38.rotation.set(0.0, 0.0, 0.0);
  }
  node_central_parapet_38.userData.sculptComponent = {"id": "central-parapet", "name": "中央屋頂圍牆", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "parapet", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.4, "height": 0.33, "depth": 3.6}, "transform": {"position": [1.0, 10.34, -1.7], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.4, 0.33, 3.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-parapet", "seamRefs": [], "detachableFragments": ["central-parapet"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-parapet-shape", "type": "raised ridge", "placement": [0, 10.49, -1.7], "size": [4.4, 0.33, 3.6], "geometryEffect": "parapet", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央屋頂圍牆"], "fidelityTier": "structural-pass", "campus": {"kind": "parapet", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_parapet_38.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.4, 0.33, 3.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-parapet", "seamRefs": [], "detachableFragments": ["central-parapet"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_central_parapet_38);
  nodes["central-parapet"] = node_central_parapet_38;
  const mesh_central_parapet_38Geometry = endpoint_central_parapet_38
    ? new THREE.CylinderGeometry(endpoint_central_parapet_38.endRadius, endpoint_central_parapet_38.baseRadius, endpoint_central_parapet_38.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_central_parapet_38) {
    mesh_central_parapet_38Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_central_parapet_38 = new THREE.Mesh(
    mesh_central_parapet_38Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_central_parapet_38.name = "\u4e2d\u592e\u5c4b\u9802\u570d\u7246";
  if (endpoint_central_parapet_38) {
    mesh_central_parapet_38.position.copy(endpoint_central_parapet_38.midpoint);
    mesh_central_parapet_38.quaternion.copy(endpoint_central_parapet_38.quaternion);
  }
  mesh_central_parapet_38.castShadow = options.castShadow ?? true;
  mesh_central_parapet_38.receiveShadow = options.receiveShadow ?? true;
  mesh_central_parapet_38.userData.sculptComponent = {"id": "central-parapet", "name": "中央屋頂圍牆", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "parapet", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 4.4, "height": 0.33, "depth": 3.6}, "transform": {"position": [1.0, 10.34, -1.7], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [4.4, 0.33, 3.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "central-parapet", "seamRefs": [], "detachableFragments": ["central-parapet"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "central-parapet-shape", "type": "raised ridge", "placement": [0, 10.49, -1.7], "size": [4.4, 0.33, 3.6], "geometryEffect": "parapet", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["中央屋頂圍牆"], "fidelityTier": "structural-pass", "campus": {"kind": "parapet", "stage": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_central_parapet_38.add(mesh_central_parapet_38);
  meshes["central-parapet"] = mesh_central_parapet_38;
  colliders["central-parapet"] = {"type": "box", "offset": [0, 0, 0], "scale": [4.4, 0.33, 3.6], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["central-parapet"] ??= [];
  destructionGroups["central-parapet"].push(node_central_parapet_38);
  const socket_central_parapet_assembly_origin_0 = new THREE.Object3D();
  socket_central_parapet_assembly_origin_0.name = "assembly-origin";
  socket_central_parapet_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_central_parapet_assembly_origin_0.rotation.set(0, 0, 0);
  socket_central_parapet_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_central_parapet_38.add(socket_central_parapet_assembly_origin_0);
  sockets["central-parapet:assembly-origin"] = socket_central_parapet_assembly_origin_0;

  const endpoint_front_plaque_39 = makeAttachmentEndpoint(null);
  const node_front_plaque_39 = new THREE.Group();
  node_front_plaque_39.name = "\u671d\u967d\u79d1\u6280\u5927\u5b78\u9298\u724c__pivot";
  node_front_plaque_39.scale.set(1, 1, 1);
  if (endpoint_front_plaque_39) {
    node_front_plaque_39.position.copy(endpoint_front_plaque_39.start);
    node_front_plaque_39.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_front_plaque_39.position.set(0.0, -0.5, 8.83);
    node_front_plaque_39.rotation.set(0.0, 0.0, 0.0);
  }
  node_front_plaque_39.userData.sculptComponent = {"id": "front-plaque", "name": "朝陽科技大學銘牌", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "plaque", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 5.7, "height": 0.83, "depth": 0.2}, "transform": {"position": [0, -0.5, 8.83], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.7, 0.83, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "front-plaque", "seamRefs": [], "detachableFragments": ["front-plaque"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "front-plaque-shape", "type": "raised ridge", "placement": [0, -0.5, 8.83], "size": [5.7, 0.83, 0.2], "geometryEffect": "plaque", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["朝陽科技大學銘牌"], "fidelityTier": "form-refinement", "campus": {"kind": "plaque", "stage": 2}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_front_plaque_39.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.7, 0.83, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "front-plaque", "seamRefs": [], "detachableFragments": ["front-plaque"], "breakImpulse": 0.0, "debrisMaterial": "trim"}};
  (nodes["root"] ?? root).add(node_front_plaque_39);
  nodes["front-plaque"] = node_front_plaque_39;
  const mesh_front_plaque_39Geometry = endpoint_front_plaque_39
    ? new THREE.CylinderGeometry(endpoint_front_plaque_39.endRadius, endpoint_front_plaque_39.baseRadius, endpoint_front_plaque_39.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_front_plaque_39) {
    mesh_front_plaque_39Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_front_plaque_39 = new THREE.Mesh(
    mesh_front_plaque_39Geometry,
    materialMap["trim"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_front_plaque_39.name = "\u671d\u967d\u79d1\u6280\u5927\u5b78\u9298\u724c";
  if (endpoint_front_plaque_39) {
    mesh_front_plaque_39.position.copy(endpoint_front_plaque_39.midpoint);
    mesh_front_plaque_39.quaternion.copy(endpoint_front_plaque_39.quaternion);
  }
  mesh_front_plaque_39.castShadow = options.castShadow ?? true;
  mesh_front_plaque_39.receiveShadow = options.receiveShadow ?? true;
  mesh_front_plaque_39.userData.sculptComponent = {"id": "front-plaque", "name": "朝陽科技大學銘牌", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "plaque", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 5.7, "height": 0.83, "depth": 0.2}, "transform": {"position": [0, -0.5, 8.83], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [5.7, 0.83, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "front-plaque", "seamRefs": [], "detachableFragments": ["front-plaque"], "breakImpulse": 0.0, "debrisMaterial": "trim"}}, "material": "trim", "materialLayers": ["trim"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "front-plaque-shape", "type": "raised ridge", "placement": [0, -0.5, 8.83], "size": [5.7, 0.83, 0.2], "geometryEffect": "plaque", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["朝陽科技大學銘牌"], "fidelityTier": "form-refinement", "campus": {"kind": "plaque", "stage": 2}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(239, 215, 188, 1)", "secondaryAlbedo": "rgba(239, 215, 188, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_front_plaque_39.add(mesh_front_plaque_39);
  meshes["front-plaque"] = mesh_front_plaque_39;
  colliders["front-plaque"] = {"type": "box", "offset": [0, 0, 0], "scale": [5.7, 0.83, 0.2], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["front-plaque"] ??= [];
  destructionGroups["front-plaque"].push(node_front_plaque_39);
  const socket_front_plaque_assembly_origin_0 = new THREE.Object3D();
  socket_front_plaque_assembly_origin_0.name = "assembly-origin";
  socket_front_plaque_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_front_plaque_assembly_origin_0.rotation.set(0, 0, 0);
  socket_front_plaque_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_front_plaque_39.add(socket_front_plaque_assembly_origin_0);
  sockets["front-plaque:assembly-origin"] = socket_front_plaque_assembly_origin_0;

  const endpoint_west_hedges_40 = makeAttachmentEndpoint(null);
  const node_west_hedges_40 = new THREE.Group();
  node_west_hedges_40.name = "\u66f2\u7dda\u4fee\u526a\u7da0\u7c6c__pivot";
  node_west_hedges_40.scale.set(1, 1, 1);
  if (endpoint_west_hedges_40) {
    node_west_hedges_40.position.copy(endpoint_west_hedges_40.start);
    node_west_hedges_40.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_hedges_40.position.set(-6.3, 0.36, 4.6);
    node_west_hedges_40.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_hedges_40.userData.sculptComponent = {"id": "west-hedges", "name": "曲線修剪綠籬", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hedges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.0, "height": 0.7, "depth": 2.35}, "transform": {"position": [-6.3, 0.36, 4.6], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-hedges", "seamRefs": [], "detachableFragments": ["west-hedges"], "breakImpulse": 0.0, "debrisMaterial": "grass"}}, "material": "grass", "materialLayers": ["grass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-hedges-shape", "type": "raised ridge", "placement": [-6.3, 0.36, 4.6], "size": [7.0, 0.7, 2.35], "geometryEffect": "hedges", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["曲線修剪綠籬"], "fidelityTier": "structural-pass", "campus": {"kind": "hedges", "stage": 1, "side": -1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(176, 173, 60, 1)", "secondaryAlbedo": "rgba(176, 173, 60, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_hedges_40.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-hedges", "seamRefs": [], "detachableFragments": ["west-hedges"], "breakImpulse": 0.0, "debrisMaterial": "grass"}};
  (nodes["root"] ?? root).add(node_west_hedges_40);
  nodes["west-hedges"] = node_west_hedges_40;
  const mesh_west_hedges_40Geometry = endpoint_west_hedges_40
    ? new THREE.CylinderGeometry(endpoint_west_hedges_40.endRadius, endpoint_west_hedges_40.baseRadius, endpoint_west_hedges_40.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_west_hedges_40) {
    mesh_west_hedges_40Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_hedges_40 = new THREE.Mesh(
    mesh_west_hedges_40Geometry,
    materialMap["grass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_hedges_40.name = "\u66f2\u7dda\u4fee\u526a\u7da0\u7c6c";
  if (endpoint_west_hedges_40) {
    mesh_west_hedges_40.position.copy(endpoint_west_hedges_40.midpoint);
    mesh_west_hedges_40.quaternion.copy(endpoint_west_hedges_40.quaternion);
  }
  mesh_west_hedges_40.castShadow = options.castShadow ?? true;
  mesh_west_hedges_40.receiveShadow = options.receiveShadow ?? true;
  mesh_west_hedges_40.userData.sculptComponent = {"id": "west-hedges", "name": "曲線修剪綠籬", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hedges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.0, "height": 0.7, "depth": 2.35}, "transform": {"position": [-6.3, 0.36, 4.6], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-hedges", "seamRefs": [], "detachableFragments": ["west-hedges"], "breakImpulse": 0.0, "debrisMaterial": "grass"}}, "material": "grass", "materialLayers": ["grass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-hedges-shape", "type": "raised ridge", "placement": [-6.3, 0.36, 4.6], "size": [7.0, 0.7, 2.35], "geometryEffect": "hedges", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["曲線修剪綠籬"], "fidelityTier": "structural-pass", "campus": {"kind": "hedges", "stage": 1, "side": -1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(176, 173, 60, 1)", "secondaryAlbedo": "rgba(176, 173, 60, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_hedges_40.add(mesh_west_hedges_40);
  meshes["west-hedges"] = mesh_west_hedges_40;
  colliders["west-hedges"] = {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-hedges"] ??= [];
  destructionGroups["west-hedges"].push(node_west_hedges_40);
  const socket_west_hedges_assembly_origin_0 = new THREE.Object3D();
  socket_west_hedges_assembly_origin_0.name = "assembly-origin";
  socket_west_hedges_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_hedges_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_hedges_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_hedges_40.add(socket_west_hedges_assembly_origin_0);
  sockets["west-hedges:assembly-origin"] = socket_west_hedges_assembly_origin_0;

  const endpoint_west_tree_0_41 = makeAttachmentEndpoint(null);
  const node_west_tree_0_41 = new THREE.Group();
  node_west_tree_0_41.name = "\u5206\u5c64\u95ca\u8449\u6a39__pivot";
  node_west_tree_0_41.scale.set(1, 1, 1);
  if (endpoint_west_tree_0_41) {
    node_west_tree_0_41.position.copy(endpoint_west_tree_0_41.start);
    node_west_tree_0_41.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_tree_0_41.position.set(-10.5, 0.3, -4.4);
    node_west_tree_0_41.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_tree_0_41.userData.sculptComponent = {"id": "west-tree-0", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.8, "depth": 3.4}, "transform": {"position": [-10.5, 0.3, -4.4], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-0", "seamRefs": [], "detachableFragments": ["west-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-0-shape", "type": "raised ridge", "placement": [-10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 20}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_tree_0_41.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-0", "seamRefs": [], "detachableFragments": ["west-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_west_tree_0_41);
  nodes["west-tree-0"] = node_west_tree_0_41;
  const mesh_west_tree_0_41Geometry = endpoint_west_tree_0_41
    ? new THREE.CylinderGeometry(endpoint_west_tree_0_41.endRadius, endpoint_west_tree_0_41.baseRadius, endpoint_west_tree_0_41.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_west_tree_0_41) {
    mesh_west_tree_0_41Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_tree_0_41 = new THREE.Mesh(
    mesh_west_tree_0_41Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_tree_0_41.name = "\u5206\u5c64\u95ca\u8449\u6a39";
  if (endpoint_west_tree_0_41) {
    mesh_west_tree_0_41.position.copy(endpoint_west_tree_0_41.midpoint);
    mesh_west_tree_0_41.quaternion.copy(endpoint_west_tree_0_41.quaternion);
  }
  mesh_west_tree_0_41.castShadow = options.castShadow ?? true;
  mesh_west_tree_0_41.receiveShadow = options.receiveShadow ?? true;
  mesh_west_tree_0_41.userData.sculptComponent = {"id": "west-tree-0", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.8, "depth": 3.4}, "transform": {"position": [-10.5, 0.3, -4.4], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-0", "seamRefs": [], "detachableFragments": ["west-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-0-shape", "type": "raised ridge", "placement": [-10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 20}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_tree_0_41.add(mesh_west_tree_0_41);
  meshes["west-tree-0"] = mesh_west_tree_0_41;
  colliders["west-tree-0"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-tree-0"] ??= [];
  destructionGroups["west-tree-0"].push(node_west_tree_0_41);
  const socket_west_tree_0_assembly_origin_0 = new THREE.Object3D();
  socket_west_tree_0_assembly_origin_0.name = "assembly-origin";
  socket_west_tree_0_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_tree_0_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_tree_0_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_tree_0_41.add(socket_west_tree_0_assembly_origin_0);
  sockets["west-tree-0:assembly-origin"] = socket_west_tree_0_assembly_origin_0;

  const endpoint_west_tree_1_42 = makeAttachmentEndpoint(null);
  const node_west_tree_1_42 = new THREE.Group();
  node_west_tree_1_42.name = "\u5206\u5c64\u95ca\u8449\u6a39__pivot";
  node_west_tree_1_42.scale.set(1, 1, 1);
  if (endpoint_west_tree_1_42) {
    node_west_tree_1_42.position.copy(endpoint_west_tree_1_42.start);
    node_west_tree_1_42.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_tree_1_42.position.set(-10.799999999999999, 0.3, -1.45);
    node_west_tree_1_42.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_tree_1_42.userData.sculptComponent = {"id": "west-tree-1", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.4, "depth": 3.4}, "transform": {"position": [-10.799999999999999, 0.3, -1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-1", "seamRefs": [], "detachableFragments": ["west-tree-1"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-1-shape", "type": "raised ridge", "placement": [-10.799999999999999, 0.3, -1.45], "size": [3.4, 6.4, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 21}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_tree_1_42.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-1", "seamRefs": [], "detachableFragments": ["west-tree-1"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_west_tree_1_42);
  nodes["west-tree-1"] = node_west_tree_1_42;
  const mesh_west_tree_1_42Geometry = endpoint_west_tree_1_42
    ? new THREE.CylinderGeometry(endpoint_west_tree_1_42.endRadius, endpoint_west_tree_1_42.baseRadius, endpoint_west_tree_1_42.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_west_tree_1_42) {
    mesh_west_tree_1_42Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_tree_1_42 = new THREE.Mesh(
    mesh_west_tree_1_42Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_tree_1_42.name = "\u5206\u5c64\u95ca\u8449\u6a39";
  if (endpoint_west_tree_1_42) {
    mesh_west_tree_1_42.position.copy(endpoint_west_tree_1_42.midpoint);
    mesh_west_tree_1_42.quaternion.copy(endpoint_west_tree_1_42.quaternion);
  }
  mesh_west_tree_1_42.castShadow = options.castShadow ?? true;
  mesh_west_tree_1_42.receiveShadow = options.receiveShadow ?? true;
  mesh_west_tree_1_42.userData.sculptComponent = {"id": "west-tree-1", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.4, "depth": 3.4}, "transform": {"position": [-10.799999999999999, 0.3, -1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-1", "seamRefs": [], "detachableFragments": ["west-tree-1"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-1-shape", "type": "raised ridge", "placement": [-10.799999999999999, 0.3, -1.45], "size": [3.4, 6.4, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 21}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_tree_1_42.add(mesh_west_tree_1_42);
  meshes["west-tree-1"] = mesh_west_tree_1_42;
  colliders["west-tree-1"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-tree-1"] ??= [];
  destructionGroups["west-tree-1"].push(node_west_tree_1_42);
  const socket_west_tree_1_assembly_origin_0 = new THREE.Object3D();
  socket_west_tree_1_assembly_origin_0.name = "assembly-origin";
  socket_west_tree_1_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_tree_1_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_tree_1_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_tree_1_42.add(socket_west_tree_1_assembly_origin_0);
  sockets["west-tree-1:assembly-origin"] = socket_west_tree_1_assembly_origin_0;

  const endpoint_west_tree_2_43 = makeAttachmentEndpoint(null);
  const node_west_tree_2_43 = new THREE.Group();
  node_west_tree_2_43.name = "\u5206\u5c64\u95ca\u8449\u6a39__pivot";
  node_west_tree_2_43.scale.set(1, 1, 1);
  if (endpoint_west_tree_2_43) {
    node_west_tree_2_43.position.copy(endpoint_west_tree_2_43.start);
    node_west_tree_2_43.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_tree_2_43.position.set(-10.5, 0.3, 1.45);
    node_west_tree_2_43.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_tree_2_43.userData.sculptComponent = {"id": "west-tree-2", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 5.1, "depth": 3.4}, "transform": {"position": [-10.5, 0.3, 1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-2", "seamRefs": [], "detachableFragments": ["west-tree-2"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-2-shape", "type": "raised ridge", "placement": [-10.5, 0.3, 1.45], "size": [3.4, 5.1, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 22}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_tree_2_43.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-2", "seamRefs": [], "detachableFragments": ["west-tree-2"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_west_tree_2_43);
  nodes["west-tree-2"] = node_west_tree_2_43;
  const mesh_west_tree_2_43Geometry = endpoint_west_tree_2_43
    ? new THREE.CylinderGeometry(endpoint_west_tree_2_43.endRadius, endpoint_west_tree_2_43.baseRadius, endpoint_west_tree_2_43.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_west_tree_2_43) {
    mesh_west_tree_2_43Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_tree_2_43 = new THREE.Mesh(
    mesh_west_tree_2_43Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_tree_2_43.name = "\u5206\u5c64\u95ca\u8449\u6a39";
  if (endpoint_west_tree_2_43) {
    mesh_west_tree_2_43.position.copy(endpoint_west_tree_2_43.midpoint);
    mesh_west_tree_2_43.quaternion.copy(endpoint_west_tree_2_43.quaternion);
  }
  mesh_west_tree_2_43.castShadow = options.castShadow ?? true;
  mesh_west_tree_2_43.receiveShadow = options.receiveShadow ?? true;
  mesh_west_tree_2_43.userData.sculptComponent = {"id": "west-tree-2", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 5.1, "depth": 3.4}, "transform": {"position": [-10.5, 0.3, 1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-2", "seamRefs": [], "detachableFragments": ["west-tree-2"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-2-shape", "type": "raised ridge", "placement": [-10.5, 0.3, 1.45], "size": [3.4, 5.1, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 22}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_tree_2_43.add(mesh_west_tree_2_43);
  meshes["west-tree-2"] = mesh_west_tree_2_43;
  colliders["west-tree-2"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-tree-2"] ??= [];
  destructionGroups["west-tree-2"].push(node_west_tree_2_43);
  const socket_west_tree_2_assembly_origin_0 = new THREE.Object3D();
  socket_west_tree_2_assembly_origin_0.name = "assembly-origin";
  socket_west_tree_2_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_tree_2_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_tree_2_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_tree_2_43.add(socket_west_tree_2_assembly_origin_0);
  sockets["west-tree-2:assembly-origin"] = socket_west_tree_2_assembly_origin_0;

  const endpoint_east_hedges_44 = makeAttachmentEndpoint(null);
  const node_east_hedges_44 = new THREE.Group();
  node_east_hedges_44.name = "\u66f2\u7dda\u4fee\u526a\u7da0\u7c6c__pivot";
  node_east_hedges_44.scale.set(1, 1, 1);
  if (endpoint_east_hedges_44) {
    node_east_hedges_44.position.copy(endpoint_east_hedges_44.start);
    node_east_hedges_44.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_hedges_44.position.set(6.3, 0.36, 4.6);
    node_east_hedges_44.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_hedges_44.userData.sculptComponent = {"id": "east-hedges", "name": "曲線修剪綠籬", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hedges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.0, "height": 0.7, "depth": 2.35}, "transform": {"position": [6.3, 0.36, 4.6], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-hedges", "seamRefs": [], "detachableFragments": ["east-hedges"], "breakImpulse": 0.0, "debrisMaterial": "grass"}}, "material": "grass", "materialLayers": ["grass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-hedges-shape", "type": "raised ridge", "placement": [6.3, 0.36, 4.6], "size": [7.0, 0.7, 2.35], "geometryEffect": "hedges", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["曲線修剪綠籬"], "fidelityTier": "structural-pass", "campus": {"kind": "hedges", "stage": 1, "side": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(176, 173, 60, 1)", "secondaryAlbedo": "rgba(176, 173, 60, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_hedges_44.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-hedges", "seamRefs": [], "detachableFragments": ["east-hedges"], "breakImpulse": 0.0, "debrisMaterial": "grass"}};
  (nodes["root"] ?? root).add(node_east_hedges_44);
  nodes["east-hedges"] = node_east_hedges_44;
  const mesh_east_hedges_44Geometry = endpoint_east_hedges_44
    ? new THREE.CylinderGeometry(endpoint_east_hedges_44.endRadius, endpoint_east_hedges_44.baseRadius, endpoint_east_hedges_44.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  if (!endpoint_east_hedges_44) {
    mesh_east_hedges_44Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_hedges_44 = new THREE.Mesh(
    mesh_east_hedges_44Geometry,
    materialMap["grass"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_hedges_44.name = "\u66f2\u7dda\u4fee\u526a\u7da0\u7c6c";
  if (endpoint_east_hedges_44) {
    mesh_east_hedges_44.position.copy(endpoint_east_hedges_44.midpoint);
    mesh_east_hedges_44.quaternion.copy(endpoint_east_hedges_44.quaternion);
  }
  mesh_east_hedges_44.castShadow = options.castShadow ?? true;
  mesh_east_hedges_44.receiveShadow = options.receiveShadow ?? true;
  mesh_east_hedges_44.userData.sculptComponent = {"id": "east-hedges", "name": "曲線修剪綠籬", "level": "meso", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "box", "topologyClass": "assembled-solid", "topologyRationale": "Discrete architectural solid with specified planar and curved boundaries", "geometryDescriptor": {"topologyIntent": "hedges", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 7.0, "height": 0.7, "depth": 2.35}, "transform": {"position": [6.3, 0.36, 4.6], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-hedges", "seamRefs": [], "detachableFragments": ["east-hedges"], "breakImpulse": 0.0, "debrisMaterial": "grass"}}, "material": "grass", "materialLayers": ["grass"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-hedges-shape", "type": "raised ridge", "placement": [6.3, 0.36, 4.6], "size": [7.0, 0.7, 2.35], "geometryEffect": "hedges", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["曲線修剪綠籬"], "fidelityTier": "structural-pass", "campus": {"kind": "hedges", "stage": 1, "side": 1}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(176, 173, 60, 1)", "secondaryAlbedo": "rgba(176, 173, 60, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_hedges_44.add(mesh_east_hedges_44);
  meshes["east-hedges"] = mesh_east_hedges_44;
  colliders["east-hedges"] = {"type": "box", "offset": [0, 0, 0], "scale": [7.0, 0.7, 2.35], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-hedges"] ??= [];
  destructionGroups["east-hedges"].push(node_east_hedges_44);
  const socket_east_hedges_assembly_origin_0 = new THREE.Object3D();
  socket_east_hedges_assembly_origin_0.name = "assembly-origin";
  socket_east_hedges_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_hedges_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_hedges_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_hedges_44.add(socket_east_hedges_assembly_origin_0);
  sockets["east-hedges:assembly-origin"] = socket_east_hedges_assembly_origin_0;

  const endpoint_east_tree_0_45 = makeAttachmentEndpoint(null);
  const node_east_tree_0_45 = new THREE.Group();
  node_east_tree_0_45.name = "\u5206\u5c64\u95ca\u8449\u6a39__pivot";
  node_east_tree_0_45.scale.set(1, 1, 1);
  if (endpoint_east_tree_0_45) {
    node_east_tree_0_45.position.copy(endpoint_east_tree_0_45.start);
    node_east_tree_0_45.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_tree_0_45.position.set(10.5, 0.3, -4.4);
    node_east_tree_0_45.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_tree_0_45.userData.sculptComponent = {"id": "east-tree-0", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 7.8, "depth": 3.4}, "transform": {"position": [10.5, 0.3, -4.4], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-0", "seamRefs": [], "detachableFragments": ["east-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-0-shape", "type": "raised ridge", "placement": [10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 24}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_tree_0_45.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-0", "seamRefs": [], "detachableFragments": ["east-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_east_tree_0_45);
  nodes["east-tree-0"] = node_east_tree_0_45;
  const mesh_east_tree_0_45Geometry = endpoint_east_tree_0_45
    ? new THREE.CylinderGeometry(endpoint_east_tree_0_45.endRadius, endpoint_east_tree_0_45.baseRadius, endpoint_east_tree_0_45.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_east_tree_0_45) {
    mesh_east_tree_0_45Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_tree_0_45 = new THREE.Mesh(
    mesh_east_tree_0_45Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_tree_0_45.name = "\u5206\u5c64\u95ca\u8449\u6a39";
  if (endpoint_east_tree_0_45) {
    mesh_east_tree_0_45.position.copy(endpoint_east_tree_0_45.midpoint);
    mesh_east_tree_0_45.quaternion.copy(endpoint_east_tree_0_45.quaternion);
  }
  mesh_east_tree_0_45.castShadow = options.castShadow ?? true;
  mesh_east_tree_0_45.receiveShadow = options.receiveShadow ?? true;
  mesh_east_tree_0_45.userData.sculptComponent = {"id": "east-tree-0", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 7.8, "depth": 3.4}, "transform": {"position": [10.5, 0.3, -4.4], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-0", "seamRefs": [], "detachableFragments": ["east-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-0-shape", "type": "raised ridge", "placement": [10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 24}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_tree_0_45.add(mesh_east_tree_0_45);
  meshes["east-tree-0"] = mesh_east_tree_0_45;
  colliders["east-tree-0"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-tree-0"] ??= [];
  destructionGroups["east-tree-0"].push(node_east_tree_0_45);
  const socket_east_tree_0_assembly_origin_0 = new THREE.Object3D();
  socket_east_tree_0_assembly_origin_0.name = "assembly-origin";
  socket_east_tree_0_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_tree_0_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_tree_0_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_tree_0_45.add(socket_east_tree_0_assembly_origin_0);
  sockets["east-tree-0:assembly-origin"] = socket_east_tree_0_assembly_origin_0;

  const endpoint_east_tree_1_46 = makeAttachmentEndpoint(null);
  const node_east_tree_1_46 = new THREE.Group();
  node_east_tree_1_46.name = "\u5206\u5c64\u95ca\u8449\u6a39__pivot";
  node_east_tree_1_46.scale.set(1, 1, 1);
  if (endpoint_east_tree_1_46) {
    node_east_tree_1_46.position.copy(endpoint_east_tree_1_46.start);
    node_east_tree_1_46.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_tree_1_46.position.set(10.799999999999999, 0.3, -1.45);
    node_east_tree_1_46.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_tree_1_46.userData.sculptComponent = {"id": "east-tree-1", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.4, "depth": 3.4}, "transform": {"position": [10.799999999999999, 0.3, -1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-1", "seamRefs": [], "detachableFragments": ["east-tree-1"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-1-shape", "type": "raised ridge", "placement": [10.799999999999999, 0.3, -1.45], "size": [3.4, 6.4, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 25}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_tree_1_46.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-1", "seamRefs": [], "detachableFragments": ["east-tree-1"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_east_tree_1_46);
  nodes["east-tree-1"] = node_east_tree_1_46;
  const mesh_east_tree_1_46Geometry = endpoint_east_tree_1_46
    ? new THREE.CylinderGeometry(endpoint_east_tree_1_46.endRadius, endpoint_east_tree_1_46.baseRadius, endpoint_east_tree_1_46.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_east_tree_1_46) {
    mesh_east_tree_1_46Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_tree_1_46 = new THREE.Mesh(
    mesh_east_tree_1_46Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_tree_1_46.name = "\u5206\u5c64\u95ca\u8449\u6a39";
  if (endpoint_east_tree_1_46) {
    mesh_east_tree_1_46.position.copy(endpoint_east_tree_1_46.midpoint);
    mesh_east_tree_1_46.quaternion.copy(endpoint_east_tree_1_46.quaternion);
  }
  mesh_east_tree_1_46.castShadow = options.castShadow ?? true;
  mesh_east_tree_1_46.receiveShadow = options.receiveShadow ?? true;
  mesh_east_tree_1_46.userData.sculptComponent = {"id": "east-tree-1", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.4, "depth": 3.4}, "transform": {"position": [10.799999999999999, 0.3, -1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-1", "seamRefs": [], "detachableFragments": ["east-tree-1"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-1-shape", "type": "raised ridge", "placement": [10.799999999999999, 0.3, -1.45], "size": [3.4, 6.4, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 25}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_tree_1_46.add(mesh_east_tree_1_46);
  meshes["east-tree-1"] = mesh_east_tree_1_46;
  colliders["east-tree-1"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.4, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-tree-1"] ??= [];
  destructionGroups["east-tree-1"].push(node_east_tree_1_46);
  const socket_east_tree_1_assembly_origin_0 = new THREE.Object3D();
  socket_east_tree_1_assembly_origin_0.name = "assembly-origin";
  socket_east_tree_1_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_tree_1_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_tree_1_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_tree_1_46.add(socket_east_tree_1_assembly_origin_0);
  sockets["east-tree-1:assembly-origin"] = socket_east_tree_1_assembly_origin_0;

  const endpoint_east_tree_2_47 = makeAttachmentEndpoint(null);
  const node_east_tree_2_47 = new THREE.Group();
  node_east_tree_2_47.name = "\u5206\u5c64\u95ca\u8449\u6a39__pivot";
  node_east_tree_2_47.scale.set(1, 1, 1);
  if (endpoint_east_tree_2_47) {
    node_east_tree_2_47.position.copy(endpoint_east_tree_2_47.start);
    node_east_tree_2_47.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_tree_2_47.position.set(10.5, 0.3, 1.45);
    node_east_tree_2_47.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_tree_2_47.userData.sculptComponent = {"id": "east-tree-2", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 5.1, "depth": 3.4}, "transform": {"position": [10.5, 0.3, 1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-2", "seamRefs": [], "detachableFragments": ["east-tree-2"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-2-shape", "type": "raised ridge", "placement": [10.5, 0.3, 1.45], "size": [3.4, 5.1, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 26}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_tree_2_47.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-2", "seamRefs": [], "detachableFragments": ["east-tree-2"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_east_tree_2_47);
  nodes["east-tree-2"] = node_east_tree_2_47;
  const mesh_east_tree_2_47Geometry = endpoint_east_tree_2_47
    ? new THREE.CylinderGeometry(endpoint_east_tree_2_47.endRadius, endpoint_east_tree_2_47.baseRadius, endpoint_east_tree_2_47.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_east_tree_2_47) {
    mesh_east_tree_2_47Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_tree_2_47 = new THREE.Mesh(
    mesh_east_tree_2_47Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_tree_2_47.name = "\u5206\u5c64\u95ca\u8449\u6a39";
  if (endpoint_east_tree_2_47) {
    mesh_east_tree_2_47.position.copy(endpoint_east_tree_2_47.midpoint);
    mesh_east_tree_2_47.quaternion.copy(endpoint_east_tree_2_47.quaternion);
  }
  mesh_east_tree_2_47.castShadow = options.castShadow ?? true;
  mesh_east_tree_2_47.receiveShadow = options.receiveShadow ?? true;
  mesh_east_tree_2_47.userData.sculptComponent = {"id": "east-tree-2", "name": "分層闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 5.1, "depth": 3.4}, "transform": {"position": [10.5, 0.3, 1.45], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-2", "seamRefs": [], "detachableFragments": ["east-tree-2"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-2-shape", "type": "raised ridge", "placement": [10.5, 0.3, 1.45], "size": [3.4, 5.1, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 26}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_tree_2_47.add(mesh_east_tree_2_47);
  meshes["east-tree-2"] = mesh_east_tree_2_47;
  colliders["east-tree-2"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 5.1, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-tree-2"] ??= [];
  destructionGroups["east-tree-2"].push(node_east_tree_2_47);
  const socket_east_tree_2_assembly_origin_0 = new THREE.Object3D();
  socket_east_tree_2_assembly_origin_0.name = "assembly-origin";
  socket_east_tree_2_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_tree_2_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_tree_2_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_tree_2_47.add(socket_east_tree_2_assembly_origin_0);
  sockets["east-tree-2:assembly-origin"] = socket_east_tree_2_assembly_origin_0;

  const endpoint_west_rear_tree_48 = makeAttachmentEndpoint(null);
  const node_west_rear_tree_48 = new THREE.Group();
  node_west_rear_tree_48.name = "\u5f8c\u65b9\u95ca\u8449\u6a39__pivot";
  node_west_rear_tree_48.scale.set(1, 1, 1);
  if (endpoint_west_rear_tree_48) {
    node_west_rear_tree_48.position.copy(endpoint_west_rear_tree_48.start);
    node_west_rear_tree_48.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_west_rear_tree_48.position.set(-8.7, 0.3, -5.1);
    node_west_rear_tree_48.rotation.set(0.0, 0.0, 0.0);
  }
  node_west_rear_tree_48.userData.sculptComponent = {"id": "west-rear-tree", "name": "後方闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.7, "depth": 3.4}, "transform": {"position": [-8.7, 0.3, -5.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-0", "seamRefs": [], "detachableFragments": ["west-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-0-shape", "type": "raised ridge", "placement": [-10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 39}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_rear_tree_48.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-0", "seamRefs": [], "detachableFragments": ["west-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_west_rear_tree_48);
  nodes["west-rear-tree"] = node_west_rear_tree_48;
  const mesh_west_rear_tree_48Geometry = endpoint_west_rear_tree_48
    ? new THREE.CylinderGeometry(endpoint_west_rear_tree_48.endRadius, endpoint_west_rear_tree_48.baseRadius, endpoint_west_rear_tree_48.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_west_rear_tree_48) {
    mesh_west_rear_tree_48Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_west_rear_tree_48 = new THREE.Mesh(
    mesh_west_rear_tree_48Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_west_rear_tree_48.name = "\u5f8c\u65b9\u95ca\u8449\u6a39";
  if (endpoint_west_rear_tree_48) {
    mesh_west_rear_tree_48.position.copy(endpoint_west_rear_tree_48.midpoint);
    mesh_west_rear_tree_48.quaternion.copy(endpoint_west_rear_tree_48.quaternion);
  }
  mesh_west_rear_tree_48.castShadow = options.castShadow ?? true;
  mesh_west_rear_tree_48.receiveShadow = options.receiveShadow ?? true;
  mesh_west_rear_tree_48.userData.sculptComponent = {"id": "west-rear-tree", "name": "後方闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 6.7, "depth": 3.4}, "transform": {"position": [-8.7, 0.3, -5.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "west-tree-0", "seamRefs": [], "detachableFragments": ["west-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "west-tree-0-shape", "type": "raised ridge", "placement": [-10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 39}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_west_rear_tree_48.add(mesh_west_rear_tree_48);
  meshes["west-rear-tree"] = mesh_west_rear_tree_48;
  colliders["west-rear-tree"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["west-tree-0"] ??= [];
  destructionGroups["west-tree-0"].push(node_west_rear_tree_48);
  const socket_west_rear_tree_assembly_origin_0 = new THREE.Object3D();
  socket_west_rear_tree_assembly_origin_0.name = "assembly-origin";
  socket_west_rear_tree_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_west_rear_tree_assembly_origin_0.rotation.set(0, 0, 0);
  socket_west_rear_tree_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_west_rear_tree_48.add(socket_west_rear_tree_assembly_origin_0);
  sockets["west-rear-tree:assembly-origin"] = socket_west_rear_tree_assembly_origin_0;

  const endpoint_east_rear_tree_49 = makeAttachmentEndpoint(null);
  const node_east_rear_tree_49 = new THREE.Group();
  node_east_rear_tree_49.name = "\u5f8c\u65b9\u95ca\u8449\u6a39__pivot";
  node_east_rear_tree_49.scale.set(1, 1, 1);
  if (endpoint_east_rear_tree_49) {
    node_east_rear_tree_49.position.copy(endpoint_east_rear_tree_49.start);
    node_east_rear_tree_49.rotation.set(0.0, 0.0, 0.0);
  } else {
    node_east_rear_tree_49.position.set(8.7, 0.3, -5.1);
    node_east_rear_tree_49.rotation.set(0.0, 0.0, 0.0);
  }
  node_east_rear_tree_49.userData.sculptComponent = {"id": "east-rear-tree", "name": "後方闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 8.3, "depth": 3.4}, "transform": {"position": [8.7, 0.3, -5.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-0", "seamRefs": [], "detachableFragments": ["east-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-0-shape", "type": "raised ridge", "placement": [10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 41}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_rear_tree_49.userData.actionProfile = {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-0", "seamRefs": [], "detachableFragments": ["east-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}};
  (nodes["root"] ?? root).add(node_east_rear_tree_49);
  nodes["east-rear-tree"] = node_east_rear_tree_49;
  const mesh_east_rear_tree_49Geometry = endpoint_east_rear_tree_49
    ? new THREE.CylinderGeometry(endpoint_east_rear_tree_49.endRadius, endpoint_east_rear_tree_49.baseRadius, endpoint_east_rear_tree_49.length, 32, 12)
    : new THREE.SphereGeometry(0.5, 64, 40);
  if (!endpoint_east_rear_tree_49) {
    mesh_east_rear_tree_49Geometry.scale(1.0, 1.0, 1.0);
  }
  const mesh_east_rear_tree_49 = new THREE.Mesh(
    mesh_east_rear_tree_49Geometry,
    materialMap["foliage"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_east_rear_tree_49.name = "\u5f8c\u65b9\u95ca\u8449\u6a39";
  if (endpoint_east_rear_tree_49) {
    mesh_east_rear_tree_49.position.copy(endpoint_east_rear_tree_49.midpoint);
    mesh_east_rear_tree_49.quaternion.copy(endpoint_east_rear_tree_49.quaternion);
  }
  mesh_east_rear_tree_49.castShadow = options.castShadow ?? true;
  mesh_east_rear_tree_49.receiveShadow = options.receiveShadow ?? true;
  mesh_east_rear_tree_49.userData.sculptComponent = {"id": "east-rear-tree", "name": "後方闊葉樹", "level": "macro", "role": "architectural-assembly", "importance": 0.9, "confidence": 0.86, "primitive": "ellipsoid", "topologyClass": "continuous-sculpt", "topologyRationale": "Overlapping rounded botanical volumes", "geometryDescriptor": {"topologyIntent": "tree", "edgeTreatment": {"type": "bevel", "bevelRadius": 0.04, "segments": 3}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "root", "attachment": null, "dimensions": {"width": 3.4, "height": 8.3, "depth": 3.4}, "transform": {"position": [8.7, 0.3, -5.1], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static-part", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.86}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "assembly-origin", "position": [0, 0, 0]}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "east-tree-0", "seamRefs": [], "detachableFragments": ["east-tree-0"], "breakImpulse": 0.0, "debrisMaterial": "foliage"}}, "material": "foliage", "materialLayers": ["foliage"], "deformations": [], "joints": [], "seams": [], "localFeatures": [{"id": "east-tree-0-shape", "type": "raised ridge", "placement": [10.5, 0.3, -4.4], "size": [3.4, 6.8, 3.4], "geometryEffect": "tree", "materialEffect": "subtle relief shadow", "confidence": 0.86, "evidenceRefs": ["full-object"]}], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": ["分層闊葉樹"], "fidelityTier": "blockout", "campus": {"kind": "tree", "stage": 0, "seed": 41}, "colorMaterialRecipe": {"dominantAlbedo": "rgba(166, 171, 71, 1)", "secondaryAlbedo": "rgba(166, 171, 71, 1)", "materialClass": "stone", "materialClassConfidence": 0.75, "evidenceRefs": ["full-object"]}};
  node_east_rear_tree_49.add(mesh_east_rear_tree_49);
  meshes["east-rear-tree"] = mesh_east_rear_tree_49;
  colliders["east-rear-tree"] = {"type": "box", "offset": [0, 0, 0], "scale": [3.4, 6.8, 3.4], "isTrigger": false, "notes": "Relative-size bounding proxy, not structural engineering dimensions"};
  destructionGroups["east-tree-0"] ??= [];
  destructionGroups["east-tree-0"].push(node_east_rear_tree_49);
  const socket_east_rear_tree_assembly_origin_0 = new THREE.Object3D();
  socket_east_rear_tree_assembly_origin_0.name = "assembly-origin";
  socket_east_rear_tree_assembly_origin_0.position.set(0.0, 0.0, 0.0);
  socket_east_rear_tree_assembly_origin_0.rotation.set(0, 0, 0);
  socket_east_rear_tree_assembly_origin_0.userData.socket = {"id": "assembly-origin", "position": [0, 0, 0]};
  node_east_rear_tree_49.add(socket_east_rear_tree_assembly_origin_0);
  sockets["east-rear-tree:assembly-origin"] = socket_east_rear_tree_assembly_origin_0;

  // repetition system: window-grid (InstancedMesh, radial, count=30, level=meso)
  {
    const parent = nodes["root"] ?? root;
    const geo = new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
    const mat = materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
    // Contract (PLAN_1.5 WS-E): instanceScale is ABSOLUTE, in the parent pivot's
    // local units -- it is never multiplied by the parent component's own declared
    // dimensional scale. This falls out of the same fix as componentTree: the pivot
    // Group this cluster is parented to always carries identity scale (dimensions are
    // baked into that component's OWN geometry, not exposed on the Group), so an
    // instanced fastener/tooth/spoke sized [0.05, 0.05, 0.05] renders at exactly that
    // size regardless of how non-uniformly its host component is shaped, and a
    // `radial` ring's placement stays circular instead of being squashed into an
    // ellipse by a non-uniform host.
    const scl = [0.1, 0.1, 0.1];
    const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
    const radius = 0.0;
    const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
    // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
    // replacing the former per-instance Mesh clone loop (real-time perf principle).
    const cluster = new THREE.InstancedMesh(geo, mat, 30);
    const _m = new THREE.Matrix4();
    const _p = new THREE.Vector3();
    const _q = new THREE.Quaternion();
    const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
    for (let i = 0; i < 30; i++) {
      const ang = ((0.0) + (i * 360) / 30) * Math.PI / 180;
      const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
      _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
      _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      _m.compose(_p, _q, _s);
      cluster.setMatrixAt(i, _m);
    }
    cluster.instanceMatrix.needsUpdate = true;
    cluster.castShadow = options.castShadow ?? true;
    cluster.receiveShadow = options.receiveShadow ?? true;
    cluster.name = "window-grid";
    parent.add(cluster);
  }

  // repetition system: tile-grid (InstancedMesh, radial, count=900, level=meso)
  {
    const parent = nodes["root"] ?? root;
    const geo = new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
    const mat = materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
    // Contract (PLAN_1.5 WS-E): instanceScale is ABSOLUTE, in the parent pivot's
    // local units -- it is never multiplied by the parent component's own declared
    // dimensional scale. This falls out of the same fix as componentTree: the pivot
    // Group this cluster is parented to always carries identity scale (dimensions are
    // baked into that component's OWN geometry, not exposed on the Group), so an
    // instanced fastener/tooth/spoke sized [0.05, 0.05, 0.05] renders at exactly that
    // size regardless of how non-uniformly its host component is shaped, and a
    // `radial` ring's placement stays circular instead of being squashed into an
    // ellipse by a non-uniform host.
    const scl = [0.1, 0.1, 0.1];
    const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
    const radius = 0.0;
    const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
    // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
    // replacing the former per-instance Mesh clone loop (real-time perf principle).
    const cluster = new THREE.InstancedMesh(geo, mat, 900);
    const _m = new THREE.Matrix4();
    const _p = new THREE.Vector3();
    const _q = new THREE.Quaternion();
    const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
    for (let i = 0; i < 900; i++) {
      const ang = ((0.0) + (i * 360) / 900) * Math.PI / 180;
      const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
      _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
      _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      _m.compose(_p, _q, _s);
      cluster.setMatrixAt(i, _m);
    }
    cluster.instanceMatrix.needsUpdate = true;
    cluster.castShadow = options.castShadow ?? true;
    cluster.receiveShadow = options.receiveShadow ?? true;
    cluster.name = "tile-grid";
    parent.add(cluster);
  }

  // repetition system: foliage-clusters (InstancedMesh, radial, count=300, level=meso)
  {
    const parent = nodes["root"] ?? root;
    const geo = new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
    const mat = materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
    // Contract (PLAN_1.5 WS-E): instanceScale is ABSOLUTE, in the parent pivot's
    // local units -- it is never multiplied by the parent component's own declared
    // dimensional scale. This falls out of the same fix as componentTree: the pivot
    // Group this cluster is parented to always carries identity scale (dimensions are
    // baked into that component's OWN geometry, not exposed on the Group), so an
    // instanced fastener/tooth/spoke sized [0.05, 0.05, 0.05] renders at exactly that
    // size regardless of how non-uniformly its host component is shaped, and a
    // `radial` ring's placement stays circular instead of being squashed into an
    // ellipse by a non-uniform host.
    const scl = [0.1, 0.1, 0.1];
    const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
    const radius = 0.0;
    const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
    // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
    // replacing the former per-instance Mesh clone loop (real-time perf principle).
    const cluster = new THREE.InstancedMesh(geo, mat, 300);
    const _m = new THREE.Matrix4();
    const _p = new THREE.Vector3();
    const _q = new THREE.Quaternion();
    const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
    for (let i = 0; i < 300; i++) {
      const ang = ((0.0) + (i * 360) / 300) * Math.PI / 180;
      const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
      _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
      _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      _m.compose(_p, _q, _s);
      cluster.setMatrixAt(i, _m);
    }
    cluster.instanceMatrix.needsUpdate = true;
    cluster.castShadow = options.castShadow ?? true;
    cluster.receiveShadow = options.receiveShadow ?? true;
    cluster.name = "foliage-clusters";
    parent.add(cluster);
  }

  // repetition system: paving-grid (InstancedMesh, radial, count=200, level=meso)
  {
    const parent = nodes["root"] ?? root;
    const geo = new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
    const mat = materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
    // Contract (PLAN_1.5 WS-E): instanceScale is ABSOLUTE, in the parent pivot's
    // local units -- it is never multiplied by the parent component's own declared
    // dimensional scale. This falls out of the same fix as componentTree: the pivot
    // Group this cluster is parented to always carries identity scale (dimensions are
    // baked into that component's OWN geometry, not exposed on the Group), so an
    // instanced fastener/tooth/spoke sized [0.05, 0.05, 0.05] renders at exactly that
    // size regardless of how non-uniformly its host component is shaped, and a
    // `radial` ring's placement stays circular instead of being squashed into an
    // ellipse by a non-uniform host.
    const scl = [0.1, 0.1, 0.1];
    const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
    const radius = 0.0;
    const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
    // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
    // replacing the former per-instance Mesh clone loop (real-time perf principle).
    const cluster = new THREE.InstancedMesh(geo, mat, 200);
    const _m = new THREE.Matrix4();
    const _p = new THREE.Vector3();
    const _q = new THREE.Quaternion();
    const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
    for (let i = 0; i < 200; i++) {
      const ang = ((0.0) + (i * 360) / 200) * Math.PI / 180;
      const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
      _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
      _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      _m.compose(_p, _q, _s);
      cluster.setMatrixAt(i, _m);
    }
    cluster.instanceMatrix.needsUpdate = true;
    cluster.castShadow = options.castShadow ?? true;
    cluster.receiveShadow = options.receiveShadow ?? true;
    cluster.name = "paving-grid";
    parent.add(cluster);
  }

  // repetition system: arcade-rhythm (InstancedMesh, radial, count=11, level=meso)
  {
    const parent = nodes["root"] ?? root;
    const geo = new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
    const mat = materialMap["stone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 });
    // Contract (PLAN_1.5 WS-E): instanceScale is ABSOLUTE, in the parent pivot's
    // local units -- it is never multiplied by the parent component's own declared
    // dimensional scale. This falls out of the same fix as componentTree: the pivot
    // Group this cluster is parented to always carries identity scale (dimensions are
    // baked into that component's OWN geometry, not exposed on the Group), so an
    // instanced fastener/tooth/spoke sized [0.05, 0.05, 0.05] renders at exactly that
    // size regardless of how non-uniformly its host component is shaped, and a
    // `radial` ring's placement stays circular instead of being squashed into an
    // ellipse by a non-uniform host.
    const scl = [0.1, 0.1, 0.1];
    const axis = new THREE.Vector3(0.0, 0.0, 1.0).normalize();
    const radius = 0.0;
    const seed = Math.abs(axis.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const perp = new THREE.Vector3().crossVectors(axis, seed).normalize();
    // One InstancedMesh = one draw call for all repeated parts (teeth/fasteners/spokes),
    // replacing the former per-instance Mesh clone loop (real-time perf principle).
    const cluster = new THREE.InstancedMesh(geo, mat, 11);
    const _m = new THREE.Matrix4();
    const _p = new THREE.Vector3();
    const _q = new THREE.Quaternion();
    const _s = new THREE.Vector3(scl[0], scl[1], scl[2]);
    for (let i = 0; i < 11; i++) {
      const ang = ((0.0) + (i * 360) / 11) * Math.PI / 180;
      const dir = perp.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, ang));
      _p.copy(radius > 0 ? dir.clone().multiplyScalar(radius * 0.5) : new THREE.Vector3());
      _q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      _m.compose(_p, _q, _s);
      cluster.setMatrixAt(i, _m);
    }
    cluster.instanceMatrix.needsUpdate = true;
    cluster.castShadow = options.castShadow ?? true;
    cluster.receiveShadow = options.receiveShadow ?? true;
    cluster.name = "arcade-rhythm";
    parent.add(cluster);
  }

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createChaoyangClocktowerCampusLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "Chaoyang Clocktower Campus look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = ["Warm large key light from upper front-left; contact shadows fall right/back.", "Hemisphere fill cream/grey 1.2; key 3.0 with soft shadow, cool rim 0.6.", "ACES filmic tone mapping exposure 1.15, warm ivory background #f8f3e9, contact shadow under plinth."];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createChaoyangClocktowerCampusEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameChaoyangClocktowerCampusCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createChaoyangClocktowerCampusPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configureChaoyangClocktowerCampusRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createChaoyangClocktowerCampusInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
