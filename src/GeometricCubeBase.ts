import { Rotation, Point } from './Geometry'

export namespace Util {
  export function forEachFace (callbackfn: (face: Face) => void): void {
    times(6, callbackfn)
  }

  export function times (n: number, callbackfn: (i: number) => void): void {
    for (let i = 0; i < n; i++) {
      callbackfn(i)
    }
  }

  export function squareTimes (n: number, callbackfn: (i: number, j: number) => void): void {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        callbackfn(i, j)
      }
    }
  }

  // https://math.stackexchange.com/a/274728
  export function onRightSide (line: [[number, number], [number, number]], point: [number, number]): boolean {
    const [[x1, y1], [x2, y2]] = line
    const [x, y] = point
    const d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
    return d < 0
  }
}

export const STICKER_MARGIN = 0.075
export const EXTRA_MARGIN = 0.02

export enum Corner {
  URF = 0, UFL, ULB, UBR, DFR, DLF, DBL, DRB
}
export enum Face {
  U = 0, R, F, D, L, B
}

export class GeometricFacelet {
  points: Point[] = []

  constructor (dimension: number, face: Face, i: number, j: number) {
    this.points[0] = new Point(STICKER_MARGIN, 0, STICKER_MARGIN)
    this.points[1] = new Point(STICKER_MARGIN, 0, 1 - STICKER_MARGIN)
    this.points[2] = new Point(1 - STICKER_MARGIN, 0, 1 - STICKER_MARGIN)
    this.points[3] = new Point(1 - STICKER_MARGIN, 0, STICKER_MARGIN)

    this.points.forEach(p => {
      p.translate(i, 0, dimension - 1 - j)
       .translate(-dimension / 2)
      GeometricFacelet.transformToFace(p, face)
    })
  }

  private static transformToFace (point: Point, face: Face): void {
    switch (face) {
      case Face.U:
        break
      case Face.R:
        point.rotate(['x', -90])
             .rotate(['y', -90])
        break
      case Face.F:
        point.rotate(['x', -90])
        break
      case Face.D:
        point.rotate(['x', 180])
        break
      case Face.L:
        point.rotate(['x', -90])
             .rotate(['y', 90])
        break
      case Face.B:
        point.rotate(['x', -90])
             .rotate(['y', 180])
        break
    }
  }
}

export class GeometricFace {
  [i: number]: GeometricFacelet[]

  constructor (private dimension: number, face: Face) {
    Util.times(dimension, i => { this[i] = [] })
    Util.squareTimes(dimension, (i, j) => {
      this[i][j] = new GeometricFacelet(dimension, face, i, j)
    })
  }

  forEach (callbackfn: (p: Point) => void) {
    Util.squareTimes(this.dimension, (i, j) => {
      this[i][j].points.forEach(p => callbackfn(p))
    })
  }

  facingFront (distance: number): boolean {
    const lineS = this[0][0].points[0].project(distance)
    const lineE = this[0][0].points[1].project(distance)
    const target = this[0][0].points[2].project(distance)
    return Util.onRightSide([lineS, lineE], target)
  }
}

export class GeometricCubeBase {
  [face: number]: GeometricFace

  constructor (public dimension: number) {
    // assign facelets points
    Util.forEachFace(face => {
      this[face] = new GeometricFace(dimension, face)
    })
  }

  rotate (rotation: Rotation) {
    this.forEach(point => point.rotate(rotation))
  }

  protected forEach (callbackfn: (p: Point) => void): void {
    Util.forEachFace(face => {
      Util.squareTimes(this.dimension, (i , j) => {
        this[face][i][j].points.forEach(callbackfn)
      })
    })
  }
}