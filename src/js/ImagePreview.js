export class ImagePreview {
    constructor(imgReference) {
        this.imgReference = imgReference
        this.imgContainer = document.getElementById('imagePreviewContainer')
        this.imgElement = document.getElementById('imagePreview')
        this.pinButton = document.getElementById('pinButton')
        this.init()
    }

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
    
    setSource(img) {
        this.imgReference = img
        console.log(this)
        if (typeof this.imgReference === "object") {
            console.log('Object passed')
        } else if (typeof this.imgReference == "string") {
            this.imgElement.src = this.imgReference
        } else {
            console.log('No image referenced.')
        }

    }

    setNonInteractive() {
        this.imgContainer.classList.add("no-interaction")
    }

    setInteractive() {
        this.imgContainer.classList.remove("no-interaction")
    }

    updateImageReference(newImgReference) {
        this.imgReference = newImgReference;
        this.setSource();
      }
    
    hide() {
      this.imgContainer.classList.add("shadowrealm")
    }
    show() {
      this.imgContainer.classList.remove("shadowrealm")
    }

}
