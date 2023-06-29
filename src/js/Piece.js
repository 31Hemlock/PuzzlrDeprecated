import * as THREE from 'three'
import { VertMarker } from './VertMarker';
import { PuzzleApp } from './PuzzleApp';
import { PieceGroup } from './PieceGroup'
import { willOverflow } from './utils'
import { findVector } from './utils.js';
import { rotationValues } from './constants'
import { rotateAny } from './utils'


/**
 * Represents a single Piece object.
 * @class
 */
export class Piece extends THREE.Mesh {
    /**
     * @constructor
     * @param {THREE.ExtrudeGeometry} geometry - Represents the Piece's bounds.
     * @param {THREE.MeshBasicMaterial} material - Represents how the Piece is textured.
     * @param {array} vectors - Represents the initial vertices of the Piece.
     * @param {number} num - Represents the number of Piece being made.
     */
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

    /**
     * Initializes the object. Creates normalized initial vertices,
     * sets the current vertex positions, and creates the piece dimension attributes.
     * 
     * @method
     * @return {void}
     */
    init() {
      this.setNormalizedInitVerts(this.initVerts).then(() => {
        this.setCurVerts()
        this.setDims()
      })
    }

    /**
     * Creates the piece dimension attributes.
     * 
     * @async
     * @return {void}
     */
    async setDims() {
      const meshBoundingBox = new THREE.Box3().setFromObject(this);

      // Calculate the width, height, and depth
      const size = new THREE.Vector3();
      meshBoundingBox.getSize(size);
      this.width = size.x;
      this.height = size.y;
      this.depth = size.z;

    }

    /**
     * Entirely disposes of a Piece object and all its component parts.
     * 
     * @method
     * @return {void}
     */
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
  
    /**
     * Updates a Piece object's current vertex locations and checks
     * whether a group should be formed.
     * 
     * @param {boolean} formGroup - Whether a group should be allowed to be formed or not.
     * @return {void}
     */
    moved(formGroup = true) {   
      this.setCurVerts().then(() => {
        if (formGroup) {
          this.checkFormGroup()
        }
      })
    }

    /**
     * Debug function for marking the location of vertices.
     * 
     * @method
     * @param {array} verts - Array of vertices of the object to mark.
     * @return {void}
     */
    markVerts(verts) {
      for (let i=0;i<verts.length;i++) {
          let vert = new VertMarker(verts[i])
          vert.init()
      }
      let main = new PuzzleApp()
      main.render()
    }
    
    /**
     * Debug function for removing the spheres representing piece vertices.
     * 
     * @method
     * @return {void}
     */
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

    /**
     * Rotates this piece in a certain direction (left or right).
     * 
     * @method
     * @param {string} direction - Direction of rotation (left or right).
     * @return {void}
     */
    rotate(direction) {
      rotateAny(this, direction)
    }
  
    /**
     * Normalizes the initial vertices of the piece to a value within [-0.5, 0.5]
     * and places them within the normalizedInitVerts object attribute.
     * 
     * @method
     * @param {array} verts - The initial vertices of the piece.
     * @return {Promise} - Resolves when the vertices are normalized and set.
     */
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

    /**
     * Sets the current vertices of the object and places them within the
     * curVerts object attribute.
     * 
     * @method
     * @return {Promise} - Resolves when the vertices are set.
     */
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

      /**
       * Checks whether a group should be formed, and if so, forms the group by
       * creating a new PieceGroup object from the requisite pieces.
       * 
       * @async
       * @return {boolean}
       */
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
              const TOLERANCE = 0.0001; // Adjust to change required distance between pieces to form a group
              let otherPieceMatchingVertexIndex = otherPiece.initVerts.findIndex(({ x, y }) => Math.abs(x - matchingVertex.x) < TOLERANCE && Math.abs(y - matchingVertex.y) < TOLERANCE);
            let offset = new THREE.Vector3().subVectors(
                this.curVerts[this.initVerts.indexOf(matchingVertex)],
                otherPiece.curVerts[otherPieceMatchingVertexIndex]
              );
                if (Math.abs(offset.x) < this.connectionDistance[0] && Math.abs(offset.y) < this.connectionDistance[1]) {
                this.position.sub(offset);
                await this.setCurVerts();
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
          const groupCreated = await processPiece(otherPiece);
          if (groupCreated) break;
        }
      }
}