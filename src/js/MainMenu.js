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
    }

    init() {
        this.modal.classList.add('open')
        this.settingSelectedCount = document.getElementById('pieces-select');
        this.settingNumPieces = this.settingSelectedCount.selectedIndex;
        this.settingPuzzleTypeDocu = document.getElementById('puzzle-select')
        this.settingPuzzleType = this.settingPuzzleTypeDocu.selectedIndex;
    }

    open() {
        this.appearanceState = 1
        this.modal.classList.add('open');

    }
    close() {
        this.appearanceState = 0
        this.modal.classList.remove('open');
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
