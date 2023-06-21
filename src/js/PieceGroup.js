import * as THREE from 'three'
import { Piece } from './Piece.js'
import { findVector } from './utils.js';
import { VertMarker } from './VertMarker';
import { PuzzleApp } from './PuzzleApp';
import { rotationValues } from './constants'
import { rotateAny } from './utils.js'
import * as TWEEN from '@tweenjs/tween.js';


export class PieceGroup extends THREE.Group {
    constructor(...pieces) {
        super()
        this.pieces = pieces
        this.normalizedInitVerts = []
        this.connectionDistance = [40, 40]
    }

    async init() {
        await this.createVerts()
        await this.createCurVerts()
        await this.decomposeAndRecompose()

        await this.setNormalizedInitVerts(this.initVerts)

        await this.setStartingPosition()
        await this.setDims()
        await this.playGroupSound()

            }


    async setDims() {
      const mergedBoundingBox = new THREE.Box3();

      // Loop through each mesh in the group
      this.traverse((object) => {
          // Create a bounding box for the current mesh
          const meshBoundingBox = new THREE.Box3().setFromObject(object);
          // Merge the current mesh's bounding box with the main bounding box
          mergedBoundingBox.union(meshBoundingBox);

      });

      // Calculate the width, height, and depth
      const size = new THREE.Vector3();
      mergedBoundingBox.getSize(size);
      this.width = size.x;
      this.height = size.y;
      this.depth = size.z;

    }


    playGroupSound() {
      console.log('group sound')
      // get total number of puzzle pieces, get number of pieces passed as args to this function, use ratio to play sound
      const main = new PuzzleApp()
      let currentPieces = this.children.length
      const pieceRatio = currentPieces / main.totalPieces
      console.log(pieceRatio)
      if (main.mainMenu.settingSound.checked) {
        console.log(pieceRatio)
        switch(true) {
          case pieceRatio == 1:
            main.playSound(7)
            this.winAnimation()
            break; 
          case pieceRatio > 0.85:
            main.playSound(6)
            this.pairAnimation(main.pairingColors[6], 7)
            break;
          case pieceRatio > 0.68:
            main.playSound(5)
            this.pairAnimation(main.pairingColors[4], 5)
            break;
          case pieceRatio > 0.51:
            main.playSound(4)
            this.pairAnimation(main.pairingColors[3], 4)
            break;
          case pieceRatio > 0.34:
            main.playSound(3)
            this.pairAnimation(main.pairingColors[2], 3)
            break;
          case pieceRatio > 0.17:
            main.playSound(2)
            this.pairAnimation(main.pairingColors[1], 2)
            break;
          case pieceRatio > 0:
            main.playSound(1)
            this.pairAnimation(main.pairingColors[0], 1)
            break;
        }
  
      }

    }

