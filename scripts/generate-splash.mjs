import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const ICON = path.join(ROOT, "apps/web/public/icon-512.png");
const OUT_DIR = path.join(ROOT, "apps/web/public/splash");
const BACKGROUND = "#131313";

// width/height in CSS px (portrait), matched against apple-touch-startup-image
// media queries by device-width/device-height + -webkit-device-pixel-ratio.
const DEVICES = [
  { width: 320, height: 568, ratio: 2, name: "iphone-se" },
  { width: 375, height: 667, ratio: 2, name: "iphone-8" },
  { width: 390, height: 844, ratio: 3, name: "iphone-12-13-14" },
  { width: 393, height: 852, ratio: 3, name: "iphone-14-15-pro" },
  { width: 430, height: 932, ratio: 3, name: "iphone-14-15-pro-max" },
  { width: 428, height: 926, ratio: 3, name: "iphone-12-13-pro-max" },
  { width: 810, height: 1080, ratio: 2, name: "ipad-10-2" },
  { width: 834, height: 1194, ratio: 2, name: "ipad-pro-11" },
  { width: 1024, height: 1366, ratio: 2, name: "ipad-pro-12-9" },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = [];
  for (const device of DEVICES) {
    const pxWidth = device.width * device.ratio;
    const pxHeight = device.height * device.ratio;
    const iconSize = Math.round(Math.min(pxWidth, pxHeight) * 0.32);
    const fileName = `apple-splash-${device.name}-${pxWidth}x${pxHeight}.png`;

    const icon = await sharp(ICON).resize(iconSize, iconSize).toBuffer();
    await sharp({
      create: {
        width: pxWidth,
        height: pxHeight,
        channels: 4,
        background: BACKGROUND,
      },
    })
      .composite([{ input: icon, gravity: "center" }])
      .png()
      .toFile(path.join(OUT_DIR, fileName));

    manifest.push({ ...device, pxWidth, pxHeight, fileName });
    console.log(`splash generado: ${fileName}`);
  }
  console.log(
    `\n${manifest.length} splash screens generadas en apps/web/public/splash/`,
  );
  return manifest;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
