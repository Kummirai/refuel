import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";

const LOGO = resolve("public/icons/logo.jpeg");
const SIZES = [192, 512];
const OUT_DIR = resolve("public/icons");

async function main() {
  for (const size of SIZES) {
    const logoSize = Math.round(size * 0.55);
    const logoY = Math.round(size * 0.1);

    const textSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <text x="50%" y="${Math.round(size * 0.82)}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(size * 0.09)}" font-weight="800" text-anchor="middle" fill="#3A7717">Kapuka Tradings</text>
    </svg>`;

    const logoBuffer = await sharp(LOGO)
      .resize(logoSize, logoSize, { fit: "cover", position: "center" })
      .toBuffer();

    const textBuffer = await sharp(Buffer.from(textSvg)).png().toBuffer();

    const composite = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        { input: logoBuffer, top: logoY, left: Math.round((size - logoSize) / 2) },
        { input: textBuffer, top: 0, left: 0 },
      ])
      .png()
      .toBuffer();

    writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), composite);
    console.log(`✓ Generated icon-${size}.png`);
  }
}

main().catch(console.error);
