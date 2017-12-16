import { GeometricCubeBase, Face, rotationOntoFace, STICKER_MARGIN } from './GeometricCubeBase'
import { Point, Polyline, Point2 } from './Geometry'

const TILT_ANGLE = 34

const BOTTOM_EXTRA_MARGIN = 0.06
const SIDE_EXTRA_MARGIN = 0

export class GeometricLastLayer extends GeometricCubeBase {
  silhouette (distance: number): Polyline[] {
    const faces = [Face.R, Face.F, Face.L, Face.B]
    const polylines: Polyline[] = []
    for (let i = 0; i < faces.length; i++) {
      const right = [
        [this.dimension + SIDE_EXTRA_MARGIN, this.dimension - BOTTOM_EXTRA_MARGIN],
        [this.dimension + SIDE_EXTRA_MARGIN, this.dimension - 1 + STICKER_MARGIN]
      ]
      const bottom = [
        [this.dimension - STICKER_MARGIN, this.dimension - 1 - BOTTOM_EXTRA_MARGIN],
        [STICKER_MARGIN, this.dimension - 1 - BOTTOM_EXTRA_MARGIN]
      ]
      const left = [
        [-SIDE_EXTRA_MARGIN, this.dimension - 1 + STICKER_MARGIN],
        [-SIDE_EXTRA_MARGIN, this.dimension - BOTTOM_EXTRA_MARGIN]
      ]
      const rightLine = shift(this, right, faces[i])
      const bottomLine = shift(this, bottom, faces[i])
      const leftLine = shift(this, left, faces[i])
      polylines.push(rightLine, bottomLine, leftLine)
    }
    return polylines

    function shift (self: GeometricLastLayer, points: number[][], face: Face): Polyline {
      return (points as Point2[]).map(p => self.faceShifter(face, p).rotate(...self.rotations))
    }
  }

  protected faceShifter (face: Face, point: Point2): Point {
    if (face === Face.U || face === Face.D) {
      return super.faceShifter(face, point)
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
