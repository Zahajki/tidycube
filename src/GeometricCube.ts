import { Axis, axes, Rotation, Point, Point2, onRightSide } from './Geometry'
import difference = require('lodash/difference')
const convexHull: (points: [number, number][]) => number[] = require('monotone-convex-hull-2d')

const STICKER_MARGIN = 0.075
const EXTRA_MARGIN = 0.02

export enum Corner {
  URF = 0, UFL, ULB, UBR, DFR, DLF, DBL, DRB
}

export enum Face {
  U = 0, R, F, D, L, B
}

export type FaceletName = string

export interface RoundedVertex {
  vertex: Point
  prevCutoff: number
  nextCutoff: number
}

export type GeometricArrow = {
  facelets: FaceletName[],
  extendStart: number,
  extendEnd: number
}

export const rotationOntoFace: { [f: number]: Rotation[] } = {
  0 /* U */: [['x', -90]],
  1 /* R */: [['y', 90]],
  2 /* F */: [],
  3 /* D */: [['x', 90]],
  4 /* L */: [['y', -90]],
  5 /* B */: [['y', 180]]
}

export function parseFaceletName (faceletName: FaceletName, dimension: number): [Face, number, number] {
  const match = faceletName.match(/^([URFDLB])([0-9]+)/)
  if (match === null || match.length < 3) throw new Error()
  const face = Face[match[1] as keyof typeof Face]
  const num = parseInt(match[2], 10)
  const i = num % dimension
  const j = dimension - Math.ceil((num + 1) / dimension)
  return [face, i, j]
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

  getSticker (faceletName: FaceletName): Point[] {
    const [face, i, j] = parseFaceletName(faceletName, this.dimension)
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

  facingFront (face: Face, distance: number): boolean {
    const sticker = this.getSticker(Face[face] + '0')
    const lineS = sticker[0].project(distance)
    const lineE = sticker[1].project(distance)
    const point = sticker[2].project(distance)
    return onRightSide([lineS, lineE], point)
  }

  abstract silhouette (distance: number): RoundedVertex[]

  arrow (arrow: GeometricArrow): RoundedVertex[] {
    const vertices: RoundedVertex[] = []
    const { facelets, extendStart, extendEnd } = arrow
    for (let i = 0; i < facelets.length; i++) {
      const cutOff =
        i === 0 ? -extendStart :
          i === facelets.length - 1 ? -extendEnd : 0.5 - STICKER_MARGIN
      vertices.push({
        vertex: this.getStickerCenter(facelets[i]),
        prevCutoff: cutOff, nextCutoff: cutOff
      })
      if (i < facelets.length - 1 && facelets[i][0] !== facelets[i + 1][0]) {
        vertices.push({
          vertex: this.bentPoint(facelets[i], facelets[i + 1]),
          nextCutoff: STICKER_MARGIN, prevCutoff: STICKER_MARGIN
        })
      }
    }
    return vertices
  }

  protected alignToFace (face: Face, point: Point2): Point {
    const half = this.dimension / 2
    return new Point(point[0], point[1], 0)
      .translate(-half, -half, half)
      .rotate(...rotationOntoFace[face])
  }

  private getStickerCenter (facelet: FaceletName): Point {
    return this.getUnrotatedStickerCenter(facelet)
      .rotate(...this.rotations)
  }

  private bentPoint (facelet1: FaceletName, facelet2: FaceletName): Point {
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

  private getUnrotatedStickerCenter (faceletName: FaceletName): Point {
    const [face, i , j] = parseFaceletName(faceletName, this.dimension)
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

    return convexHull(corners2).map(corner => ({
      vertex: unitCorners[corner].clone()
        .scale(this.dimension + 2 * EXTRA_MARGIN)
        .rotate(...this.rotations),
      prevCutoff: STICKER_MARGIN + EXTRA_MARGIN,
      nextCutoff: STICKER_MARGIN + EXTRA_MARGIN
    }))
  }
}

//
// last layer cube
//
const TILT_ANGLE = 34

const BOTTOM_EXTRA_MARGIN = 0.06
const SIDE_EXTRA_MARGIN = 0
const BASE_ROUND = 0.05

export class GeometricLastLayer extends GeometricCubeBase {
  silhouette (distance: number): RoundedVertex[] {
    const sideFaces = [Face.R, Face.F, Face.L, Face.B]
    const vertices: RoundedVertex[] = []
    sideFaces.forEach(face => {
      const [rightBase, rightTip, leftTip/*, leftBase*/] = [
        [this.dimension + SIDE_EXTRA_MARGIN, this.dimension],
        [this.dimension + SIDE_EXTRA_MARGIN, this.dimension - 1 - BOTTOM_EXTRA_MARGIN],
        [-SIDE_EXTRA_MARGIN, this.dimension - 1 - BOTTOM_EXTRA_MARGIN]
        // [-SIDE_EXTRA_MARGIN, this.dimension]
      ] .map(p => this.alignToFace(face, p as Point2).rotate(...this.rotations))
      vertices.push(
        { vertex: rightBase, prevCutoff: BASE_ROUND, nextCutoff: BASE_ROUND },
        { vertex: rightTip,
          prevCutoff: BOTTOM_EXTRA_MARGIN + STICKER_MARGIN,
          nextCutoff: SIDE_EXTRA_MARGIN + STICKER_MARGIN },
        { vertex: leftTip,
          prevCutoff: SIDE_EXTRA_MARGIN + STICKER_MARGIN,
          nextCutoff: BOTTOM_EXTRA_MARGIN + STICKER_MARGIN }
        // { vertex: leftBase, prevCutoff: 0, nextCutoff: 0 }
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
}
