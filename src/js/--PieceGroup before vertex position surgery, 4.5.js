import * as THREE from 'three'
import { Piece } from './Piece.js'
import { findVector } from './utils.js';
import { VertMarker } from './VertMarker.js';
import { PuzzleApp } from './PuzzleApp.js';

export class PieceGroup extends THREE.Group {
    constructor(...pieces) {
        super()
        this.pieces = pieces
        this.normalizedInitVerts = []
        this.cols = []
        this.rows = []
        console.log(this.pieces)
    }

    async init() {
        // Create group and assign children
        await this.decomposeAndRecompose()
        // Create initial vertices
        await this.createVerts()
        await this.createCurVerts()
        await this.setStartingPosition()
        await this.setNormalizedInitVerts(this.initVerts)
        await this.setCurVerts()
    }
  
    // Add extra functionality to the Piece object here

    async setStartingPosition() {
        // const averagePosition = new THREE.Vector3();
        // this.pieces.forEach(child => averagePosition.add(child.position));
        // averagePosition.divideScalar(this.pieces.length);

        // for (let piece of this.pieces) {
        //     if (piece instanceof PieceGroup) {
        //         for (let child of piece.children) {
        //             this.cols.push(child.col)
        //             this.rows.push(child.row)
        //         }
        //     } else if (piece instanceof Piece) {
        //         this.cols.push(piece.col)
        //         this.rows.push(piece.row)
        //     }
        // }
        // let highestCol = Math.max(...this.cols)
        // let lowestCol = Math.min(...this.cols)
        // let highestRow = Math.max(...this.rows)
        // let lowestRow = Math.max(...this.rows)
        // let pieceHeight = 204.8
        // let pieceWidth = 143.2

        this.lowestXVector = findVector('min', 'x', this.curVerts)
        this.lowestYVector = findVector('min', 'y', this.curVerts)
        this.highestXVector = findVector('max', 'x', this.curVerts)
        this.highestYVector = findVector('max', 'y', this.curVerts)

        let x = (this.highestXVector - this.lowestXVector) / 2
        let y = (this.highestYVector - this.lowestYVector) / 2
        const averagePosition = new THREE.Vector3(x, y, 0);
        const amountOfMovement = this.position.add(averagePosition)
        console.log(amountOfMovement)
        this.position.copy(averagePosition)
        for (let child of this.children) {
            console.log(child.position)
            child.position.sub(amountOfMovement)
        }
        
        let main = new PuzzleApp()
        main.render()
    }

    async decomposeAndRecompose() {
        // Decompose both groups, then add all elements to this object.
        for (let piece of this.pieces) {
            if (piece instanceof PieceGroup) {
                for (let child of piece.children) {
                    this.cols.push(child.col)
                    this.rows.push(child.row)
                    this.attach(child)
                }
            } else if (piece instanceof Piece) {
                this.cols.push(piece.col)
                this.rows.push(piece.row)
                this.attach(piece)
                
            }
        }
        console.log(this)
        let main = new PuzzleApp()
        main.scene.add(this)
    }

    async createVerts() {
        let combined = []
        console.log(this.children)
        for (let piece of this.children) {
            combined.push(piece.initVerts)
            
        } 
        combined = combined.flat()

        let combinedSet = [...new Set(combined)] // consider removing duplicates entirely rather than collapsing here
        this.initVerts = Array.from(combinedSet)
        // combine all arrays into one


    }

    async createCurVerts() {
        let combined = []
        console.log(this.children)
        for (let piece of this.children) {
            combined.push(piece.curVerts)
            
        } 
        combined = combined.flat()

        let combinedSet = [...new Set(combined)] // consider removing duplicates entirely rather than collapsing here
        this.curVerts = Array.from(combinedSet)
        // combine all arrays into one
    }
    
