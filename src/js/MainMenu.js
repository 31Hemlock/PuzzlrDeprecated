export class MainMenu {
    constructor() {
        this.modal = document.getElementById('mainmenu')
        this.input = document.getElementById('mm-file-input')
        this.xSpan = document.getElementById('mm-close')
        this.xSpan.addEventListener('click', () => {
            this.close()
        })
        this.init()
        this.appearanceState = 1
    }

    init() {
    }

    open() {
        this.modal.style.display = 'block'
        this.appearanceState = 1
    }
    close() {
        this.modal.style.display = 'none'
        this.appearanceState = 0
    }


    appearance() {
        return this.appearanceState
    }


}
