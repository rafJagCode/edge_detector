const getImageOpacityMatrix = require("./getImageOpacityMatrix");

const getImageTransparencyMatrix = (imageOpacityMatrix) => {
  return imageOpacityMatrix.map((row) => {
    return row.map((opacity) => !opacity);
  });
};

const getRightEdgePoints = (matrix) => {
  const height = matrix.length;
  const width = matrix[0].length;
  const edgePoints = [];
  let point = null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      if (matrix[y][x] && !matrix[y][x + 1]) point = [x, y];
    }
    if (point) edgePoints.push(point);
    point = null;
  }
  return edgePoints;
};

const getLeftEdgePoints = (matrix) => {
  const height = matrix.length;
  const width = matrix[0].length;
  const edgePoints = [];
  let point = null;
  for (let y = 0; y < height; y++) {
    for (let x = width; x > 0; x--) {
      if (matrix[y][x] && !matrix[y][x - 1]) point = [x, y];
    }
    if (point) edgePoints.push(point);
    point = null;
  }
  return edgePoints;
};

const getBottomEdgePoints = (matrix) => {
  const height = matrix.length;
  const width = matrix[0].length;
  const edgePoints = [];
  let point = null;
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height - 1; y++) {
      if (matrix[y][x] && !matrix[y + 1][x]) point = [x, y];
    }
    if (point) edgePoints.push(point);
    point = null;
  }
  return edgePoints;
};

const getTopEdgePoints = (matrix) => {
  const height = matrix.length;
  const width = matrix[0].length;
  const edgePoints = [];
  let point = null;
  for (let x = 0; x < width; x++) {
    for (let y = height - 1; y > 0; y--) {
      if (matrix[y][x] && !matrix[y - 1][x]) point = [x, y];
    }
    if (point) edgePoints.push(point);
    point = null;
  }
  return edgePoints;
};

const isPointInArray = (array, point) => {
  return array.some((p) => p[0] === point[0] && p[1] === point[1]);
};

const getMergedPointsWithoutDuplicates = (points) => {
  const merged = [];
  points.forEach((point) => {
    if (!isPointInArray(merged, point)) merged.push(point);
  });
  return merged;
};

const getImageEdgePoints = async (directory, imageName, extension) => {
  const imageOpacityMatrix = await getImageOpacityMatrix(
    directory,
    imageName,
    extension
  );
  const imageTransparencyMatrix =
    getImageTransparencyMatrix(imageOpacityMatrix);

  const rigthEdgePoints = getRightEdgePoints(imageTransparencyMatrix);
  const leftEdgePoints = getLeftEdgePoints(imageTransparencyMatrix);
  const bottomEdgePoints = getBottomEdgePoints(imageTransparencyMatrix);
  const topEdgePoints = getTopEdgePoints(imageTransparencyMatrix);

  const mergedPointsWithoutDuplicates = getMergedPointsWithoutDuplicates([
    ...rigthEdgePoints,
    ...leftEdgePoints,
    ...topEdgePoints,
    ...bottomEdgePoints,
  ]);
  return {
    edgePoints: mergedPointsWithoutDuplicates,
    imageWidth: imageTransparencyMatrix[0].length,
    imageHeight: imageTransparencyMatrix.length,
  };
};

module.exports = getImageEdgePoints;
