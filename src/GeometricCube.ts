import { Rotation, Point } from './Geometry'
const convexHull: (points: number[][]) => number[] = require('monotone-convex-hull-2d')

export enum Face {
  U = 0, R, F, D, L, B
}

export class GeometricCube {
  [face: number]: Point[][]

  constructor (public dimension: number, rotations: Rotation[], distance: number) {
    this[Face.U] = []
    this[Face.R] = []
    this[Face.F] = []
    this[Face.D] = []
    this[Face.L] = []
    this[Face.B] = []
    for (let i = 0; i <= dimension; i++) {
      this[Face.U][i] = []
      this[Face.R][i] = []
      this[Face.F][i] = []
      this[Face.D][i] = []
      this[Face.L][i] = []
      this[Face.B][i] = []
      for (let j = 0; j <= dimension; j++) {
        this[Face.U][i][j] = new Point(i, 0, dimension - j)
        this[Face.R][i][j] = new Point(dimension, j, i)
        this[Face.F][i][j] = new Point(i, j, 0)
        this[Face.D][i][j] = new Point(i, dimension, j)
        this[Face.L][i][j] = new Point(0, j, dimension - i)
        this[Face.B][i][j] = new Point(dimension - i, j, dimension)
      }
    }

    // Translation vector to centre the cube
    const t = new Point(-dimension / 2, -dimension / 2, -dimension / 2)
    // Translation vector to move the cube away from viewer
    const zPos = new Point(0, 0, distance)
    for (let face = 0; face < 6; face++) {
      for (let i = 0; i <= dimension; i++) {
        for (let j = 0; j <= dimension; j++) {
          // Now scale and tranform point to ensure size/pos independent of dim
          this[face][i][j].translate(t).scale(1 / dimension)
          // Rotate cube as per perameter settings
          rotations.forEach(rot => {
            this[face][i][j].rotate(rot)
          })
          // Move cube away from viewer
          this[face][i][j].translate(zPos)
          // Finally project the 3D points onto 2D
          this[face][i][j].project(zPos.z)
        }
      }
    }
  }

  renderOrder (): Face[] {
    const arr = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B]
    arr.sort((a, b) => {
      return this.centerOfFace(b).z - this.centerOfFace(a).z
    })
    return arr
  }

  centerOfFacelet (face: Face, i: number, j: number): Point {
    return Point.mid(this[face][i][j], this[face][i + 1][j + 1])
  }

  convexHull (): Point[] {
    const n = this.dimension
    const points = [
      this[Face.U][0][0], this[Face.U][0][n], this[Face.U][n][0], this[Face.U][n][n],
      this[Face.R][0][0], this[Face.R][0][n], this[Face.R][n][0], this[Face.R][n][n],
      this[Face.F][0][0], this[Face.F][0][n], this[Face.F][n][0], this[Face.F][n][n],
      this[Face.D][0][0], this[Face.D][0][n], this[Face.D][n][0], this[Face.D][n][n],
      this[Face.L][0][0], this[Face.L][0][n], this[Face.L][n][0], this[Face.L][n][n],
      this[Face.B][0][0], this[Face.B][0][n], this[Face.B][n][0], this[Face.B][n][n]
    ]
    const result: Point[] = []
    convexHull(points.map(p => p.to2dArray())).forEach((index) => {
      result.push(points[index])
    })
    return result
  }

  // Find centre point of facelet
  private centerOfFace (face: Face): Point {
    return Point.mid(this[face][0][0], this[face][this.dimension][this.dimension])
  }
}
