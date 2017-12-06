import { Rotation, Point, Axis } from './Geometry'
import { port } from '_debugger'
import * as _ from 'lodash'
const convexHull: (points: number[][]) => number[] = require('monotone-convex-hull-2d')

namespace Util {
  export function forEachFace (callbackfn: (face: Face) => void): void {
    for (let face = Face.U; face <= Face.B; face++) {
      callbackfn(face)
    }
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
}

export enum Face {
  U = 0, R, F, D, L, B
}

export class GeometricFacelet {
  points: Point[]

  constructor (dimension: number, i: number, j: number) {
    const i_ = i + 1
    const j_ = j + 1

    this.points = []
    this.points[0] = new Point(i, 0, dimension - j_)
    this.points[1] = new Point(i_, 0, dimension - j_)
    this.points[2] = new Point(i_, 0, dimension - j)
    this.points[3] = new Point(i, 0, dimension - j)

    const center = Point.mid(this.points[0], this.points[2])
    this.points.forEach(p => { p.scale(0.85, center) })
  }
}

export class GeometricFace {
  points: Point[]

  facelets: GeometricFacelet[][]

  constructor (dimension: number, face: Face) {
    this.points = []
    this.points[0] = new Point(0, 0, dimension)
    this.points[1] = new Point(dimension, 0, dimension)
    this.points[2] = new Point(dimension, 0, 0)
    this.points[3] = new Point(0, 0, 0)
    this.points.forEach(p => GeometricFace.transformToFace(p, dimension, face))

    this.facelets = []
    Util.times(dimension, i => { this.facelets[i] = [] })
    Util.squareTimes(dimension, (i, j) => {
      this.facelets[i][j] = new GeometricFacelet(dimension, i, j)
      this.facelets[i][j].points.forEach(p => GeometricFace.transformToFace(p, dimension, face))
    })
  }

  private static transformToFace (point: Point, dimension: number, face: Face): void {
    switch (face) {
      case Face.U:
        break
      case Face.R:
        point
          .rotate({ axis: Axis.X, angle: -90 })
          .rotate({ axis: Axis.Y, angle: 90 })
          .translate(new Point(dimension, dimension, dimension))
        break
      case Face.F:
        point
          .rotate({ axis: Axis.X, angle: -90 })
          .translate(new Point(0, dimension, 0))
        break
      case Face.D:
        point
          .rotate({ axis: Axis.X, angle: 180 })
          .translate(new Point(0, dimension, dimension))
        break
      case Face.L:
        point
          .rotate({ axis: Axis.X, angle: -90 })
          .rotate({ axis: Axis.Y, angle: -90 })
          .translate(new Point(0, dimension, 0))
        break
      case Face.B:
        point
          .rotate({ axis: Axis.X, angle: -90 })
          .rotate({ axis: Axis.Y, angle: 180 })
          .translate(new Point(dimension, dimension, dimension))
        break
    }
  }

  center (): Point {
    return Point.mid(this.points[0], this.points[2])
  }
}

export class GeometricCube {
  faces: GeometricFace[]

  constructor (public dimension: number, rotations: Rotation[], distance: number) {
    this.faces = []
    Util.forEachFace(face => {
      this.faces[face] = new GeometricFace(dimension, face)
    })

    // Translation vector to centre the cube
    const t = new Point(-dimension / 2, -dimension / 2, -dimension / 2)
    this.forEach(point => {
      // Now scale and tranform point to ensure size/pos independent of dim
      point.translate(t).scale(1 / dimension)
    })
  }

  forEach (callbackfn: (p: Point) => void): void {
    Util.forEachFace(face => {
      this.faces[face].points.forEach(callbackfn)
      Util.squareTimes(this.dimension, (i , j) => {
        this.faces[face].facelets[i][j].points.forEach(callbackfn)
      })
    })
  }

  renderOrder (): Face[] {
    const arr = [Face.U, Face.R, Face.F, Face.D, Face.L, Face.B]
    arr.sort((a, b) => {
      return this.faces[b].center().z - this.faces[a].center().z
    })
    return arr
  }

  convexHull (): Point[] {
    const n = this.dimension
    const points = _.flatten(this.faces.map(geoFace => geoFace.points))
    const result: Point[] = []
    convexHull(points.map(p => p.to2dArray())).forEach((index) => {
      result.push(points[index])
    })
    return result
  }
}
