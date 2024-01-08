const sharp = require("sharp");
const ico = require("sharp-ico");

const svgIcon = "src/app/icon.svg";
async function main() {
  await ico.sharpsToIco([sharp(svgIcon)], "src/app/favicon.ico", {
    sizes: [48, 32, 16],
    // sizes: "default", // equal to [256, 128, 64, 48, 32, 24, 16]
    resizeOptions: {}, // sharp resize optinos
  }); // will output a 64x64 ico image (with 32x32 and 24x24 sizes)

  await sharp(svgIcon).resize(180, 180).png().toFile("src/app/apple-icon.png");
  await sharp(svgIcon).resize(192, 192).png().toFile("src/app/icon-192.png");
  await sharp(svgIcon).resize(512, 512).png().toFile("src/app/icon-512.png");
}

main().catch((e) => console.error(e));