    async setNormalizedInitVerts(verts) {
        console.log(verts)
        // this.lowestXVector = findVector('min', 'x', verts)
        // this.lowestYVector = findVector('min', 'y', verts)
        // this.highestXVector = findVector('max', 'x', verts)
        // this.highestYVector = findVector('max', 'y', verts)

        // this.lowCol = min(this.cols)
        // this.lowRow = min(this.rows)
        // this.highCol = max(this.cols)
        // this.highRow = max(this.rows)
  
        // Find the difference between our lowest x,y values and the floor values of where our piece can spawn
        // let realWidthOfPiece = lowestXVector -  (lowCol * this.width)
        // let realHeightOfPiece = lowestYVector - (lowRow * this.height)
  
        // Bottom end of our bound is bottom end of where piece can spawn + the lowest value from an actual point in the piece.
        // Top end is just the default spawn location of our piece +1 row/column.
  
        // this.xStartingBounds = [(lowCol * this.width) + realWidthOfPiece, (highCol + 1) * this.width] // need to use width of a piece instead of this.width
        // this.yStartingBounds = [(lowRow * this.height) + realHeightOfPiece, (highRow + 1) * this.height] // change to height of piece too
  
        this.xStartingBounds = [this.lowestXVector, this.highestXVector]
        this.yStartingBounds = [this.lowestYVector, this.highestYVector]
        
        for (let i=0;i<verts.length;i++) {
          // Subtract 0.5 to move from a range from 0->1 to a range from -0.5->0.5
          let normalizedStartingXVert = (verts[i].x - this.xStartingBounds[0]) / (this.xStartingBounds[1] - this.xStartingBounds[0]) - 0.5
          let normalizedStartingYVert = (verts[i].y - this.yStartingBounds[0]) / (this.yStartingBounds[1] - this.yStartingBounds[0]) - 0.5
          
          this.normalizedInitVerts.push({x: normalizedStartingXVert, y: normalizedStartingYVert})
        }
      }

      markVerts(verts) {
        for (let i=0;i<verts.length;i++) {
            let vert = new VertMarker(verts[i])
            vert.init()
        }
        let vert = new VertMarker({x: 0, y: 0})
        vert.init()
        let main = new PuzzleApp()
        main.render()
      }
  
  
  
    printExists() {
        console.log(this)
        console.log(this.newProp)
    }

    moved() {
        console.log(this)
        this.setCurVerts()

        this.markVerts(this.curVerts)
        let vert = new VertMarker(this.position, 0x00ff00)
        vert.init()
        let main = new PuzzleApp()
        main.render()
    }

    async setCurVerts() {
        console.log(this.normalizedInitVerts)
        return new Promise((resolve) => {
  
          this.curVerts = []
          for (let i=0;i<this.normalizedInitVerts.length;i++) {
  
            // We find the new location of the vertex by taking its normalized initial position (value between -0.5 -> 0.5) 
            // and multiplying it by the size of the area in which it began (something like 204.8->409.6)
            // to receive a value like 400.2. We then add this new value to the current mesh position to find the current
            // vertex position.
            // To apply rotation, we just applyAxisAngle on the z-axis in the rotation of this.rotation.z to the vertex.
            let newVert = new THREE.Vector3(
              (this.normalizedInitVerts[i].x * (this.xStartingBounds[1] - this.xStartingBounds[0])) + this.position.x,
              (this.normalizedInitVerts[i].y * (this.yStartingBounds[1] - this.yStartingBounds[0])) + this.position.y,
              0)
  
            newVert.sub(this.position).applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotation.z).add(this.position);
            this.curVerts.push(newVert) 
          }
          resolve();
        })
        }
  
        checkFormGroup() {
          let main = new PuzzleApp()
          for (let otherPiece of main.scene.children) {
            if ((otherPiece instanceof Piece || otherPiece instanceof PieceGroup) && 
                otherPiece !== this && Math.abs(otherPiece.rotation.z - this.rotation.z) < Number.EPSILON &&
                Math.abs(otherPiece.position.distanceTo(this.position)) < 200) {
        
              let matchingVertex = this.initVerts.find((vertex) => {
                let matchingOtherVertex = otherPiece.initVerts.find(({ x: otherX, y: otherY }) => vertex.x === otherX && vertex.y === otherY);
                return matchingOtherVertex !== undefined ? vertex : undefined;
              });
        
              if (matchingVertex) {
                let matchingOtherVertex = otherPiece.initVerts.find(({ x: otherX, y: otherY }) => matchingVertex.x === otherX && matchingVertex.y === otherY);
                let offset = new THREE.Vector3().subVectors(
                  this.curVerts[this.initVerts.indexOf(matchingVertex)],
                  otherPiece.curVerts[otherPiece.initVerts.indexOf(matchingOtherVertex)]
                );
                if (Math.abs(offset.x) < this.connectionDistance[0] && Math.abs(offset.y) < this.connectionDistance[1]) {
                    console.log('Moving to form a group')
                  this.position.sub(offset);
                  let newGroup = new PieceGroup(this, otherPiece)
                  newGroup.init()
                  main.render()
                  return;
                }
              }
            }
          }
        }
  
  }
  