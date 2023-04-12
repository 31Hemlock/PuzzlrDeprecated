//debug class
import * as THREE from 'three'
import {
  PuzzleApp
} from './PuzzleApp.js'


export class VertMarker extends THREE.Mesh{
    constructor(vertPosition, color = 0x8ffff, size=3) {

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


      init() {
        this.position.set(this.vertPosition.x, this.vertPosition.y, 25);
        let main = new PuzzleApp()
        main.scene.add(this)
      } 

  


}