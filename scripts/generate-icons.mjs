import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve } from "path";

const LOGO = resolve("public/icons/logo.jpeg");
const SIZES = [192, 512];
const OUT_DIR = resolve("public/icons");

async function main() {
  for (const size of SIZES) {
    const png = await sharp(LOGO)
      .resize(size, size, { fit: "cover", position: "center" })
      .png()
      .toBuffer();
    writeFileSync(resolve(OUT_DIR, `icon-${size}.png`), png);
    console.log(`✓ Generated icon-${size}.png`);
  }
}

main().catch(console.error);
