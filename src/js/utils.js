import {rotationValues} from './constants'
import {PuzzleApp} from './PuzzleApp'

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
