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

    // Set the desired width and height on the SVG element.
    svgElement.setAttribute('width', this.tarWidth);
    svgElement.setAttribute('height', this.tarHeight);

    // Update the viewBox attribute to maintain the aspect ratio.
    const originalWidth = parseFloat(svgElement.getAttribute('width'));
    const originalHeight = parseFloat(svgElement.getAttribute('height'));
    svgElement.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);

    // Serialize the updated SVG element back to a string.
    const serializer = new XMLSerializer();
    this.retStringSVG = serializer.serializeToString(svgElement);
  }

  scaledSVG() {
    return this.retStringSVG;
  }
}
