function parseSvg(svgString) {
  const parser = new DOMParser();
  const svg = parser.parseFromString(svgString, "image/svg+xml").documentElement;
  const paths = Array.from(svg.querySelectorAll("path"));
  return paths.map((path) => path.getAttribute("d"));
}

function calculateLongestEdge(pathData) {
    if (!pathData) {
      return { length: 0, index: 0 };
    }
  
    const commands = pathData.match(/[A-Za-z][^A-Za-z]*/g).map(commandString => {
      const type = commandString[0];
      const coordStrings = commandString.slice(1).trim().split(/[\s,]+/);
      const coords = coordStrings.map(coord => parseFloat(coord));
      return { type, coords };
    });
  
    let maxLength = 0;
    let longestEdge = { index: 0, length: 0 };
    let prevCoords = [0, 0];
  
    for (let i = 0; i < commands.length; i++) {
      if (commands[i].type === 'Z') {
        prevCoords = [0, 0];
        continue;
      }
      const coords = commands[i].coords;
  
      for (let j = 0; j < coords.length; j += 2) {
        const length = Math.sqrt(
          Math.pow(coords[j] - prevCoords[0], 2) + Math.pow(coords[j + 1] - prevCoords[1], 2)
        );
        if (length > maxLength) {
          maxLength = length;
          longestEdge = { index: i, length };
        }
        prevCoords = [coords[j], coords[j + 1]];
      }
    }
    return longestEdge;
  }
      
function replaceEdgeWithCurve(pathData, edgeIndex) {
  const coords = pathData.split(" ");
  const [x1, y1, x2, y2] = [
    parseFloat(coords[edgeIndex * 2 + 1]),
    parseFloat(coords[edgeIndex * 2 + 2]),
    parseFloat(coords[edgeIndex * 2 + 3]),
    parseFloat(coords[edgeIndex * 2 + 4]),
  ];
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const curve = `L ${x1} ${y1} C ${cx} ${cy} ${cx} ${cy} ${x2} ${y2} `;
  coords.splice(edgeIndex * 2 + 1, 4, curve);
  return coords.join(" ");
}

function processShapes(svgString) {
  let pathsData = parseSvg(svgString);
  let processedPaths = [];

  while (pathsData.length > 0) {
    const longestEdges = pathsData.map(calculateLongestEdge);
    let maxEdge = { length: 0, shapeIndex: 0, edgeIndex: 0 };

    longestEdges.forEach((edge, index) => {
      if (edge.length > maxEdge.length) {
        maxEdge = { length: edge.length, shapeIndex: index, edgeIndex: edge.index };
      }
    });

    const pairShapeIndex = (maxEdge.shapeIndex + 1) % pathsData.length;
    pathsData[maxEdge.shapeIndex] = replaceEdgeWithCurve(pathsData[maxEdge.shapeIndex], maxEdge.edgeIndex);
    pathsData[pairShapeIndex] = replaceEdgeWithCurve(pathsData[pairShapeIndex], maxEdge.edgeIndex);

    processedPaths.push(pathsData[maxEdge.shapeIndex]);
    pathsData.splice(maxEdge.shapeIndex, 1);
  }

  return processedPaths;
}

function createFinalSvgString(svgString, processedPaths) {
  const svgOpening = svgString.match(/<svg[^>]*>/)[0];
  const svgClosing = "</svg>";
  const pathTags = processedPaths
  .map((pathData) => `<path d="${pathData}" fill="none" stroke="#000"/>`)
  .join("");
  return `${svgOpening}${pathTags}${svgClosing}`;
  }
  
  export function get(svgString) {
    console.log(svgString)
    const processedPaths = processShapes(svgString);

    const finalSvgString = createFinalSvgString(svgString, processedPaths);
    console.log(finalSvgString)
    return finalSvgString
  }
