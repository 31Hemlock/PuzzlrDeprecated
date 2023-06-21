import * as THREE from 'three'
import { VertMarker } from './VertMarker';
import { PuzzleApp } from './PuzzleApp';
import { PieceGroup } from './PieceGroup'
import { willOverflow } from './utils'
import { findVector } from './utils.js';
import { rotationValues } from './constants'
import { rotateAny } from './utils'



export class Piece extends THREE.Mesh {
    constructor(geometry, material, vectors, num) {
      super(geometry, material);
      this.initVerts = vectors
      this.normalizedInitVerts = []
      this.previousRotation = this.rotation.z
      this.num = num
      this.name = num
      this.connectionDistance = [40, 40]
      this.castShadow = true

    }

    init() {
      this.setNormalizedInitVerts(this.initVerts).then(() => {
        this.setCurVerts()
        this.setDims()
      })
    }


    async setDims() {
      const meshBoundingBox = new THREE.Box3().setFromObject(this);

      // Calculate the width, height, and depth
      const size = new THREE.Vector3();
      meshBoundingBox.getSize(size);
      this.width = size.x;
      this.height = size.y;
      this.depth = size.z;

    }

    dispose() {
      this.removeEventListener('mousedown');
      // Dispose geometry
      if (this.geometry) {
        this.geometry.dispose();
      }
  
      // Dispose material
      if (this.material) {
        // If the material has any textures, dispose them as well
        if (this.material.map) {
          this.material.map.dispose();
        }
        if (this.material.normalMap) {
          this.material.normalMap.dispose();
        }
        if (this.material.specularMap) {
          this.material.specularMap.dispose();
        }
        if (this.material.envMap) {
          this.material.envMap.dispose();
        }
        if (this.material.alphaMap) {
          this.material.alphaMap.dispose();
        }
        if (this.material.lightMap) {
          this.material.lightMap.dispose();
        }
        if (this.material.aoMap) {
          this.material.aoMap.dispose();
        }
        if (this.material.emissiveMap) {
          this.material.emissiveMap.dispose();
        }
        if (this.material.gradientMap) {
          this.material.gradientMap.dispose();
        }
        if (this.material.displacementMap) {
          this.material.displacementMap.dispose();
        }
        if (this.material.bumpMap) {
          this.material.bumpMap.dispose();
        }
        if (this.material.metalnessMap) {
          this.material.metalnessMap.dispose();
        }
        if (this.material.roughnessMap) {
          this.material.roughnessMap.dispose();
        }
  
        // Dispose material
        this.material.dispose();

      }
    }
  
  

    moved(formGroup = true) {   
      this.setCurVerts().then(() => {
        if (formGroup) {
          this.checkFormGroup()
        }
      })
    }

    markVerts(verts) {
      for (let i=0;i<verts.length;i++) {
          let vert = new VertMarker(verts[i])
          vert.init()
      }
      let main = new PuzzleApp()
      main.render()
    }
    destroyVerts() {
      let main = new PuzzleApp()
      let scene = main.scene
      const children = scene.children;
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child instanceof VertMarker) {
          scene.remove(child);
        }
      }
    }


    rotate(direction) {
      rotateAny(this, direction)
    }
      
  

    // set this.positions to an array of objects containing original vertices
    // and their cur positions in 3d space according to rotations/translations.
    // this.initVerts = [{x: 57, y:13}, {x:92, y:93}, ...]
    // this.curVerts = [{x: 102, y: 34}, ...]
    // when forming a group, if this.currentPos and this.intialPos is identical, just delete the vertex.
    // this leaves us with only outside-facing vertices that can be paired. 
    // only question is whether just the vertex values are enough. last time created a .name property
    // because they were not enough. if this is the case, need to handle groups differently, and thus
    // need to handle pieces differently.

    setNormalizedInitVerts(verts) {
      return new Promise((resolve) => {

        this.lowestXVector = findVector('min', 'x', verts)
        this.lowestYVector = findVector('min', 'y', verts)
        this.highestXVector = findVector('max', 'x', verts)
        this.highestYVector = findVector('max', 'y', verts)

        this.xStartingBounds = [this.lowestXVector, this.highestXVector]
        this.yStartingBounds = [this.lowestYVector, this.highestYVector]
        
        for (let i=0;i<verts.length;i++) {
          // Subtract 0.5 to move from a range from 0->1 to a range from -0.5->0.5
          let normalizedStartingXVert = (verts[i].x - this.xStartingBounds[0]) / (this.xStartingBounds[1] - this.xStartingBounds[0]) - 0.5
          let normalizedStartingYVert = (verts[i].y - this.yStartingBounds[0]) / (this.yStartingBounds[1] - this.yStartingBounds[0]) - 0.5
          
          this.normalizedInitVerts.push({x: normalizedStartingXVert, y: normalizedStartingYVert})
        }
        resolve();
      })

    }

    setCurVerts() {
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
              const TOLERANCE = 0.0001; // adjust this as needed
              let otherPieceMatchingVertexIndex = otherPiece.initVerts.findIndex(({ x, y }) => Math.abs(x - matchingVertex.x) < TOLERANCE && Math.abs(y - matchingVertex.y) < TOLERANCE);
            let offset = new THREE.Vector3().subVectors(
                this.curVerts[this.initVerts.indexOf(matchingVertex)],
                otherPiece.curVerts[otherPieceMatchingVertexIndex]
              );
                if (Math.abs(offset.x) < this.connectionDistance[0] && Math.abs(offset.y) < this.connectionDistance[1]) {
                  console.log('group is gonna get formed now, from the piece perspective')
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