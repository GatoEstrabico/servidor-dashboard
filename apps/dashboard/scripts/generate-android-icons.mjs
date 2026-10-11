import sharp from 'sharp';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const logoPath = resolve(scriptDirectory, '../public/logo.jpg');
const resourcesDirectory = resolve(scriptDirectory, '../android/app/src/main/res');
const densities = [
  { name: 'mdpi', launcher: 48, adaptive: 108 },
  { name: 'hdpi', launcher: 72, adaptive: 162 },
  { name: 'xhdpi', launcher: 96, adaptive: 216 },
  { name: 'xxhdpi', launcher: 144, adaptive: 324 },
  { name: 'xxxhdpi', launcher: 192, adaptive: 432 }
];

for (const density of densities) {
  const outputDirectory = resolve(resourcesDirectory, `mipmap-${density.name}`);
  const squareIcon = await sharp(logoPath)
    .resize(density.launcher, density.launcher, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();

  await sharp(squareIcon).png().toFile(resolve(outputDirectory, 'ic_launcher.png'));

  const circleMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${density.launcher}" height="${density.launcher}"><circle cx="${density.launcher / 2}" cy="${density.launcher / 2}" r="${density.launcher / 2}" fill="white"/></svg>`
  );
  await sharp(squareIcon)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(resolve(outputDirectory, 'ic_launcher_round.png'));

  const foregroundSize = Math.round(density.adaptive * 0.66);
  const foregroundLogo = await sharp(logoPath)
    .resize(foregroundSize, foregroundSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: density.adaptive,
      height: density.adaptive,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foregroundLogo, gravity: 'centre' }])
    .png()
    .toFile(resolve(outputDirectory, 'ic_launcher_foreground.png'));
}

console.log('Android launcher icons generated for five screen densities.');