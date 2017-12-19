import { GeometricCubeBase, Face, RoundedVertex, rotationOntoFace, STICKER_MARGIN } from './GeometricCubeBase'
import { Point, Point2 } from './Geometry'

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
