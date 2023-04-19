
export default class VoronoiPuzzle {
    constructor(svgString) {
        this.voronoiSvg = svgString
        console.log(this.voronoiSvg)
    }

    init() {
        this.parsedSvg = this.parseSVG(this.voronoiSvg)
        this.makeNewSvg(this.parsedSvg)
        console.log(this.parsedSvg)

    }

    parseSVG(svg) {
        const paths = svg.match(/<path[^>]+>/g);
        const result = [];
      
        paths.forEach((path, index) => {
          const d = path.match(/d="([^"]+)"/)[1];
          const commands = d.split(/(?=[MmLl])/);
          const formattedCommands = commands.map(command => {
            const parts = command.trim().split(/\s+/);
            return [parts[0], parseFloat(parts[1]), parseFloat(parts[2])];
          });
      
          const obj = {};
          obj[`obj${index + 1}`] = formattedCommands;
          result.push(obj);
        });
      
        return result;
      }
    makeNewSvg(parsedSvg) {
        console.log(parsedSvg)
        for (let obj of parsedSvg) {
            let longestLine = this.findLargestLine(obj)
            console.log(longestLine)
            console.log(obj)
            for (let i in obj) {
                let line = obj[i]
                const objKeys = Object.keys(obj[i])
                for (let key of objKeys) {
                    console.log(line[key])
                }
            }
        }
    }
    findLargestLine(obj) {
        let largestLineLength = 0;
        let largestLinePathKey = null;
        let largestLineIndices = null;
        let largestLineCoords = null;
      
        for (const key in obj) {
          const pathCommands = obj[key];
      
          for (let i = 0; i < pathCommands.length - 1; i++) {
            const command1 = pathCommands[i];
            const command2 = pathCommands[i + 1];
      
            if (!(/^[MLCSQT]$/i.test(command1[0])) || !(/^[MLCSQT]$/i.test(command2[0]))) {
              continue;
            }
      
            const x1 = command1[1];
            const y1 = command1[2];
            let x2, y2;
      
            if (["C", "S"].includes(command2[0].toUpperCase())) {
              x2 = command2[command2.length - 2];
              y2 = command2[command2.length - 1];
            } else if (["Q", "T"].includes(command2[0].toUpperCase())) {
              x2 = command2[command2.length - 2];
              y2 = command2[command2.length - 1];
            } else {
              x2 = command2[1];
              y2 = command2[2];
            }
      
            const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      
            if (lineLength > largestLineLength) {
              largestLineLength = lineLength;
              largestLinePathKey = key;
              largestLineIndices = [i, i + 1];
              largestLineCoords = [x1, y1, x2, y2];
            }
          }
        }
      
        return { pathKey: largestLinePathKey, indices: largestLineIndices, coordinates: largestLineCoords};
      }
      
      

    get() {
        return this.voronoiSvg
    }
}