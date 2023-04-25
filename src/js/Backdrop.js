import * as THREE from 'three'


export class Backdrop {
    constructor(scene) {
        this.scene = scene;
        // this.scene.background = new THREE.Color(0xFFFF00)
        this.movingMeshes = this.createMovingMeshes();
        this.movingMeshes.forEach(mesh => this.scene.add(mesh));
    }
  
    createMovingMeshes() {
      // Create an array of moving meshes
      const movingMeshes = [];
      const geometry = new THREE.BoxGeometry(5, 5, 5);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
      for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(Math.random() * 100 - 5, Math.random() * 100 - 5, 0);
        movingMeshes.push(mesh);
      }
  
      return movingMeshes;
    }
  
    update() {
      // Animate the moving meshes
      this.movingMeshes.forEach(mesh => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });
    }

  }
  