import * as THREE from 'three'
import { getRandBetween } from './utils.js';
import { Piece } from './Piece.js'
import {
  SVGLoader
} from "three/examples/jsm/loaders/SVGLoader";
import { PuzzleApp } from './PuzzleApp.js';
import { rotationValues } from './constants'

/**
 * Contains the properties of the puzzle as a whole.
 * @class
 */
export class Puzzle{
  /**
   * @constructor
   * @param {string} svg - Data from an .svg file.
   * @param {THREE.Texture} texture - Image data as represented by THREE's TextureLoader class.
   * @param {number} [extrudeDepth=30] - Represents physical depth of a piece.
   */
    constructor(svg, texture, extrudeDepth = 30) {
        this.extrudeDepth = extrudeDepth
        this.svg = svg
        this.svgLoader = new SVGLoader()
        this.texture = texture
    }
        
    /**
     * Deprecated function for returning the mesh representing the thumbnail image.
     * 
     * @method
     * @return {THREE.Mesh}
     */
    getThumbMesh() {
      if (this.texture) {
        const thumbMaterial = new THREE.MeshBasicMaterial( {
            map: this.texture
        })
        const thumbGeometry = new THREE.PlaneGeometry(this.texture.image.width, this.texture.image.height)
        const thumbMesh = new THREE.Mesh(thumbGeometry, thumbMaterial)
        thumbMesh.position.set(-1100, 0, 0)
        thumbMesh.name = 'thumbnailMesh'
        return thumbMesh
      } else {
        console.log('Texture not yet initialized.')
      }
    }

    /**
     * Uses a loop to create and initialize all pieces of the puzzle.
     * 
     * @method
     * @return {void}
     */
    createPieces() {
      let pieceArray = []
      let svgData = this.svgLoader.parse(this.svg)
      let paths = svgData.paths
      let extrusionSettings = {
        depth: this.extrudeDepth,
        bevelEnabled: false
      }
      let pieceTexture = this.texture.clone()
      pieceTexture.repeat.set(1/this.texture.image.width, 1/this.texture.image.height)
      // pieceTexture.flipY = false
      // pieceTexture.flipX = false

      let material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        depthWrite: false,
        map: pieceTexture,
        transparent: true
              })

      for (let i = 0; i < paths.length; i++) {
        let path = paths[i]
        let shapes = SVGLoader.createShapes(path)
        
        
        for (let j = 0; j < shapes.length; j++) {
          let shape = shapes[j]
          
          let geometry = new THREE.ExtrudeGeometry(shape, extrusionSettings)
          let vectors = this.#getObjectVertices(shape)
          
          let piece = new Piece(geometry, material, vectors, i)
          // debug position
          // if (piece.num == 32 || piece.num == 30 || piece.num == 33 || piece.num == 34 || piece.num == 35 || piece.num == 36) {
          //   piece.position.set(400, 400, 0)
          // } else if (piece.num == 6 || piece.num == 4) {
          //   piece.position.set(0,0,0)
          //   // piece.position.set(getRandBetween(-450, 450), getRandBetween(-400, 400), 0)

          // } else {
          //   piece.position.set(-400, -400, 0)
          // }

          piece.position.set(getRandBetween(0 - (this.texture.image.width/1.5), this.texture.image.width/1.5), getRandBetween(0 - this.texture.image.height/1.5, this.texture.image.height / 1.5), 0)
          
          let main = new PuzzleApp()
          if (!main.touchScreen) { // If desktop, allow piece rotation, otherwise just set them all to not rotate
            piece.rotation.z = rotationValues[Math.floor(Math.random() * rotationValues.length)]
          } 
          piece.geometry.center()

          piece.init()

          pieceArray.push(piece)

        }
      }
      if (pieceArray) {return pieceArray} else {return null}
    }

    /**
     * Deprecated function for applying a change to the position of a shape.
     * 
     * @method
     */
    applyMatrixToShape(shape, matrix) {
      shape.getPoints().forEach((point) => {
        let vector3 = new THREE.Vector3(point.x, point.y, 0);
        vector3.applyMatrix4(matrix);
        point.set(vector3.x, vector3.y);
      });
    }
            

    /**
     * Extracts and returns the unique vertices from a SVG path object.
     * 
     * @method
     * @param {object} shape - An object representing an SVG path.
     * @return {array}
     */
    #getObjectVertices (shape) {
      let exitArray = []
          for (let i in shape.curves) {
              let line = shape.curves[i]
              const objKeys = Object.keys(shape.curves[i])
              .filter(key => key.startsWith('v'))
              .map(key => ({ // Limit to 4 sig figs
                  x: parseFloat(parseFloat(line[key].x).toFixed(4)),
                  y: parseFloat(parseFloat(line[key].y).toFixed(4))
              }));
              exitArray.push(objKeys.flat())
          }
          exitArray = exitArray.flat()

          // Remove duplicates
          let arrUniq = [...new Map(exitArray.map(v => [JSON.stringify(v), v])).values()]
          // remove vertices at index 1 and 2 because they're curve vertices, only used to define curves
          // arrUniq.splice(1, 2);

          return arrUniq
  
    }

    /**
     * Disposes of this puzzle object entirely.
     * 
     * @method
     * @return {void}
     */
    dispose() {
          // dispose of the texture
          if (this.texture) {
            if (this.texture.dispose) {
                this.texture.dispose();
            }
            this.texture = null;
        }

        // dispose of the SVG loader
        if (this.svgLoader) {
            this.svgLoader = null;
        }

        // dispose of the SVG data
        if (this.svg) {
            this.svg = null;
        }
    }
    
    }
