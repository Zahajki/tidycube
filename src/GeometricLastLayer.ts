import { GeometricCubeBase, Face } from './GeometricCubeBase'

export class GeometricLastLayer extends GeometricCubeBase {
  constructor (dimension: number) {
    super(dimension)

    const half = this.dimension / 2
    const angle = 34

    // tilt side face
    this[Face.R].forEach(point => {
      point
        .translate(-half, half, 0)
        .rotate(['z', -angle])
        .translate(half, -half, 0)
    })
    this[Face.F].forEach(point => {
      point
        .translate(0, half, half)
        .rotate(['x', angle])
        .translate(0, -half, -half)
    })
    this[Face.L].forEach(point => {
      point
        .translate(half, half, 0)
        .rotate(['z', angle])
        .translate(-half, -half, 0)
    })
    this[Face.B].forEach(point => {
      point
        .translate(0, half, -half)
        .rotate(['x', -angle])
        .translate(0, -half, half)
    })
  }
}
