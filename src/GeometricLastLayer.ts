import { GeometricCubeBase, GeometricFace, GeometricFacelet, Face, Util } from './GeometricCubeBase'
import { Rotation } from './Geometry'

export class GeometricLastLayer extends GeometricCubeBase {
  constructor (dimension: number) {
    super(dimension)

    const half = this.dimension / 2
    const angle = 35

    this[Face.R].forEach(p => {
      p
        .translate(-half, half, 0)
        .rotate(['z', -angle])
        .translate(half, -half, 0)
    })
    this[Face.F].forEach(p => {
      p
        .translate(0, half, half)
        .rotate(['x', angle])
        .translate(0, -half, -half)
    })
    this[Face.L].forEach(p => {
      p
        .translate(half, half, 0)
        .rotate(['z', angle])
        .translate(-half, -half, 0)
    })
    this[Face.B].forEach(p => {
      p
        .translate(0, half, -half)
        .rotate(['x', -angle])
        .translate(0, -half, half)
    })
  }
}
