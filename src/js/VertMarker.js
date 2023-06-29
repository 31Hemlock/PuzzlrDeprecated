//debug class
import * as THREE from 'three'
import {
  PuzzleApp
} from './PuzzleApp.js'


/**
 * Debug class.
 * Creates spheres to signify the location of vertices in 3d space.
 * @class
 */
export class VertMarker extends THREE.Mesh{
  /**
   * @constructor
   * @param {THREE.Vector3} vertPosition - The position of the vertex to be signified.
   * @param {number} [color=0x8ffff] - The color of the sphere to be created.
   * @param {number} [size=7] - The size of the sphere to be created.
   */
  constructor(vertPosition, color = 0x8ffff, size=7) {

      let geometry = new THREE.SphereGeometry(size,size,size)
      let material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        depthWrite: true,
        color: color,
        transparent: true,
        opacity: 0.4
                    })
      super(geometry, material);

      this.vertPosition = vertPosition;
      this.name = "vertMarker"
    }

/**
 * Initializes the vertex and adds it to the scene.
 * 
 * @method
 * @return {void}
 */
  init() {
    this.position.set(this.vertPosition.x, this.vertPosition.y, 25);
    let main = new PuzzleApp()
    main.scene.add(this)
  } 

  


}