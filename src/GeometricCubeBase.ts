import { Axis, axes, Rotation, Point, Point2, onRightSide } from './Geometry'
import difference = require('lodash/difference')

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
