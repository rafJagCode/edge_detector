var fs = require('fs');
PNG = require('pngjs').PNG;
const getImageEdgePoints = require('./functions/getImageEdgePoints');
const directory = './images/';
let files = fs.readdirSync(directory).map((file) => {
  const [imageName, extension] = file.split('.');
  return { imageName, extension };
});

//***** PROCESS EDGE POINTS */

const changePointsToObjects = (edgePoints) => {
  return edgePoints.map((point) => ({ x: point[0], y: point[1] }));
};

const getAngleBetweenTwoPoints = (point1, point2) => {
  let angle = Math.atan2(point2.y - point1.y, point2.x - point1.x);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
};

const sortPointsCounterClockwise = (edgePoints, width, height) => {
  const imageCenter = { x: width / 2, y: height / 2 };
  return edgePoints.sort((point1, point2) => getAngleBetweenTwoPoints(imageCenter, point2) - getAngleBetweenTwoPoints(imageCenter, point1));
};

const reduceAmountOfPoints = (edgePoints) => {
  return edgePoints.reduce((acc, point, index) => {
    if (index % 3 === 0) acc.push(point);
    return acc;
  }, []);
};

const changePointsToProcentage = (edgePoints, width, height) => {
  return edgePoints.map((point) => ({ x: Math.round((point.x / width) * 100) / 100, y: Math.round((point.y / height) * 100) / 100 }));
};

//***** MAKE EDGE IMAGE PREVIEW */

const makeEdgeImage = (img, edgePoints) => {
  edgePoints.forEach((point) => {
    const idx = (img.width * point.y + point.x) << 2;
    setOpacity(img, idx, 255);
  });
};

const setOpacity = (img, idx, opacity) => {
  img.data[idx + 3] = opacity;
};

const createEdgePreview = (edgePoints, directory, imageName, extension) => {
  fs.createReadStream(directory + imageName + '.' + extension)
    .pipe(
      new PNG({
        filterType: 4,
      }),
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

//***** GENERATE TEXT */

const generateText = (edgePoints, imageName) => {
  let text = `'${imageName}': [\n`;
  edgePoints.forEach((point) => {
    text += `{x:${point.x}, y:${point.y}},\n`;
  });
  text += `\n],\n`;
  return text;
};

//***** CREATE JS FILE */

const createJavascriptFile = (fileName, text) => {
  fs.writeFile(`./output_js/${fileName}.js`, text, (err) => {
    if (err) console.log('ups');
  });
};

const getEdgePoints = async () => {
  const promises = files.map(async (file) => {
    const { edgePoints, imageWidth, imageHeight } = await getImageEdgePoints(directory, file.imageName, file.extension);
    const edgePointsAsObject = changePointsToObjects(edgePoints);
    const edgePointsSorted = sortPointsCounterClockwise(edgePointsAsObject, imageWidth, imageHeight);
    const edgePointsReduced = reduceAmountOfPoints(edgePointsSorted);
    createEdgePreview(edgePointsReduced, directory, file.imageName, file.extension);
    const edgePointsInProcentage = changePointsToProcentage(edgePointsReduced, imageWidth, imageHeight);
    const text = generateText(edgePointsInProcentage, file.imageName);
    file.text = text;
    return file;
  });

  files = await Promise.all(promises);

  let text = files.reduce((acc, curr) => {
    return acc + curr.text;
  }, '');

  text = `// x and y are collision points coordinates in % of width and height of image\n\n
   const imagesCollisionData = {\n
  	${text}}\n
  	export default imagesCollisionData
   `;

  createJavascriptFile('images_collision_data', text);
};

getEdgePoints();
