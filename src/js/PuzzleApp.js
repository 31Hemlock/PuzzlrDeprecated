import * as THREE from 'three'
import { DragControls } from './editedDragControls.js'
import { Piece } from './Piece.js'
import { PieceGroup } from './PieceGroup.js'
import { Puzzle } from './Puzzle.js'
import { VertMarker } from './VertMarker.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import {
    TexturePrep
} from './TexturePrep.js'
import {
    PuzzleSVG
} from './PuzzleSVG.js'
import {
    MainMenu
} from './MainMenu.js'
import  {
    ImagePreview
} from './ImagePreview'
import * as utils from './utils.js'




let instance = null

export class PuzzleApp {
    constructor(container) {
        if (instance) {
            return instance
        }
        instance = this
        this.container = container;
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
        this.ambientLight = new THREE.AmbientLight(0x505050)
        this.spotLight = new THREE.SpotLight(0xffffff, 1.5);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.mainMenu = new MainMenu()


        this.startTime = performance.now()

        // set some initial values
        this.scene.background = new THREE.Color(0xf0f0f0)
        this.camera.position.set(0, 0, 1000)

        this.spotLight.position.set(0, 0, 50)
        this.spotLight.angle = Math.PI / 9;
        this.spotLight.castShadow = true;
        this.spotLight.shadow.camera.near = 1000;
        this.spotLight.shadow.camera.far = 4000;
        this.spotLight.shadow.mapSize.width = 1024;
        this.spotLight.shadow.mapSize.height = 1024;

        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        this.scene.background = new THREE.Color(0xf0f0f0)
        // add everything to the scene
        this.scene.add(this.camera);
        this.scene.add(this.ambientLight)
        this.scene.add(this.spotLight)
        this.container.appendChild(this.renderer.domElement)
        window.addEventListener('resize', this.#onWindowResize.bind(this))
        window.addEventListener('keydown', this.#onKeyDown.bind(this))

        // Middle mouse handling
        window.addEventListener('mousedown', this.#onMouseDown.bind(this))
        window.addEventListener('mousemove', this.#onMouseMove.bind(this))
        window.addEventListener('mouseup', this.#onMouseUp.bind(this))
        window.addEventListener('wheel', this.#onWheel.bind(this))
        const urlForm = document.getElementById("url-form");
        urlForm.addEventListener('submit', this.#onFormSubmit.bind(this))

        //Postprocessing
        // When adding a composer to the scene, the following bug occurs:
        // When the window is loaded in a small resolution and then resized to be a large resolution,
        // the textures of the pieces become blurry. To prevent this, have to set the size of the renderer
        // to the maximum expected size of the window before creating the EffectComposer. Can reset it afterwards.
        this.renderer.setSize(2560, 1440)
        this.composer = new EffectComposer( this.renderer )
        this.renderer.setSize(window.innerWidth, window.innerHeight) // set back to window size

        this.renderPass = new RenderPass( this.scene, this.camera )
        this.composer.addPass( this.renderPass )

        this.outlinePass = new OutlinePass ( new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
        this.outlinePass.visibleEdgeColor.set(0xFFD700);
        this.outlinePass.edgeThickness = 1;
        this.outlinePass.edgeStrength = 2;
        this.outlinePass.edgeGlow = 0.2;
        this.outlinePass.enabled = true;
        this.composer.addPass(this.outlinePass)
        this.animate()

        // Middle mouse handling
        this.isMiddleButtonDown = false
        this.lastMouseX = 0
        this.lastMouseY = 0
        this.deltaCameraZ = 0
        
        this.init()

        this.mainMenu.input.addEventListener('change', (event) => {
            console.log('event occurred')
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                this.makeNewPuzzle(reader.result)    
            });
        
            reader.readAsDataURL(file);

        })

        utils.loadImages()

        }

    async init(image = 'images/7Cw2iDV.jpeg') {

        if (this.imagePreview) {
            this.imagePreview.setSource(image)
        } else {
            this.imagePreview = new ImagePreview(image)
        }

        let texturePrepper = new TexturePrep(image)
        let texture = await texturePrepper.init()
        console.log(texture)
        let avg_size = (texture.image.width + texture.image.height) / 2
        let piece_size = avg_size / 100

        let total_pieces = Math.min(Math.floor(texture.image.width / piece_size) * Math.floor(texture.image.height / piece_size), 20)
        let wideReps = Math.ceil(Math.sqrt(total_pieces * (texture.image.width / texture.image.height)))
        let highReps = Math.ceil(Math.sqrt(total_pieces * (texture.image.height / texture.image.width)))
        console.log(wideReps, highReps)
        const svgFile = new PuzzleSVG(texture.image.width, texture.image.height, wideReps, highReps)
        const svgData = svgFile.create()

        this.puzzle = new Puzzle(svgData, texture)
        // this.scene.add(this.puzzle.getThumbMesh())
        this.camera.position.z = Math.max(this.puzzle.texture.image.width, this.puzzle.texture.image.height)
        console.log(this.camera.position.z)
        const puzzlePieces = this.puzzle.createPieces()
        puzzlePieces.forEach(piece => {
            this.scene.add(piece);
        })
        this.initDragControls()
        this.render()


        
        // const svgData = fetch('./geography/wikirealsvg.svg').then(response => response.text()).then(data => {
        //     const viewbox = data;
        //     const vWidth = viewbox.width;
        //     const vHeight = viewbox.height;
        //     this.puzzle = new Puzzle(data, texture)
        //     this.scene.add(this.puzzle.getThumbMesh())
        
        //     const puzzlePieces = this.puzzle.createPieces()
        //     puzzlePieces.forEach(piece => {
        //         this.scene.add(piece);
        //     })
        //     this.initDragControls()
        //     this.render()
    
        // })

    
    }

    makeNewPuzzle(image) {
        this.clearBoard()
        this.init(image)
    }

    clearBoard() {
        console.log(this.scene)
        // Remove all objects from the scene
        for (let i=this.scene.children.length; i>=0; i--) {
            if (this.scene.children[i] instanceof Piece || 
                this.scene.children[i] instanceof PieceGroup) {
                this.scene.children[i].dispose()
                this.scene.remove(this.scene.children[i]);
                } else if (this.scene.children[i] instanceof THREE.Mesh) {
                    this.disposeMesh(this.scene.children[i])
                    this.scene.remove(this.scene.children[i])
                }
        }

        // Dispose of all geometries
        this.renderer.dispose();

        // Dispose of all materials
        this.renderer.renderLists.dispose();

        this.removeDragControls()

        // Remove event listeners
        window.removeEventListener('resize', this.#onWindowResize.bind(this))
        window.removeEventListener('keydown', this.#onKeyDown.bind(this))
        window.removeEventListener('dragstart', this.#dragStart.bind(this))

        // Middle mouse handling
        window.removeEventListener('mousedown', this.#onMouseDown.bind(this))
        window.removeEventListener('mousemove', this.#onMouseMove.bind(this))
        window.removeEventListener('mouseup', this.#onMouseUp.bind(this))
        window.removeEventListener('wheel', this.#onWheel.bind(this))
        const urlForm = document.getElementById("url-form");

        // this.renderPass = null
        // this.outlinePass = null
        // this.puzzle = null

        console.log(this)
              
    }

    disposeMesh(mesh) {
        // Dispose of geometry
        if (mesh?.geometry) {
          mesh.geometry.dispose();
        }
      
        // Dispose of material
        if (mesh?.material) {
          // If the material is an array, loop through and dispose of each one
          if (Array.isArray(mesh.material)) {
            for (const material of mesh.material) {
              this.disposeMaterial(material);
            }
          } else {
            this.disposeMaterial(mesh.material);
          }
        }
      }
      
      disposeMaterial(material) {
        // Dispose of any textures used by the material
        if (material.map) {
          material.map.dispose();
        }
        if (material.normalMap) {
          material.normalMap.dispose();
        }
        if (material.specularMap) {
          material.specularMap.dispose();
        }
        // ... and so on for other textures
      
        // Dispose of the material itself
        material.dispose();
      }
      

    animate() {
        requestAnimationFrame(() => this.animate());
    
        // Calculate the time since the last frame and update elapsedTime
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.startTime) * 0.001; // Convert to seconds
        this.elapsedTime += deltaTime;
    
        // Call the tick function with deltaTime as an argument
        this.tick(deltaTime);
    

        // Render the scene
        this.render()
        // Render the postprocessing
        this.composer.render();

      }
        
      tick(deltaTime) {
        if (this.dragActiveObj) {
            // console.log(deltaObjTime)   
            this.dragActiveObj.position.z = this.mapElapsedTime(deltaTime)
            this.render() 
        }

        // console.log(this.mapElapsedTime(deltaObjTime))
        // event.object.position.z = this.mapElapsedTime(deltaTime)

    }

    removeDragControls() {
        if (this.controls) {
            // this.controls.removeEventListener('dragstart', this.#dragStart.bind(this))
            // this.controls.removeEventListener('drag', this.#onDrag.bind(this));
            // this.controls.removeEventListener('dragend', this.#onDragEnd.bind(this)) 
            // Clear the objects list in DragControls
            // this.controls.setObjects([]);   
            this.controls.dispose();
            this.controls = null;
        }

    }

    initDragControls() {
        let draggableObjects = this.scene.children.filter(child => {
            return (child instanceof Piece) || (child instanceof PieceGroup)
        })
        this.controls = new DragControls(draggableObjects, this.camera, this.renderer.domElement)
        this.controls.addEventListener('dragstart', this.#dragStart.bind(this))
        this.controls.addEventListener('drag', this.#onDrag.bind(this));
        this.controls.addEventListener('dragend', this.#onDragEnd.bind(this))
    }


    #onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.render(this.scene, this.camera)
        // this.puzzle.texture.needsUpdate = true;


        this.updateTextures(this.scene);

    }

    #dragStart(event) {
        this.outlinePass.selectedObjects = [event.object]
        this.dragActiveObj = event.object;
        this.imagePreview.setNonInteractive()
        this.draggedObjTimer = performance.now();
    }

    #onDrag(event) {
        this.render()
    }

    updateTextures(object) {
        if (object.material && object.material.map) {
          object.material.map.needsUpdate = true;
        }
      
        if (object instanceof PieceGroup) {
            if (object.children) {
                object.children.forEach(this.updateTextures);
              }
      
        }
      }
      

    mapElapsedTime(elapsedTime) {
        // Clamp elapsedTime between 0 and 1 for ramp-up
        // elapsedTime *= 0.5
        // const rampUpValue = Math.min(1, elapsedTime);
        
        // // Linearly interpolate between 0 and 25 for the ramp-up phase
        // const rampUpMapped = rampUpValue * 15;
        
        // // Calculate the oscillation phase (elapsedTime - 1 to make it start at 0 after ramp-up)
        // const oscillationPhase = Math.max(0, elapsedTime - 1) % 2;
        
        // // Use a sine wave function to create smooth oscillation between 20 and 30
        // const oscillationMapped = 25 + 10 * Math.sin(oscillationPhase * Math.PI);
        
        // // Combine ramp-up and oscillation phases using linear interpolation
        // const t = Math.min(1, elapsedTime);
        // const mappedValue = (1 - t) * rampUpMapped + t * oscillationMapped;
        
        // return mappedValue;
        return 10;
    }
      

    #onDragEnd(event) {
        this.outlinePass.selectedObjects = []
        this.dragActiveObj.position.z = 0
        this.dragActiveObj = null
        this.imagePreview.setInteractive()
        event.object.moved()
        // for (let i = this.scene.children.length - 1; i >= 0; i--) {
        //     const child = this.scene.children[i];
        //     if (child instanceof VertMarker) {
        //       this.scene.remove(child);
        //     }
        //   }
        //     for (let child of this.scene.children) {
        //     if ((child instanceof Piece) || (child instanceof PieceGroup)) {
        //         for (let i=0;i<child.curVerts.length;i++) {
        //             let x = new VertMarker(child.curVerts[i])
        //             x.init()  
        //           }
                
        //     }

        // }
        this.render()

    }
    
    render() {
        this.renderer.render(this.scene, this.camera)
    }

    #onKeyDown(event) { // debug the right and left things, they're flipped
        if (this.dragActiveObj) {
            console.log(event.keyCode)

            switch(event.keyCode) {
                case 81 || 65 || 37:
                    this.dragActiveObj.rotate('right')
                    break;
                case 69 || 68 || 39:
                    this.dragActiveObj.rotate('left')
                    break;
            }

            // if (event.keyCode == 81 || event.keyCode == 65 || event.keyCode == 37) {
            // } else if (event.keyCode == 69 || event.keyCode == 68 || event.keyCode == 39) {
            //     this.dragActiveObj.rotate('left')
            // }
        }

        if (event.keyCode == 27) {
            if (this.mainMenu.appearance() == 1) {
                this.mainMenu.close()
            } else {
                this.mainMenu.open()
            }
            //this.html.getelementbyid.css = 'block' on and off

        }
    }

    #onFormSubmit(event) {
        
        event.preventDefault()
        console.log(event)
        const url = event.target.elements.url.value;
        if (url) {
            this.makeNewPuzzle(url)
        }
    }
    
    // Middle mouse handling
    #onMouseDown(event) {
        if (event.button === 1) {
            event.preventDefault()
            event.stopPropagation();
            // middle mouse button was clicked
            this.isMiddleButtonDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
      
        } 
    }
    #onMouseMove(event) {
        if (this.isMiddleButtonDown) {
            event.preventDefault()
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        this.camera.position.x -= deltaX * 1;
        this.camera.position.y += deltaY * 1;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.render()
        }
    }      
    #onMouseUp(event) {
        console.log(event.target)
        if (event.target.classList.contains("chosen-image")) {
            this.makeNewPuzzle(event.target.src)
        }
        if (!event.target.classList.contains("mm")) {
            this.mainMenu.close()
        }

        if (event.button === 1) {
            // middle mouse button was released
            this.isMiddleButtonDown = false;
          }
   
    }

    #onWheel(event) {
        if (this.mainMenu.appearance() == 0) {
            this.deltaCameraZ += event.deltaY;
            while (this.deltaCameraZ != 0) {
                let newPos = this.camera.position.z + this.deltaCameraZ/10
                if (!(newPos > 7000) && !(newPos < 200)) {
                    this.camera.position.z = newPos
                }
                this.deltaCameraZ = Math.abs(this.deltaCameraZ) > 1 ? this.deltaCameraZ/10 : this.deltaCameraZ = 0;
                this.render()
            } 

    }

    }
}