import { Rotation, Point, Axis } from './Geometry'
import intersection = require('lodash/intersection')
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

  // http://katsura-kotonoha.sakura.ne.jp/prog/c/tip0002f.shtml
  export function clockwise (st: [number, number], en: [number, number], ta: [number, number]): boolean {
    const n = ta[0] * (st[1] - en[1]) + st[0] * (en[1] - ta[1]) + en[0] * (ta[1] - st[1])
    return n > 0
  }}

const STICKER_MARGIN = 0.075
const EXTRA_MARGIN = 0.025

export enum Corner {
  URF = 0, UFL, ULB, UBR, DFR, DLF, DBL, DRB
}
enum Edge {
  UR = 0, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR
}
export enum Face {
  U = 0, R, F, D, L, B
}

export class GeometricFacelet {
  points: Point[] = []

  constructor (dimension: number, i: number, j: number) {
    const zero = STICKER_MARGIN
    const one = 1 - STICKER_MARGIN
    this.points[0] = new Point(zero, 0, zero)
    this.points[1] = new Point(zero, 0, one)
    this.points[2] = new Point(one, 0, one)
    this.points[3] = new Point(one, 0, zero)

    this.points.forEach(p => p
      .translate(i, 0, dimension - 1 - j)
      .translate(-dimension / 2)
    )
  }
}

export class GeometricFace {
  [i: number]: GeometricFacelet[]

  constructor (dimension: number, face: Face) {
    Util.times(dimension, i => { this[i] = [] })
    Util.squareTimes(dimension, (i, j) => {
      this[i][j] = new GeometricFacelet(dimension, i, j)
      this[i][j].points.forEach(p => GeometricFace.transformToFace(p, dimension, face))
    })
  }

  private static transformToFace (point: Point, dimension: number, face: Face): void {
    switch (face) {
      case Face.U:
        break
      case Face.R:
        point.rotate({ axis: Axis.X, angle: -90 })
             .rotate({ axis: Axis.Y, angle: 90 })
        break
      case Face.F:
        point.rotate({ axis: Axis.X, angle: -90 })
        break
      case Face.D:
        point.rotate({ axis: Axis.X, angle: 180 })
        break
      case Face.L:
        point.rotate({ axis: Axis.X, angle: -90 })
             .rotate({ axis: Axis.Y, angle: -90 })
        break
      case Face.B:
        point.rotate({ axis: Axis.X, angle: -90 })
             .rotate({ axis: Axis.Y, angle: 180 })
        break
    }
  }

  clockwise (distance: number): boolean {
    const st = this[0][0].points[0].project(distance)
    const en = this[0][0].points[1].project(distance)
    const ta = this[0][0].points[2].project(distance)
    return Util.clockwise(st, en, ta)
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
    return intersection(Corner[c1].split(''), Corner[c2].split('')).length === 2
  }

  setEdgeEndpoints (corner: Corner, vertices: Vertex[]): void {
    Util.times(8, c => {
      if (Vertex.adjacent(corner, c)) {
        this.edgeEndpoints[c] = Point.mid(
          this.corner,
          vertices[c].corner,
          EXTRA_MARGIN / (1 + 2 * EXTRA_MARGIN)
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
    this.vertices[Corner.UFL] = new Vertex(p.rotate({ axis: Axis.Y, angle: -90 }))
    this.vertices[Corner.ULB] = new Vertex(p.rotate({ axis: Axis.Y, angle: -90 }))
    this.vertices[Corner.UBR] = new Vertex(p.rotate({ axis: Axis.Y, angle: -90 }))
    p = urf.rotate({ axis: Axis.X, angle: -90 })
    this.vertices[Corner.DFR] = new Vertex(p)
    this.vertices[Corner.DLF] = new Vertex(p.rotate({ axis: Axis.Y, angle: -90 }))
    this.vertices[Corner.DBL] = new Vertex(p.rotate({ axis: Axis.Y, angle: -90 }))
    this.vertices[Corner.DRB] = new Vertex(p.rotate({ axis: Axis.Y, angle: -90 }))

    // set edge endpoints for each edge
    Util.times(8, c => {
      this.vertices[c].setEdgeEndpoints(c, this.vertices)
    })
  }

  rotate (rotation: Rotation) {
    this.forEach(point => point.rotate(rotation))
  }

  silhouette (distance: number): [number, number][] {
    const points = this.vertices.map(v => v.corner.project(distance))
    const hull = convexHull(points)
    return hull.map(index => points[index])
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
