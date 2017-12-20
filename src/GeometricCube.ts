import { Axis, axes, Rotation, Point, Point2, onRightSide } from './Geometry'
import difference = require('lodash/difference')
const convexHull: (points: [number, number][]) => number[] = require('monotone-convex-hull-2d')

export const STICKER_MARGIN = 0.075
export const EXTRA_MARGIN = 0.02

export enum Corner {
  URF = 0, UFL, ULB, UBR, DFR, DLF, DBL, DRB
}

export enum Face {
  U = 0, R, F, D, L, B
}

export type Facelet = [Face, number, number]

export type RoundedVertex = {
  vertex: Point,
  prevCutoff: number,
  nextCutoff: number
}

export const rotationOntoFace: { [f: number]: Rotation[] } = {
  0 /* U */: [['x', -90]],
  1 /* R */: [['y', 90]],
  2 /* F */: [],
  3 /* D */: [['x', 90]],
  4 /* L */: [['y', -90]],
  5 /* B */: [['y', 180]]
}

//
// base class
//
export abstract class GeometricCubeBase {
  protected rotations: Rotation[] = []

  constructor (public dimension: number) {}

  rotate (...rotations: Rotation[]) {
    this.rotations.push(...rotations)
  }

  getSticker (facelet: Facelet): Point[] {
    const [face, i , j] = facelet
    const sticker: [Point2, Point2, Point2, Point2] = [
      // align margined square on F face, bottom-left most facelet
      [STICKER_MARGIN + i, STICKER_MARGIN + j],
      [STICKER_MARGIN + i, 1 - STICKER_MARGIN + j],
      [1 - STICKER_MARGIN + i, 1 - STICKER_MARGIN + j],
      [1 - STICKER_MARGIN + i, STICKER_MARGIN + j]
    ]
    return sticker.map(p =>
      this.alignToFace(face, p)
        .rotate(...this.rotations))
  }

  getStickerCenter (facelet: Facelet): Point {
    return this.getUnrotatedStickerCenter(facelet)
      .rotate(...this.rotations)
  }

  facingFront (face: Face, distance: number): boolean {
    const sticker = this.getSticker([face, 0, 0])
    const lineS = sticker[0].project(distance)
    const lineE = sticker[1].project(distance)
    const point = sticker[2].project(distance)
    return onRightSide([lineS, lineE], point)
  }

  abstract silhouette (distance: number): RoundedVertex[]

  bentPoint (facelet1: Facelet, facelet2: Facelet): Point {
    const p1 = this.getUnrotatedStickerCenter(facelet1)
    const p2 = this.getUnrotatedStickerCenter(facelet2)
    const s = p1.axisOfMaxAbs()
    const t = p2.axisOfMaxAbs()
    const u = difference(axes, [s, t])[0]
    const a = Math.abs(p2[t] - p1[t])
    const b = Math.abs(p1[s] - p2[s])
    const p = new Point(0, 0, 0)
    p[s] = p1[s]
    p[t] = p2[t]
    p[u] = (b * p1[u] + a * p2[u]) / (a + b)
    return p.rotate(...this.rotations)
  }

  protected alignToFace (face: Face, point: Point2): Point {
    const half = this.dimension / 2
    return new Point(point[0], point[1], 0)
      .translate(-half, -half, half)
      .rotate(...rotationOntoFace[face])
  }

  private getUnrotatedStickerCenter (facelet: Facelet): Point {
    const [face, i , j] = facelet
    return this.alignToFace(face, [0.5 + i, 0.5 + j])
  }
}

//
// normal cube
//
const unitCorners = [
  /* URF */ new Point(1, 1, 1),
  /* UFL */ new Point(0, 1, 1),
  /* ULB */ new Point(0, 0, 1),
  /* UBR */ new Point(1, 0, 1),
  /* DFR */ new Point(1, 1, 0),
  /* DLF */ new Point(0, 1, 0),
  /* DBL */ new Point(0, 0, 0),
  /* DRB */ new Point(1, 0, 0)
].map(p => p.translate(-0.5))

export class GeometricCube extends GeometricCubeBase {
  silhouette (distance: number): RoundedVertex[] {
    const corners2 = unitCorners.map(p => p
      .clone()
      .rotate(...this.rotations)
      .project(distance / this.dimension))

    return convexHull(corners2).map(corner => {
      return {
        vertex: unitCorners[corner].clone()
          .scale(this.dimension + 2 * EXTRA_MARGIN)
          .rotate(...this.rotations),
        prevCutoff: STICKER_MARGIN + EXTRA_MARGIN,
        nextCutoff: STICKER_MARGIN + EXTRA_MARGIN
      }
    })
  }
}

//
// last layer cube
//
const TILT_ANGLE = 34

const BOTTOM_EXTRA_MARGIN = 0.06
const SIDE_EXTRA_MARGIN = 0

export class GeometricLastLayer extends GeometricCubeBase {
  silhouette (distance: number): RoundedVertex[] {
    const sideFaces = [Face.R, Face.F, Face.L, Face.B]
    const vertices: RoundedVertex[] = []
    sideFaces.forEach(face => {
      const rightBase = this.shift([this.dimension + SIDE_EXTRA_MARGIN, this.dimension], face)
      const rightTip = this.shift([this.dimension + SIDE_EXTRA_MARGIN, this.dimension - 1 - BOTTOM_EXTRA_MARGIN], face)
      const leftTip = this.shift([-SIDE_EXTRA_MARGIN, this.dimension - 1 - BOTTOM_EXTRA_MARGIN], face)
      const leftBase = this.shift([-SIDE_EXTRA_MARGIN, this.dimension], face)
      vertices.push(
        { vertex: rightBase, prevCutoff: 0, nextCutoff: 0 },
        { vertex: rightTip,
          prevCutoff: BOTTOM_EXTRA_MARGIN + STICKER_MARGIN,
          nextCutoff: SIDE_EXTRA_MARGIN + STICKER_MARGIN },
        { vertex: leftTip,
          prevCutoff: SIDE_EXTRA_MARGIN + STICKER_MARGIN,
          nextCutoff: BOTTOM_EXTRA_MARGIN + STICKER_MARGIN },
        { vertex: leftBase, prevCutoff: 0, nextCutoff: 0 }
      )
    })
    return vertices
  }

  protected alignToFace (face: Face, point: Point2): Point {
    if (face === Face.U || face === Face.D) {
      return super.alignToFace(face, point)
    } else {
      const half = this.dimension / 2
      return new Point(point[0], point[1], 0)
        .translate(-half, -this.dimension, 0)
        .rotate(['x', -TILT_ANGLE])
        .translate(0, half, half)
        .rotate(...rotationOntoFace[face])
    }
  }

  private shift (point: [number, number], face: Face): Point {
    return this.alignToFace(face, point).rotate(...this.rotations)
  }
}
