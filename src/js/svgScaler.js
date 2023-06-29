/**
 * Scales an .svg object to the desired width and height.
 * @class
 */
export default class svgScaler {
  /**
   * @constructor
   * @param {number} tarWidth - Desired width of the .svg object.
   * @param {number} tarHeight - Desired height of the .svg object.
   * @param {string} svgString - The svg object itself, represented as a string.
   */
  constructor(tarWidth, tarHeight, svgString) {
    this.tarWidth = tarWidth;
    this.tarHeight = tarHeight;
    this.svgString = svgString;
    this.retStringSVG = '';
  }

  /**
   * Initializes the scaling of the svg element.
   * 
   * @async
   * @return {void}
   */
  async init() {
    const parser = new DOMParser();
    let svgDoc = parser.parseFromString(this.svgString, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
  
    const originalWidth = parseFloat(svgElement.getAttribute('width'));
    const originalHeight = parseFloat(svgElement.getAttribute('height'));
  
    const scaleX = 1*(this.tarWidth / originalWidth);
    const scaleY = 1*(this.tarHeight / originalHeight);
  
    // Set the desired width and height on the SVG element.
    svgElement.setAttribute('width', this.tarWidth);
    svgElement.setAttribute('height', this.tarHeight);
  
    // Get or create the viewBox attribute based on the original width and height.
    let originalViewBox = svgElement.getAttribute('viewBox');
    if (!originalViewBox) {
      originalViewBox = `0 0 ${originalWidth} ${originalHeight}`;
      svgElement.setAttribute('viewBox', originalViewBox);
    }
  
    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = originalViewBox.split(' ').map(parseFloat);
    const newViewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
    svgElement.setAttribute('viewBox', newViewBox);
  
    // Iterate over all path elements and scale their path data.
    const pathElements = svgElement.getElementsByTagName('path');
    for (const pathElement of pathElements) {
      const originalPathData = pathElement.getAttribute('d');
      const scaledPathData = this.scalePathData(originalPathData, scaleX, scaleY);
      pathElement.setAttribute('d', scaledPathData);
    }
  
    // Serialize the updated SVG element back to a string.
    const serializer = new XMLSerializer();
    this.retStringSVG = serializer.serializeToString(svgElement);
  }

  /**
   * Scales the path data of an individual path element in an .svg string.
   * 
   * @method
   * @param {string} pathData - A single path in an .svg object.
   * @param {number} scaleX - Amount by which to scale the path data in the X dimension.
   * @param {number} scaleY - Amount by which to scale the path data in the Y dimension.
   * @return {string}
   */
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
  
  /**
   * Returns the scaled .svg string.
   * 
   * @method
   * @return {string}
   */
  scaledSVG() {
    return this.retStringSVG;
  }
}