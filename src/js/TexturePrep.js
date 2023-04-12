import * as THREE from 'three'

export class TexturePrep{
    constructor(textureReference) { // consider adding thumbnail/puzzle dims
        this.textureReference = textureReference // an instance of objectTexture or stringTexture from main code
        this.textureLoader = new THREE.TextureLoader()
        
    }

    init() {
        return new Promise((resolve, reject) => {
            if (typeof this.textureReference === "object") {
                resolve(this.textureLoader.load(this.textureReference));
            } else if (typeof this.textureReference === "string") {
                this.textureLoader.load(
                this.textureReference,
                (texture) => {
                    resolve(texture);
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
    
}