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
        this.modal.classList.add('open')
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


}
