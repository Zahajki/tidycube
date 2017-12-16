import { Rotation, Point, Polyline, Point2, onRightSide } from './Geometry'

export const STICKER_MARGIN = 0.075
export const EXTRA_MARGIN = 0.02

export enum Corner {
  URF = 0, UFL, ULB, UBR, DFR, DLF, DBL, DRB
}
export enum Face {
  U = 0, R, F, D, L, B
}

export const rotationOntoFace: { [f: number]: Rotation[] } = {
  0 /* U */: [['x', -90]],
  1 /* R */: [['y', 90]],
  2 /* F */: [],
  3 /* D */: [['x', 90]],
  4 /* L */: [['y', -90]],
  5 /* B */: [['y', 180]]
}

export class GeometricCubeBase {
  protected rotations: Rotation[] = []

  constructor (public dimension: number) {}

  rotate (...rotations: Rotation[]) {
    this.rotations.push(...rotations)
  }

  getSticker (face: Face, i: number, j: number): Point[] {
    const sticker: [Point2, Point2, Point2, Point2] = [
      // align margined square on F face, bottom-left most facelet
      [STICKER_MARGIN + i, STICKER_MARGIN + j],
      [STICKER_MARGIN + i, 1 - STICKER_MARGIN + j],
      [1 - STICKER_MARGIN + i, 1 - STICKER_MARGIN + j],
      [1 - STICKER_MARGIN + i, STICKER_MARGIN + j]
    ]
    return sticker.map(p =>
      this.faceShifter(face, p)
        .rotate(...this.rotations))
  }

  facingFront (face: Face, distance: number): boolean {
    const sticker = this.getSticker(face, 0, 0)
    const lineS = sticker[0].project(distance)
    const lineE = sticker[1].project(distance)
    const point = sticker[2].project(distance)
    return onRightSide([lineS, lineE], point)
  }

  silhouette (distance: number): Polyline[] {
    return []
  }

  protected faceShifter (face: Face, point: Point2): Point {
    const half = this.dimension / 2
    return new Point(point[0], point[1], 0)
      .translate(-half, -half, half)
      .rotate(...rotationOntoFace[face])
  }
}
