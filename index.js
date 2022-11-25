var fs = require('fs');
PNG = require('pngjs').PNG;
const getImageEdgePoints = require('./functions/getImageEdgePoints');

const findBorderValues = (edgePoints) => {
 let minX = edgePoints[0][0];
 let maxX = edgePoints[0][0];
 let minY = edgePoints[0][1];
 let maxY = edgePoints[0][1];
 edgePoints.forEach((point) => {
  if (point[0] < minX) minX = point[0];
  if (point[0] > maxX) maxX = point[0];
  if (point[1] < minY) minY = point[1];
  if (point[1] > maxY) maxY = point[1];
 });
 return { minX, maxX, minY, maxY };
};

const makeEdgeImage = (img, points) => {
 points.forEach((point) => {
  const idx = (img.width * point[1] + point[0]) << 2;
  setOpacity(img, idx, 255);
 });
};

const setOpacity = (img, idx, opacity) => {
 img.data[idx + 3] = opacity;
};

const createEdgePreview = (directory, imageName, extension, edgePoints) => {
 fs
  .createReadStream(directory + imageName + '.' + extension)
  .pipe(
   new PNG({
    filterType: 4,
   })
  )
  .on('parsed', function () {
   for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
     const currIdx = (this.width * y + x) << 2;
     setOpacity(this, currIdx, 0);
    }
   }
   makeEdgeImage(this, edgePoints);
   this.pack().pipe(fs.createWriteStream(`./edge_previews/${imageName}EdgePreviev.${extension}`));
  });
};

const getPointsMap = (points) => {
 const map = new Map();
 points.forEach((point) => {
  if (map.has(point[0]))
   map.set(
    point[0],
    [...map.get(point[0]), point[1]].sort((y1, y2) => y1 - y2)
   );
  else map.set(point[0], [point[1]]);
 });
 return new Map([...map].sort(([key1, value1], [key2, value2]) => key1 - key2));
};

const generateText = (map, borderValues, imageName) => {
 let text = `${imageName}: {\n
 minX: ${borderValues.minX},
 maxX: ${borderValues.maxX},
 minY: ${borderValues.minY},
 maxY: ${borderValues.maxY},
	collisionPoints: new Map(\n`;
 [...map].forEach(([key, value]) => {
  text += `[${key}, ${JSON.stringify(value)}],\n`;
 });
 text += `)\n},\n`;
 return text;
};

const createJavascriptFile = (fileName, text) => {
 fs.writeFile(`./output_js/${fileName}.js`, text, (err) => {
  if (err) console.log('ups');
 });
};

const directory = './images/';

let files = fs.readdirSync(directory).map((file) => {
 const [imageName, extension] = file.split('.');
 return { imageName, extension };
});

const getEdgePoints = async () => {
 const promises = files.map(async (file) => {
  const edgePoints = await getImageEdgePoints(directory, file.imageName, file.extension);
  const borderValues = findBorderValues(edgePoints);
  const pointsMap = getPointsMap(edgePoints);
  const text = generateText(pointsMap, borderValues, file.imageName);
  file.borderValues = borderValues;
  file.edgePoints = edgePoints;
  file.text = text;
  createEdgePreview(directory, file.imageName, file.extension, edgePoints);
  return file;
 });

 files = await Promise.all(promises);

 let text = files.reduce((acc, curr) => {
  return acc + curr.text;
 }, '');

 text = `// in collisionPoints Map key is x coordinate and value is an array of y coordinates\n\n
 const imagesCollisionData = {\n
	${text}}\n
	export default imagesCollisionData
 `;

 createJavascriptFile('imagesCollisionData', text);
};

getEdgePoints();
// createOutputFiles(directory, imageName, extension);
