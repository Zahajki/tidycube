import { Face } from './GeometricCube'
import some = require('lodash/some')

export const StageMask: { [s: string]: (face: Face, i: number, j: number, d: number) => boolean } = {
  'fl': (face: Face, i: number, j: number, dimension: number): boolean => {
    return face !== Face.U && (face === Face.D || j === 0)
  },
  'f2l': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (face === Face.U) return false
    return !isLastLayerSide(face, j, dimension)
  },
  'f2l_1': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    if (face === Face.F) return !isRightMost(i, dimension)
    if (face === Face.R) return !isLeftMost(i)
    if (face === Face.D) return i !== dimension - 1 || j !== dimension - 1
    return true
  },
  'f2l_2': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l_1(face, i, j, dimension)) return false
    if (face === Face.F) return i !== 0
    if (face === Face.L) return i !== dimension - 1
    if (face === Face.D) return i !== 0 || j !== dimension - 1
    return true
  },
  'f2l_3': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    if (face === Face.F) return i !== 0
    if (face === Face.R) return i !== dimension - 1
    if (face === Face.L || face === Face.B) return i !== 0 && i !== dimension - 1
    if (face === Face.D) {
      return !some([[0 ,0], [0, dimension - 1], [dimension - 1, 0]], (point2) => {
        return i === point2[0] && j === point2[1]
      })
    }
    return true
  },
  'f2l_sm': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    if (face === Face.F || face === Face.B) return i !== 0
    if (face === Face.R || face === Face.L) return i !== dimension - 1
    if (face === Face.D) {
      return !some([[0, dimension - 1], [dimension - 1, 0]], (point2) => {
        return i === point2[0] && j === point2[1]
      })
    }
    return true
  },
  'f2b': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    if (face === Face.F || face === Face.B || face === Face.D) return i === 0 || i === dimension - 1
    return true
  },
  'line': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    return !StageMask.f2b(face, i, j, dimension)
  },
  'cross': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    if (isSideFace(face)) return !isSideMost(i, dimension)
    return !some([[0, 0], [0, dimension - 1], [dimension - 1, 0], [dimension - 1, dimension - 1]], (point2) => {
      return i === point2[0] && j === point2[1]
    })
  },
  '2x2x3': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.f2l(face, i, j, dimension)) return false
    if (face === Face.B) return false
    if (face === Face.R) return !isRightMost(i, dimension)
    if (face === Face.L) return !isLeftMost(i)
    if (face === Face.D) return j !== 0
    return true
  },
  '2x2x2': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask['2x2x3'](face, i, j, dimension)) return false
    if (face === Face.L) return false
    if (face === Face.F) return !isLeftMost(i)
    if (face === Face.D) return !isLeftMost(i)
    return true
  },

  'll': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (face === Face.U) return true
    if (face === Face.D) return false
    return isLastLayerSide(face, j, dimension)
  },
  'cll': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.ll(face, i, j, dimension)) return false
    return !isEdge(i, j, dimension)
  },
  'ell': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.ll(face, i, j, dimension)) return false
    return !isCorner(i, j, dimension)
  },
  'oll': (face: Face, i: number, j: number, dimension: number): boolean => {
    return face === Face.U
  },
  'ocll': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.oll(face, i, j, dimension) && StageMask.cll(face, i, j, dimension)
  },
  'oell': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.oll(face, i, j, dimension) && StageMask.ell(face, i, j, dimension)
  },
  'coll': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.oll(face, i, j, dimension) || StageMask.cll(face, i, j, dimension)
  },
  'ocell': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.oll(face, i, j, dimension) || StageMask.ell(face, i, j, dimension)
  },

  'wv': (face: Face, i: number, j: number, dimension: number): boolean => {
    return !isLastLayerSide(face, j, dimension)
  },
  'vh': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.f2l(face, i, j, dimension) || StageMask.oell(face, i, j, dimension)
  },
  'els': (face: Face, i: number, j: number, dimension: number): boolean => {
    if (!StageMask.vh(face, i, j, dimension)) return false
    if (face === Face.F && i === dimension - 1 && j === 0) return false
    if (face === Face.R && i === 0 && j === 0) return false
    if (face === Face.D && i === dimension - 1 && j === dimension - 1) return false
    return true
  },
  'cls': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.wv(face, i, j, dimension)
  },
  'cmll': (face: Face, i: number, j: number, dimension: number): boolean => {
    return StageMask.f2b(face, i, j, dimension) || isCorner(i, j, dimension)
  },

  'none': (face: Face, i: number, j: number, dimension: number): boolean => {
    return false
  }
}

function isLastLayerSide (face: Face, j: number, dimension: number): boolean {
  return isSideFace(face) && j === dimension - 1
}

function isSideFace (face: Face): boolean {
  return face === Face.R || face === Face.F || face === Face.L || face === Face.B
}

function isRightMost (i: number, dimension: number): boolean {
  return i === dimension - 1
}

function isLeftMost (i: number): boolean {
  return i === 0
}

function isSideMost (i: number, dimension: number): boolean {
  return isRightMost(i, dimension) || isLeftMost(i)
}

function isEdge (i: number, j: number, dimension: number): boolean {
  return (i === 0 || i === dimension - 1) && (j !== 0 && j !== dimension - 1) ||
         (j === 0 || j === dimension - 1) && (i !== 0 && i !== dimension - 1)
}

function isCorner (i: number, j: number, dimension: number): boolean {
  return (i === 0 || i === dimension - 1) && (j === 0 || j === dimension - 1)
}
