import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { getFavoriteWhatsAppImageBuffer, getFavoriteWhatsAppImages } from './whatsapp-image-library.js';
import { getFavoriteWhatsAppStickerBuffer, getFavoriteWhatsAppStickers } from './whatsapp-sticker-library.js';

export type FavoriteWhatsAppMedia = {
  id: string;
  name: string;
  createdAt: string;
  animated: boolean;
  previewDataUrl: string;
  previewUrl: string;
};

export type WhatsAppMediaType = 'image' | 'sticker';

type StoredFavoriteWhatsAppMedia = FavoriteWhatsAppMedia & {
  stickerFileName: string;
  imageFileName: string;
};

const mediaDirectory = resolve(process.cwd(), '.data/whatsapp-media');
const mediaCatalogPath = resolve(mediaDirectory, 'favorites.json');
let mediaCatalog: StoredFavoriteWhatsAppMedia[] | null = null;

function mediaFilePath(fileName: string): string {
  if (!/^[A-Za-z0-9_-]+-(sticker\.webp|image\.jpg)$/.test(fileName)) throw new Error('Arquivo de mídia inválido.');
  return resolve(mediaDirectory, fileName);
}

async function persistCatalog(catalog: StoredFavoriteWhatsAppMedia[]): Promise<void> {
  await mkdir(mediaDirectory, { recursive: true });
  const temporaryPath = `${mediaCatalogPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(catalog, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, mediaCatalogPath);
}

async function normalizeMedia(input: Buffer): Promise<{ sticker: Buffer; image: Buffer; previewDataUrl: string; animated: boolean }> {
  if (!input.length || input.length > 1024 * 1024) throw new Error('O arquivo de mídia deve ter até 1 MB.');
  const metadata = await sharp(input, { animated: true, limitInputPixels: 40_000_000 }).metadata();
  if (!metadata.format || !['gif', 'webp', 'png', 'jpeg'].includes(metadata.format) || !metadata.width || !metadata.height) {
    throw new Error('Formato inválido. Use GIF, WebP, PNG ou JPEG.');
  }
  const pages = metadata.pages ?? 1;
  const pageHeight = metadata.pageHeight ?? metadata.height;
  if (metadata.width > 2048 || pageHeight > 2048 || pages > 100) throw new Error('A mídia excede as dimensões ou o número de quadros permitidos.');
  const duration = (metadata.delay ?? []).reduce((total, delay) => total + delay, 0);
  const animated = pages > 1;
  if (animated && duration > 10_000) throw new Error('A animação deve durar no máximo 10 segundos.');

  const stickerLimit = animated ? 500 * 1024 : 100 * 1024;
  let sticker = await sharp(input, { animated: true, limitInputPixels: 40_000_000 })
    .rotate()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
  if (sticker.length > stickerLimit) {
    sticker = await sharp(input, { animated: true, limitInputPixels: 40_000_000 })
      .rotate()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 55, effort: 6 })
      .toBuffer();
  }
  if (sticker.length > stickerLimit) throw new Error(animated ? 'A figurinha animada excede 500 KB após a conversão.' : 'A figurinha estática excede 100 KB após a conversão.');
  const stickerMetadata = await sharp(sticker, { animated: true }).metadata();
  if (stickerMetadata.width !== 512 || (stickerMetadata.pageHeight ?? stickerMetadata.height) !== 512 || (stickerMetadata.pages ?? 1) !== pages) {
    throw new Error('Não foi possível manter todos os quadros da mídia como figurinha.');
  }

  let image = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .flatten({ background: '#ffffff' })
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  if (image.length > 1024 * 1024) {
    image = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .flatten({ background: '#ffffff' })
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 68, mozjpeg: true })
      .toBuffer();
  }
  if (image.length > 1024 * 1024) throw new Error('A imagem excede 1 MB após a otimização.');

  const preview = await sharp(image).resize(160, 160, { fit: 'inside' }).webp({ quality: 72 }).toBuffer();
  return { sticker, image, previewDataUrl: `data:image/webp;base64,${preview.toString('base64')}`, animated };
}

async function storeMedia(
  id: string,
  name: string,
  createdAt: string,
  input: Buffer,
  catalog: StoredFavoriteWhatsAppMedia[]
): Promise<StoredFavoriteWhatsAppMedia[]> {
  const normalized = await normalizeMedia(input);
  const stickerFileName = `${id}-sticker.webp`;
  const imageFileName = `${id}-image.jpg`;
  await mkdir(mediaDirectory, { recursive: true });
  await Promise.all([
    writeFile(mediaFilePath(stickerFileName), normalized.sticker, { mode: 0o600 }),
    writeFile(mediaFilePath(imageFileName), normalized.image, { mode: 0o600 })
  ]);
  return [...catalog, {
    id,
    name,
    createdAt,
    animated: normalized.animated,
    previewDataUrl: normalized.previewDataUrl,
    previewUrl: `/api/admin/whatsapp/media/${id}/preview`,
    stickerFileName,
    imageFileName
  }];
}

async function migrateLegacyMedia(): Promise<StoredFavoriteWhatsAppMedia[]> {
  let migrated: StoredFavoriteWhatsAppMedia[] = [];
  const legacyStickers = await getFavoriteWhatsAppStickers();
  for (const sticker of legacyStickers) {
    const input = await getFavoriteWhatsAppStickerBuffer(sticker.id);
    if (input) migrated = await storeMedia(sticker.id, sticker.name, sticker.createdAt, input, migrated);
  }
  const legacyImages = await getFavoriteWhatsAppImages();
  for (const image of legacyImages) {
    const input = await getFavoriteWhatsAppImageBuffer(image.id);
    if (input) migrated = await storeMedia(image.id, image.name, image.createdAt, input, migrated);
  }
  await persistCatalog(migrated);
  return migrated;
}

async function loadCatalog(): Promise<StoredFavoriteWhatsAppMedia[]> {
  if (mediaCatalog) return mediaCatalog;
  try {
    const contents = await readFile(mediaCatalogPath, 'utf8');
    const parsed = JSON.parse(contents) as StoredFavoriteWhatsAppMedia[];
    if (!Array.isArray(parsed) || parsed.some((item) => !item.id || !item.stickerFileName || !item.imageFileName || !item.previewDataUrl)) {
      throw new Error('O catálogo unificado de mídia do WhatsApp está inválido.');
    }
    mediaCatalog = parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    mediaCatalog = await migrateLegacyMedia();
  }
  return mediaCatalog;
}

export async function getFavoriteWhatsAppMedia(): Promise<FavoriteWhatsAppMedia[]> {
  const catalog = await loadCatalog();
  return catalog.map(({ id, name, createdAt, animated, previewDataUrl, previewUrl }) => ({ id, name, createdAt, animated, previewDataUrl, previewUrl }));
}

export async function addFavoriteWhatsAppMedia(name: string, mediaDataUrl: string): Promise<FavoriteWhatsAppMedia[]> {
  const match = /^data:image\/(webp|gif|png|jpeg);base64,([A-Za-z0-9+/]+=*)$/.exec(mediaDataUrl);
  if (!match) throw new Error('Use um arquivo GIF, WebP, PNG ou JPEG.');
  const data = Buffer.from(match[2], 'base64');
  const catalog = await loadCatalog();
  const id = randomUUID();
  const nextCatalog = await storeMedia(id, name.trim(), new Date().toISOString(), data, catalog);
  try {
    await persistCatalog(nextCatalog);
    mediaCatalog = nextCatalog;
  } catch (error) {
    const item = nextCatalog.at(-1)!;
    await Promise.all([
      rm(mediaFilePath(item.stickerFileName), { force: true }),
      rm(mediaFilePath(item.imageFileName), { force: true })
    ]);
    throw error;
  }
  return getFavoriteWhatsAppMedia();
}

export async function deleteFavoriteWhatsAppMedia(mediaId: string): Promise<FavoriteWhatsAppMedia[] | null> {
  const catalog = await loadCatalog();
  const item = catalog.find((media) => media.id === mediaId);
  if (!item) return null;

  const nextCatalog = catalog.filter((media) => media.id !== mediaId);
  await persistCatalog(nextCatalog);
  mediaCatalog = nextCatalog;
  await Promise.all([
    rm(mediaFilePath(item.stickerFileName), { force: true }),
    rm(mediaFilePath(item.imageFileName), { force: true })
  ]);
  return getFavoriteWhatsAppMedia();
}

export async function getFavoriteWhatsAppMediaBuffer(mediaId: string, type: WhatsAppMediaType): Promise<Buffer | null> {
  const catalog = await loadCatalog();
  const item = catalog.find((media) => media.id === mediaId);
  if (!item) return null;
  return readFile(mediaFilePath(type === 'sticker' ? item.stickerFileName : item.imageFileName));
}

export async function getFavoriteWhatsAppMediaPreview(mediaId: string): Promise<Buffer | null> {
  const catalog = await loadCatalog();
  const item = catalog.find((media) => media.id === mediaId);
  if (!item) return null;
  return readFile(mediaFilePath(item.stickerFileName));
}