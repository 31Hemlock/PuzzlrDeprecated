import {rotationValues} from './constants'
import {PuzzleApp} from './PuzzleApp'
import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js';


export function getRandBetween(min, max) {
    return Math.random() * (max - min) + min;
}

export function willOverflow(array, index, direction) {
    if (direction == 'right') {
        return (index + 1 == array.length) ? true: false;
    } else if (direction == 'left') {
        return (index - 1 < 0) ? true: false;
    }
}

export function minYVector(vectors) {
    var minVector = vectors[0].y;
    for (var i = 0; i < vectors.length; i++) {
        if (minVector > vectors[i].y) {
            minVector = vectors[i].y
        }
    }
    return minVector

}

export function minXVector(vectors) {
  var minVector = vectors[0].x;
  for (var i = 0; i < vectors.length; i++) {
      if (minVector > vectors[i].x) {
          minVector = vectors[i].x
      }
  }
  return minVector

}


export function findVector(vectorType, dimension, vectors) {
    var selectedVector = null;
    var selectedValue = null;

    for (var i = 0; i < vectors.length; i++) {
        var currentValue = vectors[i][dimension];

        if (vectorType === 'min') {
            if (selectedValue === null || currentValue < selectedValue) {
                selectedVector = vectors[i];
                selectedValue = currentValue;
            }
        } else if (vectorType === 'max') {
            if (selectedValue === null || currentValue > selectedValue) {
                selectedVector = vectors[i];
                selectedValue = currentValue;
            }
        } else {
            throw new Error('Invalid vector type: ' + vectorType);
        }
    }
    

    if (selectedVector === null) {
        throw new Error('No vectors found');
    }

    return selectedVector[dimension];
}


export function rotateAny(obj, direction) {
    let iOffset = (direction == 'right') ? 1 : -1;
    let iRotationValue = (direction == 'right') ? 0 : rotationValues.length - 1;
  
    for (let i = 0; i < rotationValues.length; i++) {
      if (Math.abs(obj.rotation.z - rotationValues[i]) < 0.00001) {
        if (willOverflow(rotationValues, i, direction)) {
          obj.rotation.z = rotationValues[iRotationValue];
        } else {
          obj.rotation.z = rotationValues[i + iOffset];
        }
        break;
      }

    }
  
    let main = new PuzzleApp();
    main.render();
  }


  export async function loadImages() {
    const imageContainer = document.getElementById('image-container');
    let imgLen = 24
    let images = []
        for (let i=1;i<=imgLen;i++) {
            images.push('menuImages/' + i + '.jpg')
        }
    images.forEach(imageSrc => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('image-wrapper');
      wrapper.classList.add('mm');

      const image = document.createElement('img');
      image.src = imageSrc;
      image.classList.add('mm')
      image.classList.add('chosen-image')

      image.alt = 'Image description'; // Add a meaningful description
  
      wrapper.appendChild(image);
      imageContainer.appendChild(wrapper);
    });
  }
  
  export async function getImages() {
        console.log(retArr)
    }


    export function getAverageColor(texture) {
        // Create a canvas to draw the texture
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas dimensions to match texture
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        
        // Draw the texture on the canvas
        context.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        
        // Get the image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Initialize color accumulators
        let r = 0;
        let g = 0;
        let b = 0;
        
        // Iterate through the image data and sum up the color components
        for (let i = 0; i < imageData.length; i += 4) {
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
        }
        
        // Calculate the average color
        const numPixels = canvas.width * canvas.height;
        r = Math.floor(r / numPixels);
        g = Math.floor(g / numPixels);
        b = Math.floor(b / numPixels);
        console.log(r, g, b)
        // r = 255 - r
        // g = 255 - g
        // b = 255 - b
        // console.log(r, g, b)

        // Return the average color as a Three.js Color object
        let avgColor = [r, g, b]
        return avgColor;
        }

        export function complementaryThreeColor(rgb) {
            // Convert RGB to HSL
            let r = rgb[0] / 255;
            let g = rgb[1] / 255;
            let b = rgb[2] / 255;
            let max = Math.max(r, g, b);
            let min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
    
            if (max === min) {
                h = s = 0;
            } else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
                switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
                }
    
                h /= 6;
            }
    
            // Set saturation and lightness to create a pastel version
            s = 0.5;
            l = 0.4;
    
            // Create a THREE.Color object with the resulting HSL values
            let threeColor = new THREE.Color();
            threeColor.setHSL(h, s, l);
            return threeColor;
            }
    


  
//   async function getImages() {
//     const response = await fetch('/path/to/your/server-side/script');
//     const images = await response.json();
//     return images.map(image => `static/menuImages/${image}`);
//   }
  
export function moveObjectToPosition(object, targetPosition, duration = 1000, ignoreZ = false) {
    const startPosition = new THREE.Vector3().copy(object.position);
    const targetPositionCopy = new THREE.Vector3().copy(targetPosition);
  
    if (ignoreZ) {
      targetPositionCopy.z = startPosition.z;
    }
  
    const tween = new TWEEN.Tween(startPosition)
      .to(targetPositionCopy, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        if (ignoreZ) {
          object.position.set(startPosition.x, startPosition.y, object.position.z);
        } else {
          object.position.copy(startPosition);
        }
      })
      .onComplete(() => {
        if (object.moved) {
          object.moved(false);
        }
      })
      .start();
  }
  

export function updateCameraPosition(camera, target, factor = 0.1, ignoreZ = true) {
    const targetPosition = new THREE.Vector3().copy(target.position);

    if (ignoreZ) {
        targetPosition.z = camera.position.z;
    }

    camera.position.lerp(targetPosition, factor);
}
