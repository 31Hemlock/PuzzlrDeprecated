export default class svgScaler {
  constructor(tarWidth, tarHeight, svgString) {
    this.tarWidth = tarWidth;
    this.tarHeight = tarHeight;
    this.svgString = svgString;
    this.retStringSVG = '';
  }

  async init() {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(this.svgString, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
  
    const originalWidth = parseFloat(svgElement.getAttribute('width'));
    const originalHeight = parseFloat(svgElement.getAttribute('height'));
  
    const scaleX = this.tarWidth / originalWidth;
    const scaleY = this.tarHeight / originalHeight;
  
    // Set the desired width and height on the SVG element.
    svgElement.setAttribute('width', this.tarWidth);
    svgElement.setAttribute('height', this.tarHeight);
  
    // Update the viewBox attribute to maintain the aspect ratio.
    const originalViewBox = svgElement.getAttribute('viewBox');
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = originalViewBox.split(' ').map(parseFloat);
    const newViewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
    svgElement.setAttribute('viewBox', newViewBox);
  
    // Serialize the updated SVG element back to a string.
    const serializer = new XMLSerializer();
    this.retStringSVG = serializer.serializeToString(svgElement);
  }
      
  scalePathData(pathData, scaleX, scaleY) {
    // This regular expression will match SVG path commands and coordinates
    const regex = /([A-Za-z])|(-?\d+(\.\d+)?(?:e[-+]?\d+)?[, ]?)+/g;
    const matches = pathData.match(regex);
    let scaledPathData = '';
  
    for (const match of matches) {
      if (isNaN(parseFloat(match))) {
        // Not a number, keep the command (e.g., M, L, C, etc.)
        scaledPathData += match;
      } else {
        // This is a number, so we need to scale it
        const coords = match.split(/[, ]+/).filter((coord) => coord.trim() !== '');
        const scaledCoords = coords.map((coord, index) => {
          const value = parseFloat(coord);
          return index % 2 === 0 ? value * scaleX : value * scaleY;
        });
  
        scaledPathData += scaledCoords.join(',') + ' ';
      }
    }
  
    return scaledPathData;
  }
  
  scaledSVG() {
    return this.retStringSVG;
  }
}
