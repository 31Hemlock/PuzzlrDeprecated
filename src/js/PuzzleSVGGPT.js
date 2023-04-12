import { getRandBetween } from './utils.js';

export class PuzzleSVG {
    constructor(width, height, wideReps = 3, highReps = 3) {
        this.width = width;
        this.height = height;
        this.wideReps = wideReps;
        this.highReps = highReps;
    }

    create() {
        const canvas = SVG().addTo('body').size(this.width, this.height);
        this.pieceWidth = this.width / this.wideReps;
        this.pieceHeight = this.height / this.highReps;
        let retStringSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="` + this.width + `" height="` + this.height + `">
        `;
        for (let i = 0; i < this.wideReps; i++) {
            for (let j = 0; j < this.highReps; j++) {
                const boxZeroX = j * this.pieceWidth;
                const boxZeroY = i * this.pieceHeight;

                // Randomly choose between horizontal and vertical cut
                const isHorizontal = Math.random() < 0.5;
                let lineStartX, lineStartY;

                if (isHorizontal) {
                    lineStartX = boxZeroX + getRandBetween(0, this.pieceWidth / 2);
                    lineStartY = boxZeroY;
                } else {
                    lineStartX = boxZeroX;
                    lineStartY = boxZeroY + getRandBetween(0, this.pieceHeight / 2);
                }

                const splittingLine = new Array(["M", lineStartX, lineStartY]);
                this.#genLine(lineStartX, lineStartY, boxZeroX, boxZeroY, 0, splittingLine, isHorizontal);

                const pathOne = Array.from(splittingLine);
                const pathTwo = Array.from(splittingLine);
                const curveEndX = splittingLine[splittingLine.length - 1][splittingLine[splittingLine.length - 1].length - 2];
                const curveEndY = splittingLine[splittingLine.length - 1][splittingLine[splittingLine.length - 1].length - 1];

                if (isHorizontal) {
                    pathOne.push(["L", curveEndX, curveEndY, boxZeroX + this.pieceWidth, boxZeroY]);
                    pathOne.push(["L", boxZeroX + this.pieceWidth, boxZeroY, boxZeroX, boxZeroY]);
                    pathOne.push(["L", boxZeroX, boxZeroY, lineStartX, lineStartY]);

                    pathTwo.push(["L", curveEndX, curveEndY, boxZeroX, boxZeroY + this.pieceHeight]);
                    pathTwo.push(["L", boxZeroX, boxZeroY + this.pieceHeight, lineStartX, lineStartY]);
                } else {
                    pathOne.push(["L", curveEndX, curveEndY, boxZeroX + this.pieceWidth, boxZeroY]);
                    pathOne.push(["L", boxZeroX + this.pieceWidth, boxZeroY, lineStartX, lineStartY]);
                    pathOne.push(["L", lineStartX, lineStartY, boxZeroX, boxZeroY]);

                    pathTwo.push(["L", curveEndX, curveEndY, boxZeroX, boxZeroY + this.pieceHeight]);

                    pathTwo.push(["L", boxZeroX, boxZeroY + this.pieceHeight, lineStartX, lineStartY]);
                }
                
                var pathOneShow = canvas.path(pathOne).stroke('green').fill('lightgreen');
                var pathTwoShow = canvas.path(pathTwo).stroke('blue').fill('lightblue');
                const pathOneRaw = pathOneShow.svg();
                const pathTwoRaw = pathTwoShow.svg();
                retStringSVG += pathOneRaw;
                retStringSVG += pathTwoRaw;
            }
        }
        canvas.remove();
        if (retStringSVG.includes("path")) { return retStringSVG; } else { return 0; }
    }
    
    #genLine(startX, startY, boxZeroX, boxZeroY, counter, curLine, isHorizontal) {
        if (counter == 1) {
            const curLineLast = curLine[curLine.length - 1];
            if (isHorizontal) {
                curLineLast[curLineLast.length - 2] = boxZeroX + this.pieceWidth;
            } else {
                curLineLast[curLineLast.length - 1] = boxZeroY + this.pieceHeight;
            }
            curLine[curLine.length - 1] = curLineLast;
            return curLine;
        }
        const xEnd = isHorizontal ? getRandBetween(boxZeroX, boxZeroX + this.pieceWidth) : startX;
        const yEnd = isHorizontal ? startY : getRandBetween(boxZeroY, boxZeroY + this.pieceHeight);
        const cur1X = isHorizontal ? getRandBetween(startX, xEnd) : getRandBetween(boxZeroX, xEnd);
        const cur1Y = isHorizontal ? getRandBetween(boxZeroY, yEnd) : getRandBetween(startY, yEnd);
        const cur2X = isHorizontal ? getRandBetween(xEnd, boxZeroX + this.pieceWidth) : getRandBetween(xEnd, boxZeroX + this.pieceWidth);
        const cur2Y = isHorizontal ? getRandBetween(yEnd, boxZeroY + this.pieceHeight) : getRandBetween(yEnd, boxZeroY + this.pieceHeight);        curLine.push(["C", cur1X, cur1Y, cur2X, cur2Y, xEnd, yEnd]);
        this.#genLine(xEnd, yEnd, boxZeroX, boxZeroY, counter + 1, curLine, isHorizontal);
    }
}