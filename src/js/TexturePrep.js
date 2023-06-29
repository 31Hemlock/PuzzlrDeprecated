import * as THREE from 'three'

export class TexturePrep{
    /**
     * @constructor
     * @param {string|object} textureReference - The target image represented as a string or object.
     * @param {number} [maxWidth=2000] - The maximum width to which a texture can be resized.
     * @param {number} [maxHeight=1300] - The maximum height to which a texture can be resized.
     */
    constructor(textureReference, maxWidth = 2000, maxHeight = 1300) { // default values are set here, can be overridden
        this.textureReference = textureReference // an instance of objectTexture or stringTexture from main code
        this.textureLoader = new THREE.TextureLoader()
        this.maxWidth = maxWidth
        this.maxHeight = maxHeight
    }

    /**
     * Loads the texture.
     * 
     * @method
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, reject) => {
            if (typeof this.textureReference === "object") {
                let texture = this.textureLoader.load(this.textureReference);
                resolve(this.resizeTexture(texture));
            } else if (typeof this.textureReference === "string") {
                this.textureLoader.load(
                this.textureReference,
                (texture) => {
                    resolve(this.resizeTexture(texture));
                },
                undefined,
                (error) => {
                    reject(error);
                }
                );
            } else {
                reject("Invalid texture value");
            }
        });
        
    }

    /**
     * Resizes the loaded texture.
     * 
     * @method
     * @param {THREE.Texture} texture - A texture as represented by three.js.
     * @return {THREE.Texture}
     */
    resizeTexture(texture) {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
    
        let aspectRatio = texture.image.width / texture.image.height;
    
        let newWidth = texture.image.width;
        let newHeight = texture.image.height;
    
        if(newWidth > this.maxWidth) {
            newWidth = this.maxWidth;
            newHeight = this.maxWidth / aspectRatio;
        }
    
        if(newHeight > this.maxHeight) {
            newHeight = this.maxHeight;
            newWidth = this.maxHeight * aspectRatio;
        }
    
        canvas.width = newWidth;
        canvas.height = newHeight;
    
        // Draw the image to the canvas, resizing it
        context.drawImage(texture.image, 0, 0, texture.image.width, texture.image.height, 0, 0, canvas.width, canvas.height);
    
        // Use the canvas as the source of a new texture
        let newTexture = new THREE.Texture(canvas);
        newTexture.needsUpdate = true;
    
        return newTexture;
    }
        
}
