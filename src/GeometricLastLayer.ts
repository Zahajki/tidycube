import { GeometricCubeBase, Face, STICKER_MARGIN, EXTRA_MARGIN, Util } from './GeometricCubeBase'
import { Point } from './Geometry';

const TILT_ANGLE = 34

const MORE_EXTRA_MARGIN = 0.04

const tilter = {
  1 /* Face.R*/:
    (point: Point, center: number) => point
      .translate(-center, center, 0)
      .rotate(['z', -TILT_ANGLE])
      .translate(center, -center, 0),

  2 /* Face.F */:
    (point: Point, center: number) => point
      .translate(0, center, center)
      .rotate(['x', TILT_ANGLE])
      .translate(0, -center, -center),

  4 /* Face.L */:
    (point: Point, center: number) => point
      .translate(center, center, 0)
      .rotate(['z', TILT_ANGLE])
      .translate(-center, -center, 0),

  5 /* Face.B */:
    (point: Point, center: number) => point
      .translate(0, center, -center)
      .rotate(['x', -TILT_ANGLE])
      .translate(0, -center, center)
}

export class SideFaceOutline {
  rightBase: Point
  rightTip: [Point, Point, Point]
  leftTip: [Point, Point, Point]
  leftBase: Point

  constructor (dimension: number, face: Face.R | Face.F | Face.L | Face.B) {
    // align points for F face
    this.rightBase = new Point(dimension + EXTRA_MARGIN, STICKER_MARGIN, 0)
    this.rightTip = [
      new Point(dimension + EXTRA_MARGIN, 1 - STICKER_MARGIN, 0),
      new Point(dimension + EXTRA_MARGIN, 1 + EXTRA_MARGIN + MORE_EXTRA_MARGIN, 0),
      new Point(dimension - STICKER_MARGIN, 1 + EXTRA_MARGIN + MORE_EXTRA_MARGIN, 0)
    ]
    this.leftTip = [
      new Point(STICKER_MARGIN, 1 + EXTRA_MARGIN + MORE_EXTRA_MARGIN, 0),
      new Point(-EXTRA_MARGIN, 1 + EXTRA_MARGIN + MORE_EXTRA_MARGIN, 0),
      new Point(-EXTRA_MARGIN, 1 - STICKER_MARGIN, 0)
    ]
    this.leftBase = new Point(-EXTRA_MARGIN, STICKER_MARGIN, 0)

    this.forEach(p => p.translate(-dimension / 2))

    // rotate points for each face
    switch (face) {
      case Face.R:
        this.forEach(p => p.rotate(['y', -90]))
        break
      case Face.F:
        break
      case Face.L:
        this.forEach(p => p.rotate(['y', 90]))
        break
      case Face.B:
        this.forEach(p => p.rotate(['y', 180]))
        break
    }

    // tilt
    this.forEach(p => tilter[face](p, dimension / 2))
  }

  forEach (callbackfn: (p: Point) => void): void {
    callbackfn(this.rightBase)
    callbackfn(this.rightTip[0])
    callbackfn(this.rightTip[1])
    callbackfn(this.rightTip[2])
    callbackfn(this.leftTip[0])
    callbackfn(this.leftTip[1])
    callbackfn(this.leftTip[2])
    callbackfn(this.leftBase)
  }
}

export class GeometricLastLayer extends GeometricCubeBase {
  sideFaceOutlines: SideFaceOutline[] = []

  constructor (dimension: number) {
    super(dimension)

    const half = this.dimension / 2

    // tilt side face
    this[Face.R].forEach(point => tilter[Face.R](point, half))
    this[Face.F].forEach(point => tilter[Face.F](point, half))
    this[Face.L].forEach(point => tilter[Face.L](point, half))
    this[Face.B].forEach(point => tilter[Face.B](point, half))

    this.sideFaceOutlines[0] = new SideFaceOutline(dimension, Face.R)
    this.sideFaceOutlines[1] = new SideFaceOutline(dimension, Face.F)
    this.sideFaceOutlines[2] = new SideFaceOutline(dimension, Face.L)
    this.sideFaceOutlines[3] = new SideFaceOutline(dimension, Face.B)
  }

  protected forEach (callbackfn: (p: Point) => void): void {
    super.forEach(callbackfn)
    this.sideFaceOutlines[0].forEach(p => callbackfn(p))
    this.sideFaceOutlines[1].forEach(p => callbackfn(p))
    this.sideFaceOutlines[2].forEach(p => callbackfn(p))
    this.sideFaceOutlines[3].forEach(p => callbackfn(p))
  }
}
