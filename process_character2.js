const Jimp = require('jimp');

const imgPath = "c:/Users/chave/OneDrive/Escritorio/QR-SENA-main/QR-SENA-main/chica-sena.png";
const outputBodyPath = "c:/Users/chave/OneDrive/Escritorio/QR-SENA-main/QR-SENA-main/chica-sena-cuerpo.png";
const outputArmPath = "c:/Users/chave/OneDrive/Escritorio/QR-SENA-main/QR-SENA-main/chica-sena-brazo.png";

Jimp.read(imgPath).then(async (image) => {
    const W = image.bitmap.width;
    const H = image.bitmap.height;
    
    const body = image.clone();
    const arm = new Jimp(W, H, 0x00000000);

    const Y_START = Math.floor(H * 0.05);
    const Y_END = Math.floor(H * 0.38);

    for (let y = Y_START; y < Y_END; y++) {
        let armEndX = -1;
        let armStartX = -1;
        let foundArm = false;
        
        // Scan right to left
        for (let x = W - 1; x >= Math.floor(W * 0.50); x--) {
            const a = image.getPixelColor(x, y) & 0xff;
            if (a !== 0) {
                if (!foundArm) {
                    foundArm = true;
                    armEndX = x;
                }
                armStartX = x;
            } else {
                if (foundArm) {
                    break; // hit the gap
                }
            }
        }

        // If we found the arm and it's not too wide (which would mean we hit the torso)
        if (foundArm && (armEndX - armStartX < W * 0.30)) {
            // We successfully isolated the arm for this row!
            // Let's find the color to smear from the body (left of the gap)
            let smearColor = 0x00000000;
            for (let x = armStartX - 1; x >= 0; x--) {
                if ((image.getPixelColor(x, y) & 0xff) !== 0) {
                    smearColor = image.getPixelColor(x, y);
                    break;
                }
            }

            // Extract arm and smear body
            for (let x = armStartX; x <= armEndX; x++) {
                const pixelColor = image.getPixelColor(x, y);
                arm.setPixelColor(pixelColor, x, y);
                
                // Erase from body and fill with smear color
                if (smearColor !== 0x00000000) {
                    body.setPixelColor(smearColor, x, y);
                } else {
                    body.setPixelColor(0x00000000, x, y);
                }
            }
        }
    }

    await body.writeAsync(outputBodyPath);
    await arm.writeAsync(outputArmPath);
    console.log("Smart image split successfully!");
}).catch(err => {
    console.error(err);
});
