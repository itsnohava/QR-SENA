const Jimp = require('jimp');

const src  = 'chica-peek.jpg';
const dest = 'chica-peek.png';

Jimp.read(src).then(async img => {
    // Convert to PNG with transparency
    // Remove near-white pixels (background is bright white)
    img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        // If pixel is close to white (the background)
        if (r > 230 && g > 230 && b > 230) {
            this.bitmap.data[idx + 3] = 0; // fully transparent
        }
    });

    await img.writeAsync(dest);
    console.log('Background removed! Saved as', dest);
}).catch(console.error);
