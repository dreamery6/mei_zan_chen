'use strict';

const { promisify } = require('util');
const fs = require('fs');
const sharp = require('sharp');
const sizeOf = promisify(require('image-size'));
const fsStat = promisify(fs.stat);

exports.resizeImage = async function resizeImage(shortSideLength, origFile, dstFile) {
    let result = {stat: false};
    let compressParam = {};

    let fileStat = await fsStat(origFile);
    if (!fileStat.isFile()) {
        result.err_msg = "file not found";
        return result;
    }

    const dimensions = await sizeOf(origFile);
    if (dimensions.height > dimensions.width) {
        compressParam.width = parseInt(shortSideLength);
    } else {
        compressParam.height = parseInt(shortSideLength);
    }
    
    let data = await sharp(origFile)
        .resize(compressParam)
        .toFile(dstFile);


};