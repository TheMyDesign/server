const Jimp = require('jimp');

async function combineImages(baseImagePath, topImagePath, x, y, outputFileName) {
    try {
        const [baseImage, topImage] = await Promise.all([Jimp.read(baseImagePath), Jimp.read(topImagePath)]);

        baseImage.composite(topImage, x, y);

        await baseImage.writeAsync(outputFileName);
        console.log("Image combination done");
    } catch (error) {
        console.log("Failed to combine images");
        console.error(`Failed to combine images: ${error.message}`);
        throw error;
    }
}

module.exports = {
    combineImages
};