import * as THREE from 'three'
import { DragControls } from './angledDragControls.js'
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
import {
    ControlMenu
} from './ControlMenu.js'
import  {
    ImagePreview
} from './ImagePreview'
import svgScaler from './svgScaler.js';
import * as utils from './utils.js'
import * as TWEEN from '@tweenjs/tween.js';
import VoronoiSvg from './Algs/VoronoiSvg.js';
import VoronoiRelaxedSvg from './Algs/VoronoiRelaxedSvg.js'
import { moveObjectToPosition } from './utils.js'
import * as getV from './Algs/VoronoiPuzzleG.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

let instance = null

/**
 * Main, singleton class for the application. Stores all global data.
 * @class
 */
export class PuzzleApp {
    /**
     * @constructor
     * @param {HTMLElement} container - The html container for the application.
     */
    constructor(container) {

        // Singleton class
        if (instance) {
            return instance
        }
        instance = this

        this.controlMenu = new ControlMenu()

        // Initialize loading screen manager
        const manager = new THREE.LoadingManager();
        manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
            
        };
        manager.onLoad = () => {
            const loadingScreen = document.getElementById( 'loading-screen' );
            console.log('loaded')
            loadingScreen.classList.add( 'fade-out' );
            
            loadingScreen.addEventListener( 'transitionend', this.onTransitionEnd );
            console.log(this.mainMenu)
            setTimeout(() => {
                this.mainMenu.open();
            }, 500);
        };
        manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
            console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
        };
        manager.onError = function ( url ) {
            console.log( 'There was an error loading ' + url );
            
        };

        // Handle mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (this.isMobile) {
            this.controlMenu.hideForever()
        }
        this.touchScreen;
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) {
            this.touchScreen = 1
        } else {
            this.touchScreen = 0
        }

        // Start creating the scene
        this.container = container;
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.scene.add(this.camera);
        this.container.appendChild(this.renderer.domElement)

        // Initial variables
        this.mouse = {}
        this.mouse.x = 0
        this.mouse.y = 0
        this.cameraZone = [200, 4600]
        this.perspective = 1
        this.numPuzzles = 0
        this.artSvg = ["/artSvg/maincornFlipped.svg", "/artSvg/boxes.svg"]
        this.pieceAmounts = [10, 25, 50, 100]
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
        // Touch screen vars
        this.lastTouchEnd = 0;
        this.touchCount = 0;
        this.mobileZoom = false;
        // Middle mouse handling
        this.isMiddleButtonDown = false
        this.lastMouseX = 0
        this.lastMouseY = 0
        this.deltaCameraZ = 0
        // Set initial camera position
        this.camera.position.set(0, -6500, 1000)
        this.camera.rotation.set(1.3, 0, 0)
        // Initialize html elements
        this.mainMenu = new MainMenu()
        this.urlForm = document.getElementById("url-form")
        this.regenButton = document.getElementById("regenerate")
        // Set background color
        this.scene.background = new THREE.Color(0x384661) //0xf0f0f0
        // this.renderer.setClearColor(0x000000, 0); // Set clearColor with an alpha value of 0 (fully transparent)
        // this.renderer.shadowMap.enabled = true
        // this.renderer.shadowMap.type = THREE.PCFShadowMap;
        // Set pixel ratio
        this.renderer.setPixelRatio(window.devicePixelRatio)

        // Baked textures
        this.textureLoader = new THREE.TextureLoader(manager)
        const bakedTexture = this.textureLoader.load('./blend/bakeMay25LittleDarker.png')
        bakedTexture.flipY = false
        const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture})
        // Texture loader
        const dracoLoader = new DRACOLoader(manager);
        dracoLoader.setDecoderPath('/draco/');
        this.loader = new GLTFLoader(manager);
        this.loader.setDRACOLoader(dracoLoader);

        // Load the room and desk
        this.loader.load('./blend/Room.glb', (glb) => {
            glb.scene.traverse((child) => {
                child.material = bakedMaterial;
            })
            const obj = glb.scene;
            this.scene.add(obj)
            obj.scale.set(700, 700, 700)
            obj.position.set(0, 1200, -1600)
            obj.rotation.set(0.5 * Math.PI, 1.5 * Math.PI, 0)
        }, undefined, (error) => {
            console.error('An error occurred and the model is undefined:', error);
        })

        // Load the background image
        this.textureLoader.load('/images/outside2.png', (backgroundTexture) => {
            let backgroundGeometry = new THREE.PlaneGeometry(11000, 11000);
            let backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture});
            let backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial)
            backgroundMesh.rotation.x = 1.57
            backgroundMesh.position.x = 100
            backgroundMesh.position.y = 3200
            backgroundMesh.position.z = -400
            this.scene.add(backgroundMesh)    
        })

        // Event listeners
        window.addEventListener('resize', this.#onWindowResize.bind(this))
        window.addEventListener('keydown', this.#onKeyDown.bind(this))
        window.addEventListener('mousedown', this.#onMouseDown.bind(this))
        window.addEventListener('mousemove', this.#onMouseMove.bind(this))
        window.addEventListener('mouseup', this.#onMouseUp.bind(this))
        window.addEventListener('wheel', this.#onWheel.bind(this))
        window.addEventListener('touchend', this.#touchEnd.bind(this))
        this.urlForm.addEventListener('submit', this.#onFormSubmit.bind(this))
        this.regenButton.addEventListener('click', this.#regeneratePuzzle.bind(this))

        window.addEventListener('touchmove', (event) => {
            this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;    
    

            event.preventDefault(); // To prevent the default browser's behavior of scrolling/zooming on touchmove
        });
        

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

        // Handle file input
        this.mainMenu.input.addEventListener('change', (event) => {
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
        })
        this.mainMenu.settingPuzzleTypeDocu.addEventListener('change', () => {
            this.mainMenu.settingPuzzleType = this.mainMenu.settingPuzzleTypeDocu.selectedIndex
        })
        this.mainMenu.settingPreviewImage.addEventListener("change",  () => {
            this.onPreviewCheckboxChange(this.mainMenu.settingPreviewImage.checked);
        });


        // Initialize
        this.numSnowflakes = 1300
        this.addSnowflakes(this.numSnowflakes, 10000, 5000, 3)

        this.init()
        this.animate()
        utils.loadImages()
    }

    /**
     * Fetches SVG content from a given URL.
     *
     * @async
     * @param {string} url - The URL from where the SVG content will be fetched.
     * @return {Promise<string|null>} A promise that resolves to the SVG content as a string, or null if an error occurs or if the URL is null.
     * @throws Will throw an error if the HTTP response status is not okay (200-299).
     */
    async fetchSVGContent(url) {
        if (url == null) {
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
          

    /**
     * Handles user setting for showing or hiding the preview image.
     * If the preview checkbox is checked, the image preview is shown; if it is unchecked, the image preview is hidden.
     * 
     * @method
     * @param {boolean} isChecked - Whether the checkbox is checked or not
     * @return {void}
     */
    onPreviewCheckboxChange(isChecked) {
        if (isChecked) {
            this.imagePreview.show()
        } else {
            this.imagePreview.hide()
        }
    }


    /**
     * Removes loading screen animation div when all relevant files are loaded.
     * 
     * @method
     * @param {TransitionEvent} event - The event object associated with the transition end.
     * @return {void}
     */
    onTransitionEnd( event ) {
        event.target.remove();
    }

    /**
     * Adds falling snowflakes to the scene.
     * 
     * @method
     * @param {number} amount - Number of snowflakes to spawn.
     * @param {number} maxRange - Largest value at which the snowflakes can spawn.
     * @param {number} minRange - Smallest value at which the snowflakes can spawn.
     * @param {number} scale - General size of a snowflake.
     * @return {void}
     */
    addSnowflakes(amount, maxRange, minRange, scale) {
        let positions = [], velocities = [], alphas = [];
        this.numSnowflakes = 1300;
        this.snowMaxRange = 10000;
        this.snowMinRange = this.snowMaxRange / 2;
        let snowMinHeight = 150;
        let geometry = new THREE.BufferGeometry();
        let sizes = [];
        let fadeIns = new Uint8Array(amount); // Boolean array for fading in state


        for (let i = 0; i < amount; i++) {
            positions.push(
                (Math.random() * maxRange - minRange),
                (Math.random() * minRange + snowMinHeight) - 2500,
                (Math.random() * maxRange - minRange)
            );
            velocities.push(
                (Math.random() * 6 - 3) * 0.3,
                (Math.random() * 5 + 0.12) * 0.1,
                0.7
            );
            sizes.push(Math.random() * scale + 5);  // Random size between 5 and 20
            alphas.push(1); // Initial alpha value
            fadeIns[i / 3] = 0; // 0 for false

        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
        geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1)); // Alpha attribute
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute('fadeIn', new THREE.BufferAttribute(fadeIns, 1));


        this.textureLoader.load('/images/snowflake.png', (snowflakeTexture) => {

            let vertexShader = `
            attribute float alpha;
            attribute float size;
            
            varying float vAlpha;
            
            void main() {
                vAlpha = alpha;
            
                gl_PointSize = size;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `;
            
            let fragmentShader = `
            uniform sampler2D map;
        
            varying float vAlpha;
        
            void main() {
                vec4 texColor = texture2D(map, gl_PointCoord);
                gl_FragColor = vec4(texColor.rgb, texColor.a * vAlpha);
            }
        `;
                    
            // When you create the PointsMaterial
            const flakeMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    map: { value: snowflakeTexture }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true,
                depthTest: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
                        
            this.particles = new THREE.Points(geometry, flakeMaterial)
            this.scene.add(this.particles)
        })
        
    }

    /**
     * Controls the movement of all snowflakes over time, as well as each of their opacities.
     * 
     * @method
     * @return {void}
     */
    updateParticles() {
        if (this.particles) {
            for (let i = 0; i < this.numSnowflakes * 3; i += 3) {
                this.particles.geometry.attributes.position.array[i] -= this.particles.geometry.attributes.velocity.array[i];
                this.particles.geometry.attributes.position.array[i + 1] -= this.particles.geometry.attributes.velocity.array[i + 1];
                this.particles.geometry.attributes.position.array[i + 2] -= this.particles.geometry.attributes.velocity.array[i + 2];
    
                if (this.particles.geometry.attributes.position.array[i + 1] < 2100) { // Start fading out 100 units before the lower limit
                    this.particles.geometry.attributes.alpha.array[i / 3] -= 0.01;
                }
    
                if (this.particles.geometry.attributes.position.array[i + 1] < 2000) {
                    this.particles.geometry.attributes.position.array[i] = Math.floor(Math.random() * this.snowMaxRange - this.snowMinRange) - 200;
                    this.particles.geometry.attributes.position.array[i + 1] = 3000;
                    this.particles.geometry.attributes.position.array[i + 2] = Math.floor(Math.random() * this.snowMaxRange - this.snowMinRange);
                    this.particles.geometry.attributes.alpha.array[i / 3] = 0; // snowflake starts as transparent
                    this.particles.geometry.attributes.fadeIn.array[i / 3] = true; // snowflake is in the fading-in state
                } else if (this.particles.geometry.attributes.fadeIn.array[i / 3]) { // if snowflake is in the fading-in state
                    this.particles.geometry.attributes.alpha.array[i / 3] += 0.01; // increase its alpha value
                    if (this.particles.geometry.attributes.alpha.array[i / 3] >= 1) { // if snowflake has become fully opaque
                        this.particles.geometry.attributes.fadeIn.array[i / 3] = false; // remove it from the fading-in state
                    }
                } else if (this.particles.geometry.attributes.position.array[i + 1] > 3000) {
                    this.particles.geometry.attributes.position.array[i + 1] = 3000;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.alpha.needsUpdate = true;
            this.particles.geometry.attributes.fadeIn.needsUpdate = true; // Tell Three.js to update the fadeIn attribute
        }
    }

    /**
     * Regenerates the current puzzle. Useful for applying changed menu settings.
     * 
     * @private
     * @return {void}
     */
    #regeneratePuzzle() {
        this.clearBoard()
        this.init(this.imgUrl, this.svgString)
    }

    /**
     * Creates a new puzzle.
     * 
     * @async
     * @param {string} image - A link to an image.
     * @param {string} svgString - A string representing an svg file.
     * @return {void}
     */
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
                    voronoiRelaxedSVG.relaxSites(() => {
                        let svgData = voronoiRelaxedSVG.generateSVG();
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

            if (this.numPuzzles > 0) {
                this.centerCamera()
                this.mainMenu.close()
            }
            this.numPuzzles += 1

            this.initDragControls()
            this.render()
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sounds = [];
            this.initAudio();

        
    }
    
    /**
     * Manages creation of a new puzzle via the Puzzle class.
     * 
     * @method
     * @param {string} svgData - Data from an .svg file.
     * @param {THREE.Texture} texture - Image data as represented by THREE's TextureLoader class.
     * @return {void}
     */
    createPuzzle(svgData, texture) {
        this.puzzle = new Puzzle(svgData, texture)
        // this.camera.position.z = Math.max(this.puzzle.texture.image.width, this.puzzle.texture.image.height)
        const puzzlePieces = this.puzzle.createPieces()
        this.totalPieces = puzzlePieces.length
        puzzlePieces.forEach(piece => {
            this.scene.add(piece);
        })

    }

    /**
     * Toggles the qualityLevel variable between 0 and 1 for debugging purposes. 
     * 
     * @method
     * @return {void}
     */
    toggleEffects() {
        if (this.qualityLevel == 0) {
            this.qualityLevel = 1
        } else {
            this.qualityLevel = 0
        }
    }

    /**
     * Unfinished, unused function to add random curves to an .svg string.
     * 
     * @method
     * @param {string} svgString - String representing an .svg file.
     * @return {string}
     */
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
                    let ctrl1X = utils.roundToFixed((startX + midX) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                    let ctrl1Y = utils.roundToFixed((startY + midY) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                    let ctrl2X = utils.roundToFixed((endX + midX) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                    let ctrl2Y = utils.roundToFixed((endY + midY) / 2 + (Math.random() - 0.5) * curveFactor, 2);
                            
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

    /**
     * Fetches an audio file from a specified path, and decodes it into an AudioBuffer.
     *
     * @async
     * @param {string} audioFilePath - The path to the audio file to be processed.
     * @return {Promise<AudioBuffer>} - A promise that resolves to an AudioBuffer representing the decoded audio data.
     * @throws {TypeError} - Throws a TypeError if the response from the fetch is not ok.
     */
    async audioProcessor(audioFilePath) {
        const response = await fetch(audioFilePath);
        const audioBuffer = await response.arrayBuffer();
        const decodedAudioBuffer = await this.audioContext.decodeAudioData(audioBuffer);
        return decodedAudioBuffer;
      }
    

    /**
     * Adds processed audio files to the sounds array.
     * 
     * @async
     * @return {void}
     */
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
    
    /**
     * Clears the board and creates a new puzzle using the provided image and svg file.
     * 
     * @method
     * @param {string|HTMLImageElement} image - May be a network location, local URL, or image file
     * @param {string} [svgFile] - Optional .svg file data. Will be generated if not provided.
     * @return {void}
     */
    makeNewPuzzle(image, svgFile) {
        this.clearBoard()
        this.init(image, svgFile)
    }

    /**
     * Clears the board of all pieces, and removes event listeners and controls.
     * 
     * @method
     * @return {void}
     */
    clearBoard() {
        // Remove all objects from the scene
        for (let i=this.scene.children.length; i>=0; i--) {
            if (this.scene.children[i] instanceof Piece || 
                this.scene.children[i] instanceof PieceGroup) {
                    this.scene.children[i].dispose()
                    this.scene.remove(this.scene.children[i]);
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
        window.removeEventListener('mousedown', this.#onMouseDown.bind(this))
        window.removeEventListener('mousemove', this.#onMouseMove.bind(this))
        window.removeEventListener('mouseup', this.#onMouseUp.bind(this))
        window.removeEventListener('wheel', this.#onWheel.bind(this))
        window.removeEventListener('touchend', this.#touchEnd.bind(this))
    }

    /**
     * Entirely disposes of a mesh.
     * 
     * @method
     * @param {THREE.Mesh} mesh - Any mesh object in Three.js.
     * @return {void}
     */
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
      
    /**
     * Entirely disposes of a material.
     * 
     * @method
     * @param {THREE.Material} material - Any material object in Three.js.
     * @return {void}
     */
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
      

    /**
     * Handles animation of the scene.
     * 
     * @method
     * @return {void}
     */
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

        //Update particles
        this.updateParticles()
    
        // Time

        // Initialize an array to store the first N frames and create the qualityLevel variable.
        if(!this.frameTimes) {
            this.frameTimes = [];
        }

        // Create previousTime variable if not exists
        if (typeof this.previousTime === 'undefined') {
            this.previousTime = performance.now();
          }
          
        // Calculate the time since the last frame and update elapsedTime
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.startTime) * 0.001; // Convert to seconds
        this.elapsedTime += deltaTime;
    
        // Call the tick function with deltaTime as an argument
        this.tick(deltaTime);

        // Render
        const frameTime = (currentTime - this.previousTime) * 0.001; // Convert to seconds

        if (typeof this.qualityLevel == 'undefined') {
            if (this.frameTimes.length <= 100) {
    
                this.frameTimes.push(frameTime);
            }
            this.qualityLevel;
            if (this.frameTimes.length >= 75) {
                const avgFrameTime = utils.removeOutliers(this.frameTimes, 10);

                if (avgFrameTime < 0.015) {
                    this.qualityLevel = 1 // good quality, composer enabled
                } else {
                    this.qualityLevel = 0 // bad quality, composer disabled

                }
            }    
        }

        // If hardware quality is high, render extra lights
        if (this.qualityLevel == 1) {
            this.composer.render()
        }

        // Update the previous time for the next frame
        this.previousTime = currentTime;


      }

      /**
       * Allows user to define a threshold, beyond which, a dragged piece moves the camera at a determined velocity.
       * 
       * @method
       * @param {number} value - Position of mouse along an axis.
       * @param {number} threshold - Beyond this threshold, dragging a piece moves the camera.
       * @return {number} - Returns a velocity by which to move the camera.
       */
      mapMousePositionToSpeed(value, threshold) {
        const deadzone = 1 - threshold;
        if (Math.abs(value) < deadzone) {
          return 0;
        } else {
          return (Math.abs(value) - deadzone) * Math.sign(value);
        }
      }
      
      /**
       * Alters a value at a smoothing rate. Used for camera movement along one dimension.
       * 
       * @method
       * @param {number} start - Starting value.
       * @param {number} end - Ending value.
       * @param {number} smoothing - Rate at which the value changes.
       */
      lerp(start, end, smoothing) {
        return start + (end - start) * smoothing;
      }

      /**
       * Zooms the camera while maintaining the position of the active piece on the screen.
       * 
       * @method
       * @param {number} desiredZoom - Value between 0 and 1 for amount to zoom the camera
       * @return {THREE.Vector3} - New position of the camera
       */
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
                                    

      /**
       * Moves the camera to the default location, which depends on camera perspective.
       * 
       * @method
       * @return {void}
       */
      centerCamera() {
        let newPos;
        if (this.perspective) {
            newPos = new THREE.Vector3(0, -1225, 1740)
        } else {
            newPos = new THREE.Vector3(0, 100, 1740)
        }
        utils.moveObjectToPosition(this.camera, newPos, 2000, false, true, 0.7)


      }
      
      /**
       * Occurs on application ticks. Gives the active drag object an optionally oscillating Z-magnitude,
       * and allows for movement of the camera via dragging a piece on mobile.
       * 
       * @method
       * @param {number} deltaTime - Amount of time since last tick.
       * @return {void}
       */
      tick(deltaTime) {

        if (this.dragActiveObj) {
            this.dragActiveObj.position.z = this.mapElapsedTime(deltaTime)
        }
        this.render()
        const sensitivity = 60; // Adjust this value to change camera movement sensitivity
        const smoothing = 0.4; // Adjust this value to change the smoothing effect (0.1 = 10% interpolation)

        //       if (this.mouse.x && this.mouse.y && this.camera) {
        //     this.camera.position.x += (this.mouse.x * sensitivity - this.camera.position.x) * 0.05;
        //     this.camera.position.y += (this.mouse.y * sensitivity - this.camera.position.y) * 0.05;
    
        // }

        if (this.dragActiveObj && this.touchScreen) { // 
                // this.camera.position.x += (this.mouse.x * sensitivity - this.camera.position.x) * 0.05;
                // this.camera.position.y += (this.mouse.y * sensitivity - this.camera.position.y) * 0.05;
                const threshold = 0.4; // Adjust this value to change the size of the non-moving zone
                const speedX = this.mapMousePositionToSpeed(this.mouse.x, threshold);
                const speedY = this.mapMousePositionToSpeed(this.mouse.y, threshold);
                const targetPositionX = this.camera.position.x + speedX * sensitivity;
                const targetPositionY = this.camera.position.y + speedY * sensitivity;
              
                this.camera.position.x = this.lerp(this.camera.position.x, targetPositionX, smoothing);
                // this.camera.position.y = this.lerp(this.camera.position.y, targetPositionY, smoothing);
                  
            this.render() 
        } 
      
        // else {
        //     const threshold = 0.5; // Adjust this value to change the size of the non-moving zone
        //     const speedX = this.mapMousePositionToSpeed(this.mouse.x, threshold);
        //     const speedY = this.mapMousePositionToSpeed(this.mouse.y, threshold);
        //     this.camera.position.x += speedX * sensitivity;
        //     this.camera.position.y += speedY * sensitivity;
    
        // }
        // event.object.position.z = this.mapElapsedTime(deltaTime)

    }


    /**
     * Removes the currently active drag controls instance from the scene, if it exists.
     * 
     * @return {void}
     */
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

    /**
     * Creates an instance of DragControls, complete with event listeners and child Piece/PieceGroup objects.
     * 
     * @return {void}
     */
    initDragControls() {
        let draggableObjects = this.scene.children.filter(child => {
            return (child instanceof Piece) || (child instanceof PieceGroup)
        })
        this.controls = new DragControls(draggableObjects, this.camera, this.renderer.domElement)
        this.controls.addEventListener('dragstart', this.#dragStart.bind(this))
        this.controls.addEventListener('drag', this.#onDrag.bind(this));
        this.controls.addEventListener('dragend', this.#onDragEnd.bind(this))
    }


    /**
     * Maintains camera and texture consistency throughout window changes.
     * 
     * @return {void}
     */
    #onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.render()
        // this.puzzle.texture.needsUpdate = true;


        this.updateTextures(this.scene);

    }

    /**
     * Handles double-tap touch events.
     * 
     * @param {TouchEvent} event
     * @return {void}
     */
    #touchEnd(event) {
        const now = (new Date()).getTime();

        if (now - this.lastTouchEnd <= 400) {
            this.touchCount++;

            if (this.touchCount == 2) {
                let touchX = event.changedTouches[0].clientX;
                let screenWidth = window.innerWidth;
                let cameraLoc = this.camera.position.x
                if (touchX < screenWidth / 3 && cameraLoc > -1000) {
                    // Handle case 1 - left third of the screen

                    utils.moveObjectToPosition(this.camera, new THREE.Vector3(cameraLoc - 1000, this.camera.position.y, this.camera.position.z), 200, false, true)

                } else if (touchX > 2 * screenWidth / 3 && cameraLoc < 1000) {
                    utils.moveObjectToPosition(this.camera, new THREE.Vector3(cameraLoc + 1000, this.camera.position.y, this.camera.position.z), 200, false, true)
                } else if (touchX > screenWidth / 3 && touchX < 2 * screenWidth / 3) {
                    if (this.mobileZoom == false) {
                        utils.moveObjectToPosition(this.camera, new THREE.Vector3(cameraLoc, -1150, 1000), 200, false, true)
                        this.mobileZoom = true
                    } else {
                        utils.moveObjectToPosition(this.camera, new THREE.Vector3(0, -1225, (1740)), 200, false, true)
                        this.mobileZoom = false
                    }
                }
                this.touchCount = 0;
            }
        }

        this.lastTouchEnd = now;
    }

    /**
     * Sets variables related to dragging a piece.
     * 
     * @param {object} event - The custom event object dispatched by DragControls in three.js.
     * @return {void}
     */
    #dragStart(event) {
        this.dragOffset = event.offset

        // Handle glow
        this.outlinePass.selectedObjects = [event.object]
        
        // Set active object
        this.dragActiveObj = event.object;
        this.imagePreview.setNonInteractive()
        this.draggedObjTimer = performance.now();
    }

    /**
     * Sets the variable isDragging to true or false.
     * 
     * @return {void}
     */
    #onDrag() { // event param
        this.isDragging = true;
    }

    /**
     * Updates the textures to the size relevant to the window size.
     * 
     * @param {object}
     * @return {void}
     */
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

      /**
       * Deprecated function for sorting PieceGroups by amount of child Piece objects.
       * 
       * @param {Array} pieceGroups
       * @return {Array}
       */
      sortPieceGroupsByChildrenCount(pieceGroups) {
        return pieceGroups.sort((a, b) => a.children.length - b.children.length);
      }

      /**
       * Deprecated function for finding the next position for a piece while the pieces are being sorted.
       */
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
      
      /**
       * Deprecated function for determining the coordinates of a piece within a grid.
       */
      calculatePosition(index, distance, width, height) {
        const x = (index % width) * distance;
        const y = Math.floor(index / width) * distance;
        return new THREE.Vector3(x, y, 0);
      }


      /**
       * Deprecated function for organizing pieces in a grid.
       */
      positionObjects(objects, distance = 100, xOffset = 0, yOffset = 0) {
        let newCameraPos = new THREE.Vector3(this.puzzle.texture.image.width,this.puzzle.texture.image.height,this.puzzle.texture.image.width + this.puzzle.texture.image.height)
        utils.moveObjectToPosition(this.camera, newCameraPos)
        let currentX = xOffset;
        let currentY = yOffset;
        let currentRowMaxHeight = 0;
        const availableWidth = window.innerWidth;
      
        objects.forEach((object) => {
          if (currentX + object.width > availableWidth) {
            currentX = xOffset;
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
      
      /**
       * Deprecated helper function for organizing pieces in a grid.
       */
      positionPiecesAndPieceGroups(distance = 50, xOffset = -200, yOffset = -200) {
        let pieces = []
        let pieceGroup = []
        for (let object of this.scene.children) {
          if (object instanceof Piece) {
            pieces.push(object)
          } else if (object instanceof PieceGroup) {
            pieceGroup.push(object)
          }
        }
        const maxYofPieceGroups = this.positionObjects(pieceGroup, distance, xOffset, yOffset);
        const yOffsetForPieces = maxYofPieceGroups + distance;
        this.positionObjects(pieces, distance, xOffset, yOffsetForPieces);
      }
          
    
      
      /**
       * Currently returns a fixed value for piece zoom. Also can return an oscillating value
       * based on amount of time the piece is held.
       * 
       * @param {number} elapsedTime - Amount of time since last tick.
       * @return {number}
       */
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

    /**
     * Plays a sound determined by soundIndex if the sound setting is enabled.
     * 
     * @param {number} soundIndex - A value representing the sound to be played.
     * @param {boolean} settingEnabled - True if sound is enabled by the user, false otherwise.
     * @return {void}
     */
    playSound(soundIndex, settingEnabled = true) {
        if (settingEnabled) {
            const audioBuffer = this.sounds[soundIndex]
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);    
        }
      }

    /**
     * Checks whether a URL leads to an actual image file or not.
     * 
     * @param {string} url - a URL leading to an image on the internet.
     * @param {function} callback - Function that makes a puzzle if the image is valid, or executes an error.
     */
    isValidImageURL(url, callback) {
        let img = new Image();
    
        img.crossOrigin = "anonymous"; // Attempt to request CORS approval
    
        img.onload = function() {
            let canvas = document.createElement("canvas");
            canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size
    
            // Draw image to canvas
            canvas.getContext('2d').drawImage(this, 0, 0, this.naturalWidth, this.naturalHeight);
    
            if (this.width < 300 || this.height < 300) {
                callback(false, 'Image dimensions are smaller than 300x300');
            } else {
                callback(true, 'Image is valid and dimensions are larger than 300x300');
            }
        }
    
        img.onerror = function() {
            // Here, we assume that an error might be due to CORS issues.
            // However, keep in mind that this could also be due to the image not existing, the server being down, etc.
            callback(false, 'Could not load image. This might be due to CORS policies or the image does not exist');
        }
    
        img.src = url;
    }
        
          

    /**
     * Sets variables related to object movement when an object is let go.
     * 
     * @param {DragEvent} event - Event containing object information, used to call a function of the object.
     */
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
    
    /**
     * Renders the scene.
     * 
     * @return {void}
     */
    render() {
        this.renderer.render(this.scene, this.camera)
    }

    /**
     * Handles user key bindings.
     * 
     * @param {keydown} event - Event containing the keycode of the key being pressed.
     * @return {void}
     */
    #onKeyDown(event) { // debug the right and left things, they're flipped
        let textInput = document.getElementById('mm-text-input')
        if (textInput == document.activeElement) {
            return
        }
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
                this.mainMenu.resetView()
            }
            //this.html.getelementbyid.css = 'block' on and off

        }
        if (event.keyCode == 16) {
            if (this.dragActiveObj) {
                this.camera.position
                let newPos = this.zoomCamera(0.05)
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)
            }
        }
        if (event.keyCode == 67) {
            if (this.puzzle) {
                let newPos;
                if (this.perspective) {
                    newPos = new THREE.Vector3(0, -1225, (1740))
                } else {
                    newPos = new THREE.Vector3(0, 100, (1740))
                }
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
        }
        if (event.keyCode == 88) {
            if (this.puzzle) {
                let newPos;
                if (this.perspective) {
                    newPos = new THREE.Vector3(0, -1190, (1740)*0.8)
                } else {
                    newPos = new THREE.Vector3(0, -27, (1740)*0.8)
                }

                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
        }
        if (event.keyCode == 90 || event.keyCode == 83) { // z or s - s so the a-s-d experience is seamless
            if (this.puzzle) {
                let newPos;
                if (this.perspective) {
                    newPos = new THREE.Vector3(0, -1150, (1740)*0.5)
                } else {
                    newPos = new THREE.Vector3(0, -205, (2300)*0.5)
                }
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
        }
        if (event.keyCode == 65) { // a
            if (this.puzzle) {
                let newPos;
                if (this.perspective) {
                    newPos = new THREE.Vector3(-1000, -1150, (1740)*0.5)
                } else {
                    newPos = new THREE.Vector3(-1000, -205, (2300)*0.5)
                }
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
        }
        if (event.keyCode == 68) { // d
            if (this.puzzle) {
                let newPos;
                if (this.perspective) {
                    newPos = new THREE.Vector3(1000, -1150, (1740)*0.5)
                } else {
                    newPos = new THREE.Vector3(1000, -205, (2300)*0.5)
                }
                utils.moveObjectToPosition(this.camera, newPos, 200, false, true)

            }
        }




        if (event.keyCode == 48) {
            this.positionPiecesAndPieceGroups()
        }
        if (event.keyCode == 49) {
            document.getElementById("backgroundVideo").src = "videos/jf1.mp4"
            document.getElementById("backgroundVideo")
        }
        if (event.keyCode == 32) {
            event.preventDefault()
            let newPos;
            if (this.perspective) {
                newPos = new THREE.Vector3(0, -1225, (1740))
            } else {
                newPos = new THREE.Vector3(0, 100, (1740))
            }
            utils.moveObjectToPosition(this.camera, newPos, 200, false, true)
    }
        if (event.keyCode == 40) {
            // this.camera.rotation.set(0.7, 0, 0)
            let newPos = new THREE.Vector3(0, -1150, (1740)*0.5)
            utils.moveObjectToPosition(this.camera, newPos, 200, false, true, 0.7)
            this.perspective = 1
        }
        if (event.keyCode == 38) {
            // this.camera.rotation.set(0, 0, 0)
            let newPos = new THREE.Vector3(0, -205, (2300)*0.5)
            utils.moveObjectToPosition(this.camera, newPos, 200, false, true, 0)
            this.perspective = 0
        }

    }

    /**
     * Moves the mesh to the new location of the mouse after a mesh is grabbed and the camera is moved.
     * 
     * @param {THREE.Mesh} mesh - The mesh to be moved.
     * @return {void}
     */
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
             
    /**
     * Loads an image from the internet as a puzzle. If image is invalid, shows an error message.
     * 
     * @param {submit} event - The event containing information about the submitted form.
     * @return {void}
     */
    #onFormSubmit(event) {
        
        event.preventDefault()
        const url = event.target.elements.url.value;
        this.isValidImageURL(url, (isValid, message) => {
            if (isValid) {
                let elements = document.querySelectorAll(".invalid-url");

                // Iterate over elements and remove "shadowrealm" class
                elements.forEach(function(element) {
                    if (!element.classList.contains("shadowrealm")) {
                        element.classList.add("shadowrealm");
                    }
                });
                this.makeNewPuzzle(url);
            } else {
                // Show an error message
                // Get all elements with class "invalid-url"
                let elements = document.querySelectorAll(".invalid-url");

                // Iterate over elements and remove "shadowrealm" class
                elements.forEach(function(element) {
                    element.classList.remove("shadowrealm");
                });
                console.error(message);
            }
        });
    }
            
    /**
     * Handles camera movement on middle mouse click, and handles closing the main menu and opening settings.
     * 
     * @param {MouseEvent} event - Used to prevent default action of middle mouse button.
     * @return {void}
     */
    #onMouseDown(event) {
        if (event.button === 1) {
            event.preventDefault()
            event.stopPropagation();
            // middle mouse button was clicked
            this.isMiddleButtonDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
      
        } 
        if (!event.target.classList.contains("mm")) {
            this.mainMenu.close()
        }


        if (event.target.classList.contains("settings-main")) {
            this.mainMenu.toggleSettings();
        }

    }

    /**
     * Sets variables related to mouse movement and image preview opacity.
     * 
     * @param {MouseEvent} event - Used to determine location of mouse.
     * @return {void}
     */
    #onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;    
      
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
          
    /**
     * When the mouse is clicked on an image in the menu, make a new puzzle.
     * 
     * @param {MouseEvent} event - Used to determine clicked object in menu.
     * @return {void}
     */
    #onMouseUp(event) {
        if (event.button === 1) {
            // middle mouse button was released
            this.isMiddleButtonDown = false;
          }
        if (event.target.classList.contains("chosen-image")) {
            if (event.target.classList.contains("geography")) {
            // if (event.target.src == 'http://192.168.1.165:8080/assets/images/cd7b19abb5e64293.png') {
                if (event.target.src == "http://192.168.1.165:8080/assets/images/5055beaafc96e7f1.png"){
                    this.makeNewPuzzle("./geography/img/northAmerica.png", "./geography/svg/northAmerica.svg")
            } else if (event.target.src == "http://192.168.1.165:8080/assets/images/c9ad9d4270a10439.png") {
                this.makeNewPuzzle("./geography/img/southAmerica.png", "./geography/svg/southAmerica.svg")
            }
        } else {
            let fullSizeSrc = event.target.src.replace("previewMenuImages", "menuImages")
            this.makeNewPuzzle(fullSizeSrc)

        }

   
        }
    }

    /**
     * Alters the camera zoom.
     * 
     * @param {MouseEvent} event - event.deltaY is used to determine how much to alter the zoom.
     * @return {void}
     */
    #onWheel(event) {
        if (this.mainMenu.appearance() == 0) {
            this.deltaCameraZ += event.deltaY;
            while (this.deltaCameraZ != 0) {
                let newPos = this.camera.position.z + this.deltaCameraZ/3
                if (!(newPos > this.cameraZone[1]) && !(newPos < this.cameraZone[0])) {
                    this.camera.position.z = newPos
                }
                this.deltaCameraZ = Math.abs(this.deltaCameraZ) > 1 ? this.deltaCameraZ/10 : this.deltaCameraZ = 0;
                this.render()
            } 

    }

    }
}