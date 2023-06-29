
import { PuzzleApp } from "./PuzzleApp"

/**
 * Represents the escape menu.
 * @class
 */
export class MainMenu {
    /**
     * @constructor
     * @return {void}
     */
    constructor() {
        this.modal = document.getElementById('mainmenu')
        this.input = document.getElementById('mm-file-input')
        this.xSpan = document.getElementById('mm-close')
        this.xSpan.addEventListener('click', () => {
            this.close()
        })
        this.settings = document.getElementById('settings-content')
        this.mainContent = document.getElementById('startmenu-content')
        this.init()
        this.appearanceState = 1
        this.settingPreviewImage = document.getElementById('preview-checkbox');
        this.settingSound = document.getElementById('sound-checkbox');
        this.main = new PuzzleApp()
    }

    /**
     * Initializes the main menu.
     * 
     * @method
     * @return {void}
     */
    init() {
        // this.modal.classList.add('open')
        this.settingSelectedCount = document.getElementById('pieces-select');
        this.settingNumPieces = this.settingSelectedCount.selectedIndex;
        this.settingPuzzleTypeDocu = document.getElementById('puzzle-select')
        this.settingPuzzleType = this.settingPuzzleTypeDocu.selectedIndex;
    }

    /**
     * Opens the main menu.
     * 
     * @method
     * @return {void}
     */
    open() {
        this.appearanceState = 1
        this.modal.classList.add('open');

    }
    
    /**
     * Closes the main menu.
     * 
     * @method
     * @return {void}
     */
    close() {
        if (this.main.camera.rotation.x != 0 && this.main.camera.rotation.x != 0.7) {
            this.main.centerCamera()
        }
        this.appearanceState = 0
        this.modal.classList.remove('open');

        // Remove error message text (if exists)
        let elements = document.querySelectorAll(".invalid-url");

        // Iterate over elements and remove "shadowrealm" class
        elements.forEach(function(element) {
            if (!element.classList.contains("shadowrealm")) {
                element.classList.add("shadowrealm");
            }
        });

    }

    /**
     * Reveals the escape menu and scrolls it to the top.
     * 
     * @method
     * @return {void}
     */
    resetView() {
        this.showMain()
        this.modal.scrollTop = 0;
    }

    /**
     * Returns the state of appearance of the menu.
     * 
     * @method
     * @return {void}
     */
    appearance() {
        return this.appearanceState
    }

    /**
     * Toggles the display of settings in the escape menu.
     * 
     * @method
     * @returns {void}
     */
    toggleSettings() {
        if (this.settings.classList.contains('display')) {
            this.showMain()
        } else {
            this.showSettings()
        }
    }

    /**
     * Displays the settings pane of the menu.
     * 
     * @method
     * @returns {void}
     */
    showSettings() {
        this.settings.classList.add('display')
        this.mainContent.classList.remove('display')

        this.mainContent.classList.add('no-interaction')
        this.settings.classList.remove('no-interaction')
        
    }

    /**
     * Displays the main page of the menu.
     * 
     * @method
     * @returns {void}
     */
    showMain() {
        this.settings.classList.remove('display')
        this.mainContent.classList.add('display')

        this.mainContent.classList.remove('no-interaction')
        this.settings.classList.add('no-interaction')
    }
}
