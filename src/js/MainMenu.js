
import { PuzzleApp } from "./PuzzleApp"

export class MainMenu {
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
        console.log(this.settingPreviewImage)
        this.settingSound = document.getElementById('sound-checkbox');
        this.main = new PuzzleApp()
    }

    init() {
        // this.modal.classList.add('open')
        this.settingSelectedCount = document.getElementById('pieces-select');
        this.settingNumPieces = this.settingSelectedCount.selectedIndex;
        this.settingPuzzleTypeDocu = document.getElementById('puzzle-select')
        this.settingPuzzleType = this.settingPuzzleTypeDocu.selectedIndex;
    }

    open() {
        this.appearanceState = 1
        this.modal.classList.add('open');
        console.log(this.modal.classList)

    }
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

    resetView() {
        this.showMain()
        this.modal.scrollTop = 0;
    }


    appearance() {
        return this.appearanceState
    }

    toggleSettings() {
        if (this.settings.classList.contains('display')) {
            this.showMain()
        } else {
            this.showSettings()
        }
    }

    showSettings() {
        this.settings.classList.add('display')
        this.mainContent.classList.remove('display')

        this.mainContent.classList.add('no-interaction')
        this.settings.classList.remove('no-interaction')
        
    }

    showMain() {
        this.settings.classList.remove('display')
        this.mainContent.classList.add('display')

        this.mainContent.classList.remove('no-interaction')
        this.settings.classList.add('no-interaction')

    }


}
