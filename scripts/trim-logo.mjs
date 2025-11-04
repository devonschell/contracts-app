import sharp from "sharp";
const src = "public/brand/Oviu logo.png";         // your current file
const out = "public/brand/oviu-logo.png";         // trimmed master
const small = "public/brand/oviu-logo@24.png";    // sidebar size

// Trim transparent padding, keep PNG, then make a 24px-tall variant.
await sharp(src).trim(10).png().toFile(out);
await sharp(out).resize({ height: 24 }).png().toFile(small);

console.log("✅ Wrote:", out, "and", small);