    countPieces(...pieces) {
      let count = 0;
      pieces.flat().forEach((piece) => {
        if (piece instanceof Piece) {
          count++;
        } else if (piece instanceof PieceGroup) {
          count += this.countPieces(...piece.children);
        }
      });
      return count;
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
                  let newMaterial = child.material.clone()
                  newMaterial.depthWrite = true;
                  child.material = newMaterial;
                  child.position.copy(child.getWorldPosition(new THREE.Vector3()));
                  child.rotation.copy(piece.rotation);
                  piece.remove(child)
                  this.add(child)
              }
              piece.destruct()
          } else if (piece instanceof Piece) {
              let newMaterial = piece.material.clone()
              newMaterial.depthWrite = true;
              piece.material = newMaterial;
              this.add(piece)
          }
      }
      let main = new PuzzleApp()
      main.scene.add(this)
  }  

    async createVerts() {
        let combined = []
        for (let piece of this.pieces) {
            // Set scale to 1 to prevent animation bugs
            piece.scale.set(1,1,1)
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
  
    moved() {
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

    pairAnimation(color, strength) {
      let main = new PuzzleApp();
      main.outlinePassSuccess.selectedObjects = [this];
      let glowColor = new THREE.Color(color);
      // Check if an animation is in progress and stop it
      if (this.fadeInTween && this.fadeOutTween) {
        this.fadeInTween.stop();
        this.fadeOutTween.stop();
      }
      
      // Define the initial and final values for the outlinePassSuccess's edge strength
      let fromValue = { edgeStrength: 0, scale: 1 };
      let midValue = { edgeStrength: strength, scale: 1.02 };
      let toValue = { edgeStrength: 0, scale: 1 };
      main.outlinePassSuccess.visibleEdgeColor.set(glowColor);
      console.log(main.outlinePassSuccess)
      console.log(glowColor)
      this.fadeInTween = new TWEEN.Tween(fromValue)
        .to(midValue, 400) // Duration of 500 milliseconds for fadeIn
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          main.outlinePassSuccess.edgeStrength = fromValue.edgeStrength;
          this.scale.set(fromValue.scale, fromValue.scale, fromValue.scale);
        });
    
      this.fadeOutTween = new TWEEN.Tween(midValue)
        .to(toValue, 400) // Duration of 500 milliseconds for fadeOut
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          main.outlinePassSuccess.edgeStrength = midValue.edgeStrength;
          this.scale.set(midValue.scale, midValue.scale, midValue.scale);
        })
        .onComplete(() => {
          // Clear selectedObjects after the animation is complete
          main.outlinePassSuccess.selectedObjects = [];
          main.outlinePassSuccess.edgeStrength = strength;
          this.scale.set(1, 1, 1);
        });
    
      // Stop the ongoing animation if a new group is formed
      this.fadeInTween.chain(this.fadeOutTween);
      this.fadeInTween.start();
    }


    winAnimation() {
      let main = new PuzzleApp();
      main.outlinePassSuccess.selectedObjects = [this];
    
      // Check if an animation is in progress and stop it
      if (this.fadeInTween && this.fadeOutTween) {
        this.fadeInTween.stop();
        this.fadeOutTween.stop();
      }
    
      // Define the initial and final values for the outlinePassSuccess's edge strength
      let fromValue = { edgeStrength: 0, scale: 1 };
      let midValue = { edgeStrength: 5, scale: 1.2 };
      let toValue = { edgeStrength: 0, scale: 1 };

      
      let firstRotate = {rotation: 0}
      let lastRotate = {rotation: 2 * Math.PI}
      this.fadeInTween = new TWEEN.Tween(fromValue)
        .to(midValue, 300) // Duration of 500 milliseconds for fadeIn
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(() => {
          main.outlinePassSuccess.edgeStrength = fromValue.edgeStrength;
          main.outlinePassSuccess.pulsePeriod = 3
          this.scale.set(fromValue.scale, fromValue.scale, fromValue.scale);
        });
    
      this.fadeOutTween = new TWEEN.Tween(midValue)
      .to(toValue, 1200) // Duration of 500 milliseconds for fadeOut
      .easing(TWEEN.Easing.Cubic.InOut)
      .onUpdate(() => {
        main.outlinePassSuccess.edgeStrength = midValue.edgeStrength;
        this.scale.set(midValue.scale, midValue.scale, midValue.scale);
      })
      .onComplete(() => {
        // Clear selectedObjects after the animation is complete
        main.outlinePassSuccess.selectedObjects = [];
        main.outlinePassSuccess.edgeStrength = 5;
        this.scale.set(1, 1, 1);
      });

      // this.rotateTween = new TWEEN.Tween(firstRotate)
      //   .to(lastRotate, 1000) // Duration of 500 milliseconds for fadeOut
      //   .easing(TWEEN.Easing.Quadratic.Out)
      //   .onUpdate(() => {
      //     for (let child of this.children) {
      //       child.rotation.x = firstRotate.rotation;
      //       child.rotation.y = firstRotate.rotation;

      //     }
          
      //   })
      //   .onComplete(() => {
      //     // Clear selectedObjects after the animation is complete
      //     // main.outlinePassSuccess.selectedObjects = [];
      //     // main.outlinePassSuccess.edgeStrength = main.successEdgeStrength;
      //     // this.scale.set(1, 1, 1);
      //   });
    
      // Stop the ongoing animation if a new group is formed
      // this.fadeInTween.chain(this.rotateTween);
      this.fadeInTween.chain(this.fadeOutTween);
      this.fadeInTween.start();
      this.danceAllPieces()
      let inactivityTimer;
      let isTimerRunning = false;
      
      function startTimer() {
          // Only start the timer if it's not already running
          if (!isTimerRunning) {
              inactivityTimer = setTimeout(function() {
                  main.mainMenu.open();
              }, 2000);
              isTimerRunning = true;
          }
      }
      
      function resetTimer() {
          // If the timer is running, clear it and start a new one
          if (isTimerRunning) {
              clearTimeout(inactivityTimer);
              inactivityTimer = setTimeout(function() {
                isTimerRunning = false;
                  main.mainMenu.open();
              }, 2000);
          }
      }
      
      // Attach event listeners to the window to listen for activity
      window.addEventListener('keydown', resetTimer);
      window.addEventListener('wheel', resetTimer);
      
      // Start the timer at some point
      // For example, after a button is clicked:
      startTimer()

      
      // this.rotateTween.start()

    }

    danceAllPieces() {
      console.log('dance')
      let largestDistance = -Infinity;
      let referencePoint;
    
      for (const child of this.children) {
        const childPos = new THREE.Vector2(child.position.x, child.position.y);
        const distance = childPos.length();
    
        if (distance > largestDistance) {
          largestDistance = distance;
          referencePoint = childPos;
        }
      }
    
      const sortedChildren = [];
      console.log(this.children)
      for (let child of this.children) {
        const childPos = new THREE.Vector2(child.position.x, child.position.y);
        const distance = childPos.distanceTo(referencePoint);
        const distanceChildPair = { distance, child };
        console.log(distanceChildPair)
        let index = sortedChildren.findIndex(pair => pair.distance < distance);
        if (index === -1) {
          sortedChildren.push(distanceChildPair);
        } else {
          sortedChildren.splice(index, 0, distanceChildPair);
        }
      }
      console.log(sortedChildren)
      // Extract only children from the sorted array (removing distance)
      const childrenSorted = sortedChildren.map(pair => pair.child);
      console.log(childrenSorted)
      childrenSorted.forEach((child, index) => {
        const delay = index * 25; // 0.1 second stagger
        this.animateChild(child, delay);
      });
    }
        
    animateChild(child, delay) {
      console.log('alors')
      let firstRotate = {rotation: 0};
      let lastRotate = {rotation: 2 * Math.PI};
    
      this.objAnimTween = new TWEEN.Tween(firstRotate)
        .to(lastRotate, 1700) // Customize duration (1000ms = 1 second)
        .delay(delay)
        .easing(TWEEN.Easing.Quadratic.Out) // Customize easing function
        .onUpdate(() => {
          // Update the child's rotation in the scene
          // child.rotation.x = firstRotate.rotation; // You should set the value of the rotation property instead of the whole object
          child.rotation.y = firstRotate.rotation; // You should set the value of the rotation property instead of the whole object
        })
        .start();
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
                console.log(matchingVertex)
                const TOLERANCE = 0.01; // adjust this as needed
                let otherPieceMatchingVertexIndex = otherPiece.initVerts.findIndex(({ x, y }) => Math.abs(x - matchingVertex.x) < TOLERANCE && Math.abs(y - matchingVertex.y) < TOLERANCE);
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
  