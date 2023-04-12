import * as THREE from 'three'
import { Piece } from './Piece.js'
import { findVector } from './utils.js';
import { VertMarker } from './VertMarker';
import { PuzzleApp } from './PuzzleApp';
import { rotationValues } from './constants'
import { rotateAny } from './utils.js'


export class PieceGroup extends THREE.Group {
    constructor(...pieces) {
        super()
        this.pieces = pieces
        this.normalizedInitVerts = []
        this.connectionDistance = [25, 25]
    }

    async init() {
        await this.createVerts()
        await this.createCurVerts()
        await this.decomposeAndRecompose()
        await this.setNormalizedInitVerts(this.initVerts)
        await this.setStartingPosition()
    }

    dispose() {
      // Dispose of each piece in the group
      for (const child of this.children) {
        let main = new PuzzleApp()
        // Remove any event listeners if necessary
        // e.g. piece.removeEventListener('mousedown', onMouseDown);
  
        // Call the piece's dispose method
        child.dispose();
        main.scene.remove(child)
        // Remove the piece from the group
        this.remove(child);
      }
  
      // Clear the pieces array
      this.pieces.length = 0;
    }
  

    // Add extra functionality to the Piece object here

    async setStartingPosition() {
      this.lowestXVector = findVector('min', 'x', this.curVerts)
      this.lowestYVector = findVector('min', 'y', this.curVerts)
      this.highestXVector = findVector('max', 'x', this.curVerts)
      this.highestYVector = findVector('max', 'y', this.curVerts)
  
      let x = (this.highestXVector + this.lowestXVector) / 2
      let y = (this.highestYVector + this.lowestYVector) / 2
      const averagePosition = new THREE.Vector3(x, y, 0);
      const newGroupLocation = this.position.add(averagePosition)
      this.position.copy(newGroupLocation)
  
      let averageRotation = new THREE.Euler(0, 0, 0);
      let childCount = 0;
      for (let child of this.children) {
          childCount++;
  
          // Calculate the average rotation of child elements
          averageRotation.x += child.rotation.x;
          averageRotation.y += child.rotation.y;
          averageRotation.z += child.rotation.z;
  
          child.position.sub(newGroupLocation);
        }
  
      if (childCount > 0) {
          // Calculate the average rotation
          averageRotation.x /= childCount;
          averageRotation.y /= childCount;
          averageRotation.z /= childCount;
  
          // Apply the average rotation to the group element
          this.rotation.copy(averageRotation);
  
          // Reset the rotation of each child element without changing their world positions
          for (let child of this.children) {
              // Create a matrix to store the inverse rotation of the group
              let inverseGroupRotationMatrix = new THREE.Matrix4().copy(new THREE.Matrix4().makeRotationFromEuler(this.rotation)).invert();
  
              // Calculate the new child position in the local coordinate system of the group
              let newPosition = child.position.clone().applyMatrix4(inverseGroupRotationMatrix);
  
              // Apply the new position and reset the rotation
              child.position.copy(newPosition);
              child.rotation.set(0, 0, 0);
          }
      }
      let main = new PuzzleApp()
      main.render()
  }

    destruct() {
      if (this.parent) {
        this.parent.remove(this)
      }
      this.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof Piece) {
          child.geometry.dispose();
          child.material.dispose();  
        }
      })
    }

    async decomposeAndRecompose() {
      // Decompose both groups, then add all elements to this object.
      // this.rotation.copy(this.pieces[0].rotation)
      for (let piece of this.pieces) {
          if (piece instanceof PieceGroup) {
              for (let child of piece.children.slice()) {
                  child.position.copy(child.getWorldPosition(new THREE.Vector3()));
                  child.rotation.copy(piece.rotation);
                  piece.remove(child)
                  this.add(child)
              }
              piece.destruct()
          } else if (piece instanceof Piece) {
              this.add(piece)
          }
      }
      let main = new PuzzleApp()
      main.scene.add(this)
  }  

    async createVerts() {
        let combined = []
        for (let piece of this.pieces) {
            combined.push(piece.initVerts)
            
        }
        
        combined = combined.flat()

        let combinedSet = [...new Set(combined)] // consider removing duplicates entirely rather than collapsing here
        this.initVerts = Array.from(combinedSet)
        // combine all arrays into one


    }

    async createCurVerts() {
        let combined = []
        for (let piece of this.pieces) {
            combined.push(piece.curVerts)
            
        } 
        combined = combined.flat()

        let combinedSet = [...new Set(combined)] // consider removing duplicates entirely rather than collapsing here
        this.curVerts = Array.from(combinedSet)
        // combine all arrays into one
    }
    
    async setNormalizedInitVerts(verts) {
        let lowestXVector = findVector('min', 'x', verts)
        let lowestYVector = findVector('min', 'y', verts)
        let highestXVector = findVector('max', 'x', verts)
        let highestYVector = findVector('max', 'y', verts)

        // this.lowCol = min(this.cols)
        // this.lowRow = min(this.rows)
        // this.highCol = max(this.cols)
        // this.highRow = max(this.rows)
  
        // Find the difference between our lowest x,y values and the floor values of where our piece can spawn
        // let realWidthOfPiece = lowestXVector -  (lowCol * this.width)
        // let realHeightOfPiece = lowestYVector - (lowRow * this.height)
  
        // Bottom end of our bound is bottom end of where piece can spawn + the lowest value from an actual point in the piece.
        // Top end is just the default spawn location of our piece +1 row/column.
  
        // this.xInitBounds = [(lowCol * this.width) + realWidthOfPiece, (highCol + 1) * this.width] // need to use width of a piece instead of this.width
        // this.yInitBounds = [(lowRow * this.height) + realHeightOfPiece, (highRow + 1) * this.height] // change to height of piece too
  
        this.xInitBounds = [lowestXVector, highestXVector]
        this.yInitBounds = [lowestYVector, highestYVector]
        
        for (let i=0;i<verts.length;i++) {
          // Subtract 0.5 to move from a range from 0->1 to a range from -0.5->0.5
          let normalizedStartingXVert = (verts[i].x - this.xInitBounds[0]) / (this.xInitBounds[1] - this.xInitBounds[0]) - 0.5
          let normalizedStartingYVert = (verts[i].y - this.yInitBounds[0]) / (this.yInitBounds[1] - this.yInitBounds[0]) - 0.5
          
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
        console.log(this.children)
        this.setCurVerts().then(() => {
            let main = new PuzzleApp()
            console.log(main.scene)
            this.checkFormGroup()
            main.render()
        })
    }

    rotate(direction) {
      rotateAny(this, direction)  
    }
  
    async setCurVerts() {
        return new Promise((resolve) => {
  
          this.curVerts = []
          for (let i=0;i<this.normalizedInitVerts.length;i++) {
  
            // We find the new location of the vertex by taking its normalized initial position (value between -0.5 -> 0.5) 
            // and multiplying it by the size of the area in which it began (something like 204.8->409.6)
            // to receive a value like 400.2. We then add this new value to the current mesh position to find the current
            // vertex position.
            // To apply rotation, we just applyAxisAngle on the z-axis in the rotation of this.rotation.z to the vertex.
            let newVert = new THREE.Vector3(
              (this.normalizedInitVerts[i].x * (this.xInitBounds[1] - this.xInitBounds[0])) + this.position.x,
              (this.normalizedInitVerts[i].y * (this.yInitBounds[1] - this.yInitBounds[0])) + this.position.y,
              0)
  
            newVert.sub(this.position).applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotation.z).add(this.position);
            this.curVerts.push(newVert) 
          }
          resolve();
        })
        }
        
        async checkFormGroup() {
          let main = new PuzzleApp();
        
          const processPiece = async (otherPiece) => {
            if (
              (otherPiece instanceof Piece || otherPiece instanceof PieceGroup) &&
              otherPiece !== this &&
              Math.abs(otherPiece.rotation.z - this.rotation.z) < Number.EPSILON
            ) {
              let matchingVertex = this.initVerts.find((vertex) => {
                let matchingOtherVertex = otherPiece.initVerts.find(({ x: otherX, y: otherY }) => vertex.x === otherX && vertex.y === otherY);
                return matchingOtherVertex !== undefined ? vertex : undefined;
              });
              if (matchingVertex) {    
                let otherPieceMatchingVertexIndex = otherPiece.initVerts.findIndex(({ x, y }) => x === matchingVertex.x && y === matchingVertex.y);
                let offset = new THREE.Vector3().subVectors(
                  this.curVerts[this.initVerts.indexOf(matchingVertex)],
                  otherPiece.curVerts[otherPieceMatchingVertexIndex]
                );
                  if (Math.abs(offset.x) < this.connectionDistance[0] && Math.abs(offset.y) < this.connectionDistance[1]) {
                    console.log('New group is gonna get formed now.')
                  this.position.sub(offset);
                  await this.setCurVerts(); // Use 'await' to ensure completion before moving on
                  let newGroup = new PieceGroup(this, otherPiece);
                  newGroup.init();
                  main.render();
                  return true; // Return true when a group is created
                }
              }
            }
            return false;
          };
        
          for (let otherPiece of main.scene.children) {
            const groupCreated = await processPiece(otherPiece); // Use 'await' to ensure completion before the next iteration
            if (groupCreated) break;
          }
        }
    }
  