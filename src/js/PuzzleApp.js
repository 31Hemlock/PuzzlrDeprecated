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
import svgScaler from './svgScaler.js';

// import {
//     Backdrop
// } from './Backdrop'

import * as utils from './utils.js'

import * as TWEEN from '@tweenjs/tween.js';


import clouds from 'vanta/dist/vanta.clouds.min'

import VoronoiSvg from './Algs/VoronoiSvg.js';

import VoronoiRelaxedSvg from './Algs/VoronoiRelaxedSvg.js'
import { moveObjectToPosition } from './utils.js'
import * as getV from './Algs/VoronoiPuzzleG.js'



let instance = null

export class PuzzleApp {
    constructor(container) {
        if (instance) {
            return instance
        }
        instance = this

        this.mouse = {}
        this.mouse.x = 0
        this.mouse.y = 0
        this.mouseMoving = ''
        this.cameraZone = [200, 7000]
        this.successEdgeStrength = 5;
        // clouds({
        //     el: '#background',
        //     THREE: THREE,
        //     backgroundColor: 0x000000,
        //     color: 0x008080,
        //     neighborColor: 0x00ffff,
        //     baseColor: 0x000000,
        //   });
                    //     // midtoneColor: 0xf7ff80,
        //     // lowlightColor: 0xd7b44e,
        //     lowlightColor: 0x4ec6d7,

        //     baseColor: 0xffffff,
        //     blurFactor: 0.36,
        //     speed: 0.30,
        //     zoom: 0.30
        //   })                  
        this.container = container;
        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
        this.ambientLight = new THREE.AmbientLight(0x505050)
        this.spotLight = new THREE.SpotLight(0xffffff, 1.5);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.mainMenu = new MainMenu()


        this.startTime = performance.now()
        this.sounds = []
        this.pairingColors = [
            '#cd7f32', // Bronze
            '#c28e4d',
            '#b79c68',
            '#acaa83', // Silver
            '#a1b89e',
            '#95c6b9',
            '#89d4d4', // Gold          
        ]



        // set some initial values
        this.scene.background = new THREE.Color(0xf0f0f0)
        // this.renderer.setClearColor(0x000000, 0); // Set clearColor with an alpha value of 0 (fully transparent)

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
        const regenButton = document.getElementById("regenerate")
        regenButton.addEventListener('click', this.#regeneratePuzzle.bind(this))
        // this.backdrop = new Backdrop(this.scene);


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


        // Middle mouse handling
        this.isMiddleButtonDown = false
        this.lastMouseX = 0
        this.lastMouseY = 0
        this.deltaCameraZ = 0

        this.pieceAmounts = [10, 25, 50, 100]

        this.init()
        this.animate()

        this.mainMenu.input.addEventListener('change', (event) => {
            console.log('event occurred')
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                this.makeNewPuzzle(reader.result)    
            });
        
            reader.readAsDataURL(file);

        })
        this.scene.traverse((object) => {
            object.layers.set(0);
          });

        this.mainMenu.settingSelectedCount.addEventListener('change', () => {
            this.mainMenu.settingNumPieces = this.mainMenu.settingSelectedCount.selectedIndex
            console.log('change')

        })
        this.mainMenu.settingPuzzleTypeDocu.addEventListener('change', () => {
            this.mainMenu.settingPuzzleType = this.mainMenu.settingPuzzleTypeDocu.selectedIndex
            console.log('change')

        })


        this.mainMenu.settingPreviewImage.addEventListener("change",  () => {
            console.log(this.mainMenu)
            this.onPreviewCheckboxChange(this.mainMenu.settingPreviewImage.checked);
          });

          
          
        utils.loadImages()

        this.artSvg = ["/artSvg/maincornFlipped.svg", "/artSvg/boxes.svg"]

        }

    async fetchSVGContent(url) {
        console.log(url)
        if (url == null) {
            console.log('null svg')
            return null;
        } else {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
                }
                const svgContent = await response.text();
                return svgContent;
            } catch (error) {
                console.error('Error fetching SVG:', error);
                return null;
            }    
        }
        }
          

    onPreviewCheckboxChange(isChecked) {
        if (isChecked) {
            this.imagePreview.show()
        } else {
            this.imagePreview.hide()
        }

    }


    #regeneratePuzzle() {
        console.log('init')
        this.clearBoard()
        this.init(this.imgUrl, this.svgString)
    }

    async init(image = 'images/7Cw2iDV.jpeg', svgString) {
        this.imgUrl = image
        this.svgString = svgString
        let puzzleType = this.mainMenu.settingPuzzleType
        if (this.imagePreview) {
            this.imagePreview.setSource(image)
        } else {
            this.imagePreview = new ImagePreview(image)
        }
        let texturePrepper = new TexturePrep(image)
        let texture = await texturePrepper.init()
        let avgColor = utils.getAverageColor(texture)
        let resultColor = utils.complementaryThreeColor(avgColor);
        this.outlinePass = new OutlinePass ( new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
        this.outlinePass.visibleEdgeColor.set(resultColor);
        this.outlinePass.edgeThickness = 2;
        this.outlinePass.edgeStrength = 2;
        this.outlinePass.edgeGlow = 3;
        this.outlinePass.pulsePeriod = 5;
        this.outlinePass.enabled = true;

        this.outlinePassSuccess = new OutlinePass ( new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera)
        this.outlinePassSuccess.visibleEdgeColor.set(new THREE.Color("#FFD700"));
        this.outlinePassSuccess.edgeThickness = 2;
        this.outlinePassSuccess.edgeStrength = 2;
        this.outlinePassSuccess.edgeGlow = 2;
        this.outlinePassSuccess.enabled = true;


        this.composer.addPass(this.outlinePass)
        this.composer.addPass(this.outlinePassSuccess)

        // this.outlinePass.selectedObjects = []
        // this.outlinePassSuccess.selectedObjects = []

        // if (!svgString) {
        //     svgString = "/images/maincornFlipped.svg";
        // }

        let svgContent = await this.fetchSVGContent(svgString);
        console.log(svgString)
        console.log(svgContent)
        let svgData = ''
        if (svgContent) {
            const scaler = new svgScaler(texture.image.width, texture.image.height, svgContent);
            await scaler.init();
            svgData = await scaler.scaledSVG();
            this.createPuzzle(svgData, texture)

        } else {
            let voronoiRelaxedSVG;
            switch(puzzleType){
                case 0: // Fall back to original algorithm
                    let avg_size = (texture.image.width + texture.image.height) / 2;
                    let piece_size = avg_size / 100;
                    let total_pieces = Math.min(
                    Math.floor(texture.image.width / piece_size) * Math.floor(texture.image.height / piece_size),
                    this.pieceAmounts[this.mainMenu.settingNumPieces]
                    );
                    let wideReps = Math.ceil(Math.sqrt(total_pieces * (texture.image.width / texture.image.height)));
                    let highReps = Math.ceil(Math.sqrt(total_pieces * (texture.image.height / texture.image.width)));
                    console.log(wideReps, highReps);
                
                    const svgFile = new PuzzleSVG(texture.image.width, texture.image.height, wideReps, highReps);
                    svgData = await svgFile.create();
                    this.createPuzzle(svgData, texture)

                    break;
                case 1:
                    // implementation coming soon
                    // let voronoiSVG = new VoronoiSvg(texture.image.width, texture.image.height);
                    // voronoiSVG.randomSites(100, true, (texture.image.width + texture.image.height)/20);
                    // svgData = voronoiSVG.generateSVG();

                    voronoiRelaxedSVG = new VoronoiRelaxedSvg(texture.image.width, texture.image.height)
                    voronoiRelaxedSVG.randomSites(this.pieceAmounts[this.mainMenu.settingNumPieces], true);
                    console.log(voronoiRelaxedSVG)
                    voronoiRelaxedSVG.relaxSites(() => {
                        let svgData = voronoiRelaxedSVG.generateSVG();
                        console.log(svgData)
                        this.createPuzzle(svgData, texture)

                    });
                    break;
                case 2:
                    const randomElement = this.artSvg[Math.floor(Math.random() * this.artSvg.length)];
                    svgContent = await this.fetchSVGContent(randomElement)
                    const scaler = new svgScaler(texture.image.width, texture.image.height, svgContent);
                    await scaler.init();
                    svgData = await scaler.scaledSVG();
                    this.createPuzzle(svgData, texture)
                    break;
    
                case 3:
                    voronoiRelaxedSVG = new VoronoiRelaxedSvg(texture.image.width, texture.image.height)
                    voronoiRelaxedSVG.randomSites(this.pieceAmounts[this.mainMenu.settingNumPieces], true);
                    console.log(voronoiRelaxedSVG)
                    voronoiRelaxedSVG.relaxSites(() => {
                        // let voronoiPuzzle = new VoronoiPuzzle(voronoiRelaxedSVG.generateSVG())
                        // voronoiPuzzle.init()
                        let svgDataCurved = getV.get(voronoiRelaxedSVG.generateSVG())
                        console.log(svgDataCurved)
                        this.createPuzzle(svgDataCurved, texture)
                    });
                    break;

            }
        }
            this.initDragControls()
            this.render()
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sounds = [];
            this.initAudio();

        
    }
    

    createPuzzle(svgData, texture) {
        this.puzzle = new Puzzle(svgData, texture)
        this.camera.position.z = Math.max(this.puzzle.texture.image.width, this.puzzle.texture.image.height)
        console.log(this.camera.position.z)
        const puzzlePieces = this.puzzle.createPieces()
        this.totalPieces = puzzlePieces.length
        puzzlePieces.forEach(piece => {
            this.scene.add(piece);
        })
    }

        
        // (async () => {
        //     const svgContent = await this.fetchSVGContent(svgString);
        //     if (svgContent) {
        //       const scaler = new svgScaler(texture.image.width, texture.image.height, svgContent);
        //       await scaler.init();
        //       const svgData = scaler.scaledSVG();
        //       this.puzzle = new Puzzle(svgData, texture)
        //         this.camera.position.z = Math.max(this.puzzle.texture.image.width, this.puzzle.texture.image.height)
        //         console.log(this.camera.position.z)
        //         const puzzlePieces = this.puzzle.createPieces()
        //         this.totalPieces = puzzlePieces.length
        //         puzzlePieces.forEach(piece => {
        //             this.scene.add(piece);
        //         })
        //         this.initDragControls()
        //         this.render()
        //         this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        //         this.sounds = [];
        //         this.initAudio();

        //     } else {
        //       let avg_size = (texture.image.width + texture.image.height) / 2;
        //       let piece_size = avg_size / 100;
        //       let total_pieces = Math.min(
        //         Math.floor(texture.image.width / piece_size) * Math.floor(texture.image.height / piece_size),
        //         this.pieceAmounts[this.mainMenu.settingNumPieces]
        //       );
        //       let wideReps = Math.ceil(Math.sqrt(total_pieces * (texture.image.width / texture.image.height)));
        //       let highReps = Math.ceil(Math.sqrt(total_pieces * (texture.image.height / texture.image.width)));
        //       console.log(wideReps, highReps);
          
        //       const svgFile = new PuzzleSVG(texture.image.width, texture.image.height, wideReps, highReps);
        //       const svgData = svgFile.create();
        //       this.puzzle = new Puzzle(svgData, texture)
        //               // this.scene.add(this.puzzle.getThumbMesh())
        // this.camera.position.z = Math.max(this.puzzle.texture.image.width, this.puzzle.texture.image.height)
        // console.log(this.camera.position.z)
        // const puzzlePieces = this.puzzle.createPieces()
        // this.totalPieces = puzzlePieces.length
        // puzzlePieces.forEach(piece => {
        //     this.scene.add(piece);
        // })
        // this.initDragControls()
        // this.render()
        // this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // this.sounds = [];
        // this.initAudio();

        //     }
        //   })();

        // // this.scene.add(this.puzzle.getThumbMesh())
        // this.camera.position.z = Math.max(this.puzzle.texture.image.width, this.puzzle.texture.image.height)
        // console.log(this.camera.position.z)
        // const puzzlePieces = this.puzzle.createPieces()
        // this.totalPieces = puzzlePieces.length
        // puzzlePieces.forEach(piece => {
        //     this.scene.add(piece);
        // })
        // this.initDragControls()
        // this.render()
        // this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // this.sounds = [];
        // this.initAudio();
    

        
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

        addCurvesToSVG(svgString) {
            const parser = new DOMParser();
            const svgDom = parser.parseFromString(svgString, 'image/svg+xml');
            const pathElements = svgDom.querySelectorAll('path');
        
            pathElements.forEach((path) => {
                let d = path.getAttribute('d');
                const commands = d.match(/([a-zA-Z])([^a-zA-Z]*)/g).map(command => {
                    const [letter, ...params] = command.split(/[\s,]+/);
                    return [letter, ...params.map(parseFloat)];
                });
        
                let newPathCommands = [];
                for (let i = 0; i < commands.length; i++) {
                    if (commands[i][0] === 'L' || commands[i][0] === 'M') {
                        let startX = commands[i][1];
                        let startY = commands[i][2];
        
                        let endX, endY;
                        if (i + 1 < commands.length && (commands[i + 1][0] === 'L' || commands[i + 1][0] === 'M')) {
                            endX = commands[i + 1][1];
                            endY = commands[i + 1][2];
                        } else {
                            endX = commands.find(cmd => cmd[0] === 'M')[1];
                            endY = commands.find(cmd => cmd[0] === 'M')[2];
                        }
        
                        let distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                        let curveFactor = distance * 0.25;
        
                        if (startX == 0 || startY == 0 || endX == 0 || endY == 0) {
                            newPathCommands.push(commands[i].join(' '));
                            return
                        }
                        let midX = (startX + endX) / 2;
                        let midY = (startY + endY) / 2;
                        let ctrl1X = this.roundToFixed((startX + midX) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                        let ctrl1Y = this.roundToFixed((startY + midY) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                        let ctrl2X = this.roundToFixed((endX + midX) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                        let ctrl2Y = this.roundToFixed((endY + midY) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                                
                        newPathCommands.push(`${commands[i][0]} ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`);
                    } else {
                        newPathCommands.push(commands[i].join(' '));
                    }
                }
        
                newPathCommands.push('Z');
                path.setAttribute('d', newPathCommands.join(' '));
            });
                
            
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgDom.documentElement);
    }

    roundToFixed(value, decimalPlaces) {
        return parseFloat(value.toFixed(decimalPlaces));
    }
    
                                                      

    async audioProcessor(audioFilePath) {
        const response = await fetch(audioFilePath);
        const audioBuffer = await response.arrayBuffer();
        const decodedAudioBuffer = await this.audioContext.decodeAudioData(audioBuffer);
        return decodedAudioBuffer;
      }
    

    async initAudio() {
        this.sounds.push(await this.audioProcessor('sounds/knockwood2.mp3'));
        this.sounds.push(await this.audioProcessor('sounds/oneNote.mp3'))
        this.sounds.push(await this.audioProcessor('sounds/twoNote.mp3'))       
        this.sounds.push(await this.audioProcessor('sounds/threeNote.mp3'))        
        this.sounds.push(await this.audioProcessor('sounds/fourNote.mp3'))      
        this.sounds.push(await this.audioProcessor('sounds/fiveNote.mp3'))       
        this.sounds.push(await this.audioProcessor('sounds/sixNote.mp3'))      
        this.sounds.push(await this.audioProcessor('sounds/sevenNote.mp3'))
        }
    
    makeNewPuzzle(image, svgFile) {
        this.clearBoard()
        this.init(image, svgFile)
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


        TWEEN.update();

        // if (this.dragActiveObj && this.mouseMoving) {
        //     let easingFactor;
        //     if (this.mouseMoving) {
        //         easingFactor = 0.01
        //     } else {
        //         easingFactor *= 0.9
        //     }
        //     utils.updateCameraPosition(this.camera, this.dragActiveObj, easingFactor, true)
        //     this.mouseMoving = false
        // }

        // this.backdrop.update()

        
    
        // Calculate the time since the last frame and update elapsedTime
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.startTime) * 0.001; // Convert to seconds
        this.elapsedTime += deltaTime;
    
        // Call the tick function with deltaTime as an argument
        this.tick(deltaTime);

        // Render
        this.composer.render()

      }

      mapMousePositionToSpeed(value, threshold) {
        const deadzone = 1 - threshold;
        if (Math.abs(value) < deadzone) {
          return 0;
        } else {
          return (Math.abs(value) - deadzone) * Math.sign(value);
        }
      }
      
      lerp(start, end, alpha) {
        return start + (end - start) * alpha;
      }

      zoomCamera(desiredZoom) {
        // Clamp desiredZoom between 0 and 1
        desiredZoom = Math.max(0, Math.min(1, desiredZoom));
      
        // Calculate the new camera z-position based on the desired zoom level and cameraZone range
        const newZ = this.cameraZone[0] + desiredZoom * (this.cameraZone[1] - this.cameraZone[0]);
      
        // Calculate the ratio of the new z-position to the current z-position
        const zRatio = newZ / this.camera.position.z;
      
        // Calculate the new camera position while preserving the x and y components
        const newPosition = new THREE.Vector3(
          this.dragActiveObj.position.x + (this.camera.position.x - this.dragActiveObj.position.x) * zRatio,
          this.dragActiveObj.position.y + (this.camera.position.y - this.dragActiveObj.position.y) * zRatio,
          newZ
        );
      
        // Update the camera's position
        return newPosition
      }
                                    

      centerCamera(smoothing = 0.4, sensitivity = 60) {
        // if (this.dragActiveObj) {
        //     this.camera.position.x = this.lerp(this.camera.position.x, this.dragActiveObj.position.x, smoothing);
        //     this.camera.position.y = this.lerp(this.camera.position.y, this.dragActiveObj.position.y, smoothing);    
        //     this.camera.position.x += (this.mouse.x * sensitivity - this.camera.position.x) * 0.05;
        //     this.camera.position.y += (this.mouse.y * sensitivity - this.camera.position.y) * 0.05;

        // }
        this.camera.position.x = this.dragActiveObj.position.x
        this.camera.position.y = this.dragActiveObj.position.y
      }
      
      tick(deltaTime) {

        if (this.dragActiveObj) {
            this.dragActiveObj.position.z = this.mapElapsedTime(deltaTime)
        }
        this.render()
        // const sensitivity = 60; // Adjust this value to change camera movement sensitivity
        // const smoothing = 0.4; // Adjust this value to change the smoothing effect (0.1 = 10% interpolation)

        // //       if (this.mouse.x && this.mouse.y && this.camera) {
        // //     this.camera.position.x += (this.mouse.x * sensitivity - this.camera.position.x) * 0.05;
        // //     this.camera.position.y += (this.mouse.y * sensitivity - this.camera.position.y) * 0.05;
    
        // // }
        // console.log(this.camera.position)

        // if (this.dragActiveObj) {
        //     // console.log(deltaObjTime)   
        //     this.dragActiveObj.position.z = this.mapElapsedTime(deltaTime)
        //         // this.camera.position.x += (this.mouse.x * sensitivity - this.camera.position.x) * 0.05;
        //         // this.camera.position.y += (this.mouse.y * sensitivity - this.camera.position.y) * 0.05;
        //         const threshold = 0.8; // Adjust this value to change the size of the non-moving zone
        //         const speedX = this.mapMousePositionToSpeed(this.mouse.x, threshold);
        //         const speedY = this.mapMousePositionToSpeed(this.mouse.y, threshold);
        //         const targetPositionX = this.camera.position.x + speedX * sensitivity;
        //         const targetPositionY = this.camera.position.y + speedY * sensitivity;
              
        //         this.camera.position.x = this.lerp(this.camera.position.x, targetPositionX, smoothing);
        //         this.camera.position.y = this.lerp(this.camera.position.y, targetPositionY, smoothing);
                  
        //     this.render() 
        // } 
      
        // else {
        //     const threshold = 0.5; // Adjust this value to change the size of the non-moving zone
        //     const speedX = this.mapMousePositionToSpeed(this.mouse.x, threshold);
        //     const speedY = this.mapMousePositionToSpeed(this.mouse.y, threshold);
        //     this.camera.position.x += speedX * sensitivity;
        //     this.camera.position.y += speedY * sensitivity;
    
        // }
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
        this.render()
        // this.puzzle.texture.needsUpdate = true;


        this.updateTextures(this.scene);

    }

    #dragStart(event) {
        this.dragOffset = event.offset

        // Handle glow
        this.outlinePass.selectedObjects = [event.object]
        
        // Set active object
        this.dragActiveObj = event.object;
        this.imagePreview.setNonInteractive()
        this.draggedObjTimer = performance.now();
    }

    #onDrag(event) {
        this.isDragging = true;
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

      sortPieceGroupsByChildrenCount(pieceGroups) {
        return pieceGroups.sort((a, b) => a.children.length - b.children.length);
      }

      getNextPosition(currentX, currentY, currentRowMaxHeight, pieceGroup, distance) {
        const nextX = currentX + pieceGroup.width + distance;
        if (nextX > window.innerWidth) {
          return {
            x: 0,
            y: currentY + currentRowMaxHeight + distance,
            rowMaxHeight: pieceGroup.height,
          };
        }
        return {
          x: nextX,
          y: currentY,
          rowMaxHeight: Math.max(currentRowMaxHeight, pieceGroup.height),
        };
      }
      
      
      calculatePosition(index, distance, width, height) {
        const x = (index % width) * distance;
        const y = Math.floor(index / width) * distance;
        return new THREE.Vector3(x, y, 0);
      }


      positionObjects(objects, distance = 100, yOffset = 0) {
        let newCameraPos = new THREE.Vector3(this.puzzle.texture.image.width,this.puzzle.texture.image.height,this.puzzle.texture.image.width + this.puzzle.texture.image.height)
        utils.moveObjectToPosition(this.camera, newCameraPos)
        let currentX = 0;
        let currentY = yOffset;
        let currentRowMaxHeight = 0;
        const availableWidth = window.innerWidth;
    
        objects.forEach((object) => {
          if (currentX + object.width > availableWidth) {
            currentX = 0;
            currentY += currentRowMaxHeight + distance;
            currentRowMaxHeight = 0;
          }
    
          const targetPosition = new THREE.Vector3(currentX, currentY, 0);
          utils.moveObjectToPosition(object, targetPosition);
    
          currentX += object.width + distance;
          currentRowMaxHeight = Math.max(currentRowMaxHeight, object.height);
        });
    
        return currentY + currentRowMaxHeight;
      }

    
      positionPiecesAndPieceGroups(distance = 100) {
        let pieces = []
        let pieceGroup = []
        for (let object of this.scene.children) {
            if (object instanceof Piece) {
                pieces.push(object)
            } else if (object instanceof PieceGroup) {
                pieceGroup.push(object)
            }

        }
        const maxYofPieceGroups = this.positionObjects(pieceGroup, distance);
        const yOffsetForPieces = maxYofPieceGroups + distance;
        this.positionObjects(pieces, distance, yOffsetForPieces);
        
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

    playSound(soundIndex, settingEnabled = true) {
        if (settingEnabled) {
            const audioBuffer = this.sounds[soundIndex]
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);    
        }
      }
          

    #onDragEnd(event) {
        this.outlinePass.selectedObjects = []
        this.dragActiveObj.position.z = 0
        this.dragActiveObj = null
        this.imagePreview.setInteractive()
        this.playSound(0, this.mainMenu.settingSound.checked);
        console.log(event.object)
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
                this.mainMenu.modal.classList.remove("open");
            } else {
                this.mainMenu.open()
            }
            //this.html.getelementbyid.css = 'block' on and off

        }
        if (event.keyCode == 16) {
            if (this.dragActiveObj) {
                this.camera.position
                let newPos = this.zoomCamera(0.1)
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)
            }
        }
        if (event.keyCode == 67) {
            console.log(this.camera.position)
            if (this.puzzle) {
                let newPos = new THREE.Vector3(0, 0, (this.puzzle.texture.image.width + this.puzzle.texture.image.height)* 1.3)
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
            console.log(this.camera.position)
        }
        if (event.keyCode == 88) {
            console.log(this.camera.position)
            if (this.puzzle) {
                let newPos = new THREE.Vector3(0, 0, this.puzzle.texture.image.width + this.puzzle.texture.image.height)
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
            console.log(this.camera.position)
        }
        if (event.keyCode == 90) {
            console.log(this.camera.position)
            if (this.puzzle) {
                let newPos = new THREE.Vector3(0, 0, (this.puzzle.texture.image.width + this.puzzle.texture.image.height)*0.7)
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
            console.log(this.camera.position)
        }

        if (event.keyCode == 48) {
            this.positionPiecesAndPieceGroups()
        }
        if (event.keyCode == 49) {
            document.getElementById("backgroundVideo").src = "videos/jf1.mp4"
            document.getElementById("backgroundVideo")
        }
        if (event.keyCode == 32) {
            this.centerCamera()
        }

    }

    moveMeshToMouse(mesh) {
        // Get the position of the canvas element relative to the viewport
        const canvasBounds = this.renderer.domElement.getBoundingClientRect();
      
        // Adjust mouse coordinates based on the canvas position within the viewport
        const adjustedMouseX = (this.mouse.x + 1) * 0.5 * canvasBounds.width;
        const adjustedMouseY = (1 - this.mouse.y) * 0.5 * canvasBounds.height;
      
        // Normalize adjusted mouse coordinates to the range of -1 to 1
        const mouseX = (adjustedMouseX / canvasBounds.width) * 2 - 1;
        const mouseY = -(adjustedMouseY / canvasBounds.height) * 2 + 1;
      
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
      
        // Set the raycaster's position and direction based on the adjusted mouse coordinates
        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
      
        // Create a plane to cast rays on (assuming the mesh is located on the z=0 plane)
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      
        // Calculate the intersection point between the ray and the plane
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
      
        // Add the drag offset to the intersection point
        intersection.sub(this.dragOffset);
      
        // Set the mesh's x, y position to the updated intersection point
        mesh.position.set(intersection.x, intersection.y, mesh.position.z);
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

        if (event.target.classList.contains("settings-main")) {
            this.mainMenu.toggleSettings();
        }

    }
    #onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;    
        this.mouseMoving = true;
      
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
        if (this.dragActiveObj && this.imagePreview.imgContainer.classList.contains('pinned')) {
            const rect = this.imagePreview.imgContainer.getBoundingClientRect();
            const isMouseUnderDiv = event.clientX >= rect.left &&
                                    event.clientX <= rect.right &&
                                    event.clientY >= rect.top &&
                                    event.clientY <= rect.bottom;
            if (isMouseUnderDiv) {
                this.imagePreview.imgContainer.style.opacity = '0.3';
            } else {
                this.imagePreview.imgContainer.style.opacity = '1';
            }
          } else {
            this.imagePreview.imgContainer.style.opacity = '1';
          }
    
        }
          
    #onMouseUp(event) {
        console.log(event.target)
        if (event.target.classList.contains("chosen-image")) {
            console.log(event.target.src)
            // if (event.target.src == 'http://192.168.1.165:8080/assets/images/cd7b19abb5e64293.png') {
                if (event.target.src == "http://192.168.1.165:8080/assets/images/3bae1b47186e726f.png"){
                console.log('was')
                this.makeNewPuzzle(event.target.src, "./geography/usaBest.svg")
            } else {
                this.makeNewPuzzle(event.target.src)
            }
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
            console.log(this.deltaCameraZ)
            while (this.deltaCameraZ != 0) {
                let newPos = this.camera.position.z + this.deltaCameraZ/10
                if (!(newPos > this.cameraZone[1]) && !(newPos < this.cameraZone[0])) {
                    this.camera.position.z = newPos
                }
                this.deltaCameraZ = Math.abs(this.deltaCameraZ) > 1 ? this.deltaCameraZ/10 : this.deltaCameraZ = 0;
                this.render()
            } 

    }

    }
}