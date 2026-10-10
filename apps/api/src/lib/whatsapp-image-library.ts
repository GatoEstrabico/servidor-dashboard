import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

export type FavoriteWhatsAppImage = {
  id: string;
  name: string;
  createdAt: string;
  previewDataUrl: string;
};

type StoredFavoriteWhatsAppImage = FavoriteWhatsAppImage & { fileName: string };

const imageDirectory = resolve(process.cwd(), '.data/whatsapp-images');
const imageCatalogPath = resolve(imageDirectory, 'favorites.json');
let imageCatalog: StoredFavoriteWhatsAppImage[] | null = null;

function imageFilePath(fileName: string): string {
  if (!/^[A-Za-z0-9_-]+\.jpg$/.test(fileName)) throw new Error('Arquivo de imagem inválido.');
  return resolve(imageDirectory, fileName);
}

async function persistCatalog(catalog: StoredFavoriteWhatsAppImage[]): Promise<void> {
  await mkdir(imageDirectory, { recursive: true });
  const temporaryPath = `${imageCatalogPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(catalog, null, 2), { encoding: 'utf8', mode: 0o600 });
  await rename(temporaryPath, imageCatalogPath);
}

async function loadCatalog(): Promise<StoredFavoriteWhatsAppImage[]> {
  if (imageCatalog) return imageCatalog;
  try {
    const contents = await readFile(imageCatalogPath, 'utf8');
    const parsed = JSON.parse(contents) as StoredFavoriteWhatsAppImage[];
    if (!Array.isArray(parsed) || parsed.some((item) => !item.id || !item.fileName || !item.previewDataUrl)) {
      throw new Error('O catálogo de imagens favoritas está inválido.');
    }
    imageCatalog = parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    imageCatalog = [];
    await persistCatalog(imageCatalog);
  }
  return imageCatalog;
}

export async function getFavoriteWhatsAppImages(): Promise<FavoriteWhatsAppImage[]> {
  const catalog = await loadCatalog();
  return catalog.map(({ id, name, createdAt, previewDataUrl }) => ({ id, name, createdAt, previewDataUrl }));
}

export async function addFavoriteWhatsAppImage(name: string, imageDataUrl: string): Promise<FavoriteWhatsAppImage[]> {
  const prefix = 'data:image/webp;base64,';
  if (!imageDataUrl.startsWith(prefix)) throw new Error('Envie uma imagem compatível.');
  const input = Buffer.from(imageDataUrl.slice(prefix.length), 'base64');
  if (!input.length || input.length > 600 * 1024) throw new Error('A imagem importada excede o limite de 600 KB.');

  const source = sharp(input, { limitInputPixels: 40_000_000 });
  const sourceMetadata = await source.metadata();
  if (sourceMetadata.format !== 'webp' || !sourceMetadata.width || !sourceMetadata.height) {
    throw new Error('Não foi possível ler a imagem enviada.');
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
  const catalog = await loadCatalog();
  const id = randomUUID();
  const fileName = `${id}.jpg`;
  await mkdir(imageDirectory, { recursive: true });
  await writeFile(imageFilePath(fileName), image, { mode: 0o600 });
  const nextCatalog = [...catalog, {
    id,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    previewDataUrl: `data:image/webp;base64,${preview.toString('base64')}`,
    fileName
  }];
  try {
    await persistCatalog(nextCatalog);
    imageCatalog = nextCatalog;
  } catch (error) {
    await rm(imageFilePath(fileName), { force: true });
    throw error;
  }
  return getFavoriteWhatsAppImages();
}

export async function getFavoriteWhatsAppImageBuffer(imageId: string): Promise<Buffer | null> {
  const catalog = await loadCatalog();
  const favorite = catalog.find((image) => image.id === imageId);
  if (!favorite) return null;
  return readFile(imageFilePath(favorite.fileName));
}