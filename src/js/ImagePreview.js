/**
 * Represents the image preview of the puzzle.
 * @class
 */
export class ImagePreview {
  /**
   * @constructor
   * @param {string|object} imgReference - A string (file reference) or html object representation of an image.
   */
    constructor(imgReference) {
        this.imgReference = imgReference
        this.imgContainer = document.getElementById('imagePreviewContainer')
        this.imgElement = document.getElementById('imagePreview')
        this.pinButton = document.getElementById('pinButton')
        this.init()
    }

    /**
     * Initializes the image preview.
     * 
     * @method
     */
    init() {
        this.setSource(this.imgReference)
        this.pinButton.addEventListener("click", () => {
          this.imgContainer.classList.toggle("pinned");
          if (this.imgContainer.classList.contains("pinned")) {
            this.pinButton.textContent = "Pinned!";
            this.pinButton.classList.add("depressed");
          } else {
            this.pinButton.textContent = "Pin";
            this.pinButton.classList.remove("depressed");
          }
        });
      }
    
      /**
       * Sets the source of the image object to the current puzzle image.
       * 
       * @method
       * @param {string|object} img - A string (file reference) or html object representation of an image.
       * @return {void}
       */
    setSource(img) {
        this.imgReference = img
        if (typeof this.imgReference === "object") {
            console.log('Object passed')
        } else if (typeof this.imgReference == "string") {
            this.imgElement.src = this.imgReference
        } else {
            console.log('No image referenced.')
        }

    }

    /**
     * Makes the image preview non-interactive.
     * 
     * @method
     * @return {void}
     */
    setNonInteractive() {
        this.imgContainer.classList.add("no-interaction")
    }

    /**
     * Makes the image preview interactive.
     * 
     * @method
     * @return {void}
     */
    setInteractive() {
        this.imgContainer.classList.remove("no-interaction")
    }

    /**
     * Deprecated function to update the image reference to the newly generated puzzle image.
     * 
     * @method
     * @param {string|object} newImgReference - A string (file reference) or html object representation of an image.
     * @return {void}
     */
    updateImageReference(newImgReference) {
        this.imgReference = newImgReference;
        this.setSource(this.imgReference);
    }
    
    /**
     * Hides the image preview from view.
     * 
     * @method
     * @return {void}
     */
    hide() {
      this.imgContainer.classList.add("shadowrealm")
    }

    /**
     * Makes the image preview visible.
     * 
     * @method
     * @return {void}
     */
    show() {
      this.imgContainer.classList.remove("shadowrealm")
    }

}
