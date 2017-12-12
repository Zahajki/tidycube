import { Rotation, Point, Axis } from './Geometry'
const convexHull: (points: [number, number][]) => number[] = require('monotone-convex-hull-2d')

namespace Util {
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
  }}

const STICKER_MARGIN = 0.075
const EXTRA_MARGIN = 0.02

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
             .rotate(['y', 90])
        break
      case Face.F:
        point.rotate(['x', -90])
        break
      case Face.D:
        point.rotate(['x', 180])
        break
      case Face.L:
        point.rotate(['x', -90])
             .rotate(['y', -90])
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

  constructor (dimension: number, face: Face) {
    Util.times(dimension, i => { this[i] = [] })
    Util.squareTimes(dimension, (i, j) => {
      this[i][j] = new GeometricFacelet(dimension, face, i, j)
    })
  }

  facingFront (distance: number): boolean {
    const lineS = this[0][0].points[0].project(distance)
    const lineE = this[0][0].points[1].project(distance)
    const target = this[0][0].points[2].project(distance)
    return Util.onRightSide([lineS, lineE], target)
  }
}

export class Vertex {
  corner: Point
  edgeEndpoints: Point[] = []

  constructor (corner: Point) {
    // URF corner vertex
    this.corner = corner.clone()
  }

  private static adjacent (c1: Corner, c2: Corner) {
    const match = Corner[c1].match(new RegExp(`[${Corner[c2]}]`, 'g'))
    return match && match.length === 2
  }

  setEdgeEndpoints (corner: Corner, vertices: Vertex[]): void {
    Util.times(8, c => {
      if (Vertex.adjacent(corner, c)) {
        this.edgeEndpoints[c] = Point.mid(
          this.corner,
          vertices[c].corner,
          (1 + (2 * STICKER_MARGIN)) / (1 + 2 * (EXTRA_MARGIN + STICKER_MARGIN))
        )
      }
    })
  }

  forEach (callbackfn: (p: Point) => void): void {
    callbackfn(this.corner)
    Util.times(8, c => {
      if (this.edgeEndpoints[c]) {
        callbackfn(this.edgeEndpoints[c])
      }
    })
  }
}

export class GeometricCube {
  [face: number]: GeometricFace

  vertices: Vertex[] = []

  constructor (public dimension: number) {
    //
    // construct facelets points
    //
    Util.forEachFace(face => {
      this[face] = new GeometricFace(dimension, face)
    })

    //
    // assign corners and edges points for more accurate rendering
    //

    // URF corner vertex
    const urf = new Point(dimension + EXTRA_MARGIN, -EXTRA_MARGIN, -EXTRA_MARGIN)
      .translate(-dimension / 2)
    let p = urf.clone()
    this.vertices[Corner.URF] = new Vertex(p)
    this.vertices[Corner.UFL] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.ULB] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.UBR] = new Vertex(p.rotate(['y', -90]))
    p = urf.rotate(['x', -90])
    this.vertices[Corner.DFR] = new Vertex(p)
    this.vertices[Corner.DLF] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.DBL] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.DRB] = new Vertex(p.rotate(['y', -90]))

    // set edge endpoints for each edge
    Util.times(8, c => {
      this.vertices[c].setEdgeEndpoints(c, this.vertices)
    })
  }

  rotate (rotation: Rotation) {
    this.forEach(point => point.rotate(rotation))
  }

  silhouette (distance: number): [number[], Vertex[]] {
    const points = this.vertices.map(v => v.corner.project(distance))
    const hull = convexHull(points)
    return [hull, hull.map(index => this.vertices[index])]
  }

  private forEach (callbackfn: (p: Point) => void): void {
    Util.forEachFace(face => {
      Util.squareTimes(this.dimension, (i , j) => {
        this[face][i][j].points.forEach(callbackfn)
      })
    })
    this.vertices.forEach(v => v.forEach(callbackfn))
  }
}
