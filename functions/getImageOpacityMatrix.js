var fs = require('fs');
PNG = require('pngjs').PNG;

const getImageOpacityMatrix = async (directory, imageName, extension) => {
 let imageOpacityMatrix = [];
 await new Promise((resolve) => {
  fs
   .createReadStream(directory + imageName + '.' + extension)
   .pipe(
    new PNG({
     filterType: 4,
    })
   )
   .on('parsed', function () {
    for (var y = 0; y < this.height; y++) {
     let row = [];
     for (var x = 0; x < this.width; x++) {
      const currIdx = (this.width * y + x) << 2;
      const currOpacity = this.data[currIdx + 3];
      row.push(currOpacity);
     }
     imageOpacityMatrix.push(row);
    }
    resolve();
   });
 });
 return imageOpacityMatrix;
};

module.exports = getImageOpacityMatrix;
