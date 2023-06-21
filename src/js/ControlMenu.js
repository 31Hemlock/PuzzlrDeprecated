export class ControlMenu {
    constructor() {
        this.toggleControls = document.getElementById('toggleControls')
        this.controls = document.getElementById('controls')
        this.appearanceState = 1
        this.toggleControls.addEventListener('click', () => {
            console.log('ctrl')
            this.toggle()
        })

        // this.init()
    }

    toggle() {
        if (this.appearanceState == 0) {
            this.open()
        } else {
            this.close()
        }
    }

    init() {
        // this.modal.classList.add('open')
    }

    open() {
        this.appearanceState = 1
        this.controls.classList.add('controls-open');
        this.toggleControls.innerHTML = "Click to hide"

    }
    close() {
        this.appearanceState = 0
        this.controls.classList.remove('controls-open');
        this.toggleControls.innerHTML = "<< Controls >>"

    }


    appearance() {
        return this.appearanceState
    }



}
