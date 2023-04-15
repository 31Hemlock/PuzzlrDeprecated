import './style.css'
import * as THREE from 'three'
import {
    SVGLoader
} from "three/examples/jsm/loaders/SVGLoader";
import {
    Face
} from 'three/examples/jsm/math/ConvexHull.js';
import * as dat from 'lil-gui'


import {
    DragControls
} from './js/editedDragControls'

import {
    PuzzleSVG
} from './js/PuzzleSVG.js'
import {
    PuzzleApp
} from './js/PuzzleApp.js'
import {
    Puzzle
} from './js/Puzzle.js'

import { getRandBetween } from './js/utils.js';



init();

function init() {
    const mainWindow = new PuzzleApp(document.getElementById("main"))
}
