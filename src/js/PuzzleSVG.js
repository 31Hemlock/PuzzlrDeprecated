import { getRandBetween } from './utils.js';
export class PuzzleSVG {
    constructor(width, height, wideReps = 6, highReps = 10) {
        this.width = width;
        this.height = height;
        this.wideReps = wideReps;
        this.highReps = highReps;
    }
    create() {
        const canvas = SVG().addTo('body').size(this.width, this.height);
        // Step 3: calculate the dimensions of each piece
        this.pieceWidth = this.width / this.wideReps;
        this.pieceHeight = this.height / this.highReps;
        let retStringSVG = `
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="` + this.width + `" height="` + this.height + `">
        `
        // retStringSVG += `<g transform="scale(1, -1)">`
        // Step 4: create the grid of x pieces
        for (let i = 0; i < this.highReps; i++) { // y changes
            for (let j = 0; j < this.wideReps; j++) { // x changes
                const boxZeroX = j * this.pieceWidth
                const boxZeroY = i * this.pieceHeight
                const lineStartX = boxZeroX
                const lineStartY = boxZeroY + getRandBetween(0, this.pieceHeight / 2)
                const splittingLine = new Array(["M", lineStartX, lineStartY]);
                this.#genLine(lineStartX, lineStartY, boxZeroX, boxZeroY, 0, splittingLine)

                // Now generate pieces from this line we created.
                // Just take the line as is, then move from the end to the start in both directions.
                const pathOne = Array.from(splittingLine)
                const pathTwo = Array.from(splittingLine)
                const curveEndX = splittingLine[splittingLine.length - 1][splittingLine[splittingLine.length - 1].length - 2];
                const curveEndY = splittingLine[splittingLine.length - 1][splittingLine[splittingLine.length - 1].length - 1];

                pathOne.push(["L", curveEndX, curveEndY, boxZeroX + this.pieceWidth, boxZeroY])
                pathOne.push(["L", boxZeroX + this.pieceWidth, boxZeroY, boxZeroX, boxZeroY])
                pathOne.push(["L", boxZeroX, boxZeroY, boxZeroX, lineStartY])

                pathTwo.push(["L", curveEndX, curveEndY, boxZeroX, boxZeroY + this.pieceHeight])
                pathTwo.push(["L", boxZeroX, boxZeroY + this.pieceHeight, boxZeroX, lineStartY])

                var pathOneShow = canvas.path(pathOne).stroke('green').fill('lightgreen')
                var pathTwoShow = canvas.path(pathTwo).stroke('blue').fill('lightblue')
                const pathOneRaw = pathOneShow.svg()
                const pathTwoRaw = pathTwoShow.svg()
                retStringSVG += pathOneRaw
                retStringSVG += pathTwoRaw


            }
        }
        // canvas.remove() // use when finished
        // retStringSVG += "</g>"
        if (retStringSVG.includes("path")) {return retStringSVG} else {return 0}
    }
    #genLine(startX, startY, boxZeroX, boxZeroY, counter, curLine) {
        if (counter == 1) { // && Math.random() < 0.5
            const curLineLast = curLine[curLine.length - 1]
            curLineLast[curLineLast.length - 2] = this.pieceWidth + boxZeroX
            curLine[curLine.length - 1] = curLineLast
            return curLine
        }
        const xEnd = getRandBetween(boxZeroX, boxZeroX + this.pieceWidth)
        const yEnd = (startY - boxZeroY) < (this.pieceHeight)? getRandBetween(boxZeroY + (this.pieceHeight), boxZeroY + this.pieceHeight) : getRandBetween(boxZeroY, boxZeroY + this.pieceHeight)
        // C
        const cur1X = getRandBetween(startX, boxZeroX + this.pieceWidth)
        const cur1Y = getRandBetween(startY, boxZeroY + this.pieceHeight)
        const cur2X = getRandBetween(xEnd, boxZeroX + this.pieceWidth)
        const cur2Y = getRandBetween(yEnd, boxZeroY + this.pieceHeight)
        curLine.push(["C", cur1X, cur1Y, cur2X, cur2Y, xEnd, yEnd])
        this.#genLine(xEnd, yEnd, boxZeroX, boxZeroY, counter + 1, curLine)
    }
}
