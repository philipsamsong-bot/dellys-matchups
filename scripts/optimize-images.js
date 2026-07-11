const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "..", "public");

async function walk(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      await walk(full);
      continue;
    }

    if (!/\.(png|jpg|jpeg)$/i.test(file)) continue;

    const webp = full.replace(/\.(png|jpg|jpeg)$/i, ".webp");

    console.log("Optimizing:", file);

    await sharp(full)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(webp);
  }
}

walk(PUBLIC_DIR)
  .then(() => console.log("Done!"))
  .catch(console.error);
