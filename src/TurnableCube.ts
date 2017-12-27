//
// 3x3x3 cube
// based on ldez/cubejs
// https://github.com/ldez/cubejs/blob/master/src/cube.coffee
//
import range = require('lodash/range')
import fill = require('lodash/fill')
import normalize = require('cube-notation-normalizer')

const [U, R, F, D, L, B] = range(6)
const [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB] = range(8)
const [UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR] = range(12)
const centerFacelet = [4, 13, 22, 31, 40, 49]
const cornerFacelet = [
  [8, 9, 20], [6, 18, 38],
  [0, 36, 47], [2, 45, 11],
  [29, 26, 15], [27, 44, 24],
  [33, 53, 42], [35, 17, 51]
]
const edgeFacelet = [
  [5, 10], [7, 19], [3, 37], [1, 46],
  [32, 16], [28, 25], [30, 43], [34, 52],
  [23, 12], [21, 41], [50, 39], [48, 14]
]

export interface CubeState {
  ce: number[]
  cp: number[]
  co: number[]
  ep: number[]
  eo: number[]
}

const Moves: { [face: string]: CubeState } = {
  U: {
    ce: range(6),
    cp: [UBR, URF, UFL, ULB, DFR, DLF, DBL, DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UB, UR, UF, UL, DR, DF, DL, DB, FR, FL, BL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  R: {
    ce: range(6),
    cp: [DFR, UFL, ULB, URF, DRB, DLF, DBL, UBR],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [FR, UF, UL, UB, BR, DF, DL, DB, DR, FL, BL, UR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  F: {
    ce: range(6),
    cp: [UFL, DLF, ULB, UBR, URF, DFR, DBL, DRB],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [UR, FL, UL, UB, DR, FR, DL, DB, UF, DF, BL, BR],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0]
  },
  D: {
    ce: range(6),
    cp: [URF, UFL, ULB, UBR, DLF, DBL, DRB, DFR],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UR, UF, UL, UB, DF, DL, DB, DR, FR, FL, BL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  L: {
    ce: range(6),
    cp: [URF, ULB, DBL, UBR, DFR, UFL, DLF, DRB],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [UR, UF, BL, UB, DR, DF, FL, DB, FR, UL, DL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  B: {
    ce: range(6),
    cp: [URF, UFL, UBR, DRB, DFR, DLF, ULB, DBL],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [UR, UF, UL, BR, DR, DF, DL, BL, FR, FL, UB, DB],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]
  },
  E: {
    ce: [U, F, L, D, B, R],
    cp: range(8),
    co: fill(Array(8), 0),
    ep: [UR, UF, UL, UB, DR, DF, DL, DB, FL, BL, BR, FR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
  },
  M: {
    ce: [B, R, U, F, L, D],
    cp: range(8),
    co: fill(Array(8), 0),
    ep: [UR, UB, UL, DB, DR, UF, DL, DF, FR, FL, BL, BR],
    eo: [0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0]
  },
  S: {
    ce: [L, U, F, R, D, B],
    cp: range(8),
    co: fill(Array(8), 0),
    ep: [UL, UF, DL, UB, UR, DF, DR, DB, FR, FL, BL, BR],
    eo: [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0]
  }
}

export class TurnableCube implements CubeState {
  ce: number[]
  cp: number[]
  co: number[]
  ep: number[]
  eo: number[]

  constructor () {
    this.ce = range(6)
    this.cp = range(8)
    this.co = fill(Array(8), 0)
    this.ep = range(12)
    this.eo = fill(Array(12), 0)
  }

  facelets (): number[] {
    const result: number[] = []
    range(6).forEach(i => {
      result[9 * i + 4] = centerFacelet[this.ce[i]]
    })
    range(8).forEach(i => {
      const corner = this.cp[i]
      const ori = this.co[i]
      range(3).forEach(n => {
        result[cornerFacelet[i][(n + ori) % 3]] = cornerFacelet[corner][n]
      })
    })
    range(12).forEach(i => {
      const edge = this.ep[i]
      const ori = this.eo[i]
      range(2).forEach(n => {
        result[edgeFacelet[i][(n + ori) % 2]] = edgeFacelet[edge][n]
      })
    })
    return result
  }

  move (algorithm: string, invert: boolean = false): this {
    normalize(algorithm, {
      separator: '',
      useModifiers: false,
      uniformCenterMoves: 'slice',
      invert
    })
      .split('')
      .forEach(face => this.multiply(Moves[face]))
    return this
  }

  // Multiply this cube with another Cube
  private multiply (other: CubeState): this {
    this.centerMultiply(other)
    this.cornerMultiply(other)
    this.edgeMultiply(other)
    return this
  }

  // Multiply this Cube with another Cube, restricted to centers.
  private centerMultiply (other: CubeState): this {
    const newCenter: number[] = []
    range(6).forEach(to => {
      const from = other.ce[to]
      newCenter[to] = this.ce[from]
    })
    this.ce = newCenter
    return this
  }

  // Multiply this Cube with another Cube, restricted to corners.
  private cornerMultiply (other: CubeState): this {
    const newCP: number[] = []
    const newCO: number[] = []
    range(8).forEach(to => {
      const from = other.cp[to]
      newCP[to] = this.cp[from]
      newCO[to] = (this.co[from] + other.co[to]) % 3
    })
    this.cp = newCP
    this.co = newCO
    return this
  }

  // Multiply this Cube with another Cube, restricted to edges
  private edgeMultiply (other: CubeState): this {
    const newEP: number[] = []
    const newEdgeOri: number[] = []
    range(12).forEach(to => {
      const from = other.ep[to]
      newEP[to] = this.ep[from]
      newEdgeOri[to] = (this.eo[from] + other.eo[to]) % 2
    })
    this.ep = newEP
    this.eo = newEdgeOri
    return this
  }
}
