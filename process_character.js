const Jimp = require('jimp');

const imgPath = "c:/Users/chave/OneDrive/Escritorio/QR-SENA-main/QR-SENA-main/chica-sena.png";
const outputBodyPath = "c:/Users/chave/OneDrive/Escritorio/QR-SENA-main/QR-SENA-main/chica-sena-cuerpo.png";
const outputArmPath = "c:/Users/chave/OneDrive/Escritorio/QR-SENA-main/QR-SENA-main/chica-sena-brazo.png";

Jimp.read(imgPath).then(async (image) => {
    const W = image.bitmap.width;
    const H = image.bitmap.height;
    
    const body = image.clone();
    const arm = new Jimp(W, H, 0x00000000);

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const pixelColor = image.getPixelColor(x, y);
            const a = pixelColor & 0xff;
            
            if (a === 0) continue;

            const isWavingArm = (x > W * 0.54 && y > H * 0.11 && y < H * 0.38);

            if (isWavingArm) {
                arm.setPixelColor(pixelColor, x, y);
                body.setPixelColor(0x00000000, x, y);
            }
        }
    }

    // Fill ONLY the pixels that were moved to the arm (so we don't paint the background)
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const armColor = arm.getPixelColor(x, y);
            // Only fill if this pixel was part of the arm
            if ((armColor & 0xff) !== 0) {
                // If it is close to the shoulder joint/hair
                if (x < W * 0.62) {
                    if (y < H * 0.28) {
                        body.setPixelColor(0x181518FF, x, y); // Hair color
                    } else if (y < H * 0.35) {
                        body.setPixelColor(0xFFFFFFFF, x, y); // Polo shirt color
                    }
                }
            }
        }
    }

    await body.writeAsync(outputBodyPath);
    await arm.writeAsync(outputArmPath);
    console.log("Image split successfully without background bleeding!");
}).catch(err => {
    console.error(err);
});
