/**
 * Represents the menu that can be opened to reveal controls to the user.
 * @class
 */
export class ControlMenu {
    /**
     * @constructor
     */
    constructor() {
        this.toggleControls = document.getElementById('toggleControls')
        this.controls = document.getElementById('controls')
        this.appearanceState = true
        this.toggleControls.addEventListener('click', () => {
            this.toggle()
        })

        // this.init()
    }

    /**
     * Toggles the menu's visibility.
     * 
     * @method
     * @return {void}
     */
    toggle() {
        if (this.appearanceState == false) {
            this.open()
            this.appearanceState = true
        } else {
            this.close()
            this.appearanceState = false
        }
    }

    /**
     * Initializes the controls menu.
     * 
     * @method
     * @return {void}
     */
    init() {
        // this.modal.classList.add('open')
    }

    /**
     * Makes the controls menu visible.
     * 
     * @method
     * @return {void}
     */
    open() {
        this.appearanceState = true
        this.controls.classList.add('controls-open');
        this.toggleControls.innerHTML = "Click to hide"

    }

    /**
     * Makes the controls menu shrink out of view.
     * 
     * @method
     * @return {void}
     */
    close() {
        this.appearanceState = false
        this.controls.classList.remove('controls-open');
        this.toggleControls.innerHTML = "<< Controls >>"

    }

    /**
     * Disables the view of the controls menu for the duration of runtime.
     * Currently used if the user is on mobile.
     * 
     * @method
     * @return {void}
     */
    hideForever() {
        this.appearanceState = false
        this.controls.classList.add('shadowrealm')
    }

    /**
     * Returns the current appearance state of the controls menu.
     * 
     * @method
     * @return {boolean}
     */
    appearance() {
        return this.appearanceState
    }
}
