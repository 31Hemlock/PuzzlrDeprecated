import {rotationValues} from './constants'
import {PuzzleApp} from './PuzzleApp'
import * as THREE from 'three'
import * as TWEEN from '@tweenjs/tween.js';


/**
 * Returns a random number between two values.
 * 
 * @method
 * @param {number} min - the minimum value.
 * @param {number} max - the maximum value.
 * @return {number}
 */
export function getRandBetween(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Checks whether an array will overflow if incremented in a certain direction.
 * 
 * @method
 * @param {array} array - The array to check.
 * @param {number} index - The index of the array to check.
 * @param {string} direction - The direction in which to check (left or right).
 * @return {boolean}
 */
export function willOverflow(array, index, direction) {
    if (direction == 'right') {
        return (index + 1 == array.length) ? true: false;
    } else if (direction == 'left') {
        return (index - 1 < 0) ? true: false;
    }
}

/**
 * Deprecated function to find the smallest Y value in an array of vectors.
 */
export function minYVector(vectors) {
    var minVector = vectors[0].y;
    for (var i = 0; i < vectors.length; i++) {
        if (minVector > vectors[i].y) {
            minVector = vectors[i].y
        }
    }
    return minVector

}

/**
 * Deprecated function to find the smallest X value in an array of vectors.
 */
export function minXVector(vectors) {
  var minVector = vectors[0].x;
  for (var i = 0; i < vectors.length; i++) {
      if (minVector > vectors[i].x) {
          minVector = vectors[i].x
      }
  }
  return minVector

}

/**
 * Finds the minimum or maximum vector with respect to a certain dimension in an array.
 * 
 * @method
 * @param {string} vectorType - Whether to find the minimum or maximum vector.
 * @param {string} dimension - The dimension (x, y, z) to check.
 * @param {array} vectors - The vectors in which to search.
 * @return {number}
 */
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

/**
 * Rotates an object in a direction.
 * 
 * @method
 * @param {object} obj - An object in the three.js scene.
 * @param {string} direction - The direction (left or right) in which to rotate.
 * @return {void}
 */
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

/**
 * Loads the preview images into the menu at launch.
 * 
 * @async
 * @return {void}
 */
export async function loadImages() {
  const imageContainer = document.getElementById('image-container');
  let imgLen = 40
  let images = []
      for (let i=1;i<=imgLen;i++) {
          images.push('previewMenuImages/' + i + '.jpg')
      }
  images.forEach(imageSrc => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('image-wrapper');
    wrapper.classList.add('mm');

    const image = document.createElement('img');
    image.src = imageSrc;
    image.classList.add('mm')
    image.classList.add('chosen-image')

    wrapper.appendChild(image);
    imageContainer.appendChild(wrapper);
  });
}

/**
 * Deprecated debug function.
 */
export async function getImages() {
      console.log(retArr)
  }

/**
 * Finds the average color of a texture.
 * 
 * @method
 * @param {THREE.Texture} texture - a three.js texture object.
 * @return {array}
 */
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

/**
 * Finds a good compliment color for the argument color.
 * 
 * @method
 * @param {array} rgb - An array representing a color of the form [r, g, b].
 */
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

/**
 * Moves an object to a position, smoothly, over a given period of time.
 * Can rotate the object and maintain a mesh's position
 * relative to the user's mouse during the move.
 * 
 * @method
 * @param {object} object - The object in three.js to be moved.
 * @param {THREE.Vector3} targetPosition - A vector object representing the desired position of the object.
 * @param {number} [duration=1000] - Amount of time, in ms, for the animation to occur.
 * @param {boolean} [ignoreZ=false] - Allows or prevents the object from moving along the Z-axis.
 * @param {boolean} [meshToMouse=false] - If an object is being dragged, its position relative to the user's mouse will be maintained if true.
 * @param {number} [targetRotationX=object.rotation.x] - The target rotation in the X dimension for the object.
 * @return {void}
 */
export function moveObjectToPosition(object, targetPosition, duration = 1000, ignoreZ = false, meshToMouse = false, targetRotationX = object.rotation.x) {
  const startPosition = new THREE.Vector3().copy(object.position);
  const startRotationX = object.rotation.x; // store the starting x rotation
  const targetPositionCopy = new THREE.Vector3().copy(targetPosition);
  let main = new PuzzleApp();
  if (ignoreZ) {
      targetPositionCopy.z = startPosition.z;
  }

const tween = new TWEEN.Tween({ progress: 0 })
  .to({ progress: 1 }, duration)
  .easing(TWEEN.Easing.Quadratic.Out)
  .onUpdate(({ progress }) => {
    const currentX = startPosition.x + (targetPositionCopy.x - startPosition.x) * progress;
    const currentY = startPosition.y + (targetPositionCopy.y - startPosition.y) * progress;
    const currentZ = ignoreZ ? object.position.z : startPosition.z + (targetPositionCopy.z - startPosition.z) * progress;
    object.position.set(currentX, currentY, currentZ);
    object.rotation.x = startRotationX + (targetRotationX - startRotationX) * progress;

    if (main.dragActiveObj && meshToMouse) {
      main.moveMeshToMouse(main.dragActiveObj);
      main.render();
    }
  })
  .onComplete(() => {
    if (object.moved) {
      object.moved(false);
    }
  })
  .start();
}

/**
 * **Replaced by moveObjectToPosition**
 * Deprecated function for moving the camera to a position.
 */
export function updateCameraPosition(camera, target, factor = 0.1, ignoreZ = true) {
  let targetPosition;
  if (target?.position) {
    targetPosition = new THREE.Vector3().copy(target.position);
  } else {
    targetPosition = new THREE.Vector3().copy(target)
  }

    if (ignoreZ) {
        targetPosition.z = camera.position.z;
    }

    camera.position.lerp(targetPosition, factor);
}

/**
 * Removes the outliers from an array.
 * 
 * @method
 * @param {array} array - The array to manipulate.
 * @param {number} outliersCount - The number of outliers to be removed.
 * @return {array}
 */
export function removeOutliers(array, outliersCount) {
  // Calculate initial average
  const initialAverage = array.reduce((a, b) => a + b, 0) / array.length;

  // Create a copy of the array with additional property - distance from the average
  let arrayWithDist = array.map((value) => ({
      value: value,
      distance: Math.abs(initialAverage - value),
  }));

  // Sort the array by distance property in descending order
  arrayWithDist.sort((a, b) => b.distance - a.distance);

  // Remove outliersCount number of elements from the array
  arrayWithDist = arrayWithDist.slice(outliersCount);

  // Now arrayWithDist holds the values without outliers
  // Get the array of original values back
  const valuesWithoutOutliers = arrayWithDist.map((item) => item.value);

  // Calculate and return new average
  return valuesWithoutOutliers.reduce((a, b) => a + b, 0) / valuesWithoutOutliers.length;
}

/**
 * Rounds a value to a certain amount of decimal places.
 * 
 * @param {number} value - The number to round.
 * @param {number} decimalPlaces - The amount of decimal places desired.
 * @return {number}
 */
export function roundToFixed(value, decimalPlaces) {
  return parseFloat(value.toFixed(decimalPlaces));
}
