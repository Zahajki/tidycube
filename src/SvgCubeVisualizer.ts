import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, Point, intersection } from './Geometry'
import { Face } from './GeometricCubeBase'
import { GeometricCube } from './GeometricCube'
import * as Color from 'color'
import { GeometricLastLayer } from './GeometricLastLayer'

export class Rectangle {
  constructor (public x: number, public y: number, public width: number, public height: number) {}

  toString (): string {
    return [this.x, this.y, this.width, this.height].join(' ')
  }
}

type Line = [[number, number], [number, number]]

export default class SvgCubeVisualizer {
  private cubeColor: Color
  private faceletColors: Color[][][]
  private arrows: any[]

  private cube: GeometricCube | GeometricLastLayer

  constructor (private dimension: number, private view: 'normal' | 'plan') {
    this.cube = view === 'normal' ?
      new GeometricCube(this.dimension) :
      new GeometricLastLayer(this.dimension)
  }

  visualize (
    rotations: Rotation[],
    distance: number,
    imageSize: number,
    backgroundColor: Color | undefined,
    cubeColor: Color,
    faceletColors: Color[][][],
    arrows: any[]
  ): HandySVGSVGElement {
    this.cubeColor = cubeColor
    this.faceletColors = faceletColors
    this.arrows = arrows

    distance *= this.dimension

    if (this.view === 'plan') {
      rotations = [['x', -90]]
    }
    this.cube.rotate(...rotations)

    const viewBox = new Rectangle(
      -0.9 * this.dimension,
      -0.9 * this.dimension,
      1.8 * this.dimension,
      1.8 * this.dimension)

    const svg = SvgBuilder.create(imageSize, imageSize, viewBox + '')
      .addClass('visualcube')

    // background
    if (backgroundColor) {
      SvgBuilder.element('rect')
        .addClass('background')
        .attributes({
          fill: backgroundColor.hex(),
          opacity: backgroundColor.alpha(),
          x: viewBox.x,
          y: viewBox.y,
          width: viewBox.width,
          height: viewBox.height
        })
        .appendTo(svg)
    }

    // backside facelets
    if (this.cubeColor.alpha() < 1) {
      for (let f = 0; f < 6; f++) {
        if (!this.cube[f].facingFront(distance)) {
          svg.append(this.composeFace(f, distance))
        }
      }
    }

    // cube body
    if (this.view === 'normal') {
      this.composeBody(distance).appendTo(svg)
    } else {
      this.composeLastLayer(distance).appendTo(svg)
    }

    // foreside facelets
    for (let f = 0; f < 6; f++) {
      if (this.cube[f].facingFront(distance)) {
        svg.append(this.composeFace(f, distance))
      }
    }

    // Draw Arrows
    if (this.arrows.length > 0) {
      const arrowWidth = 0.12 / this.dimension
      let g = SvgBuilder.element('g')
        .styles({
          opacity: 1,
          strokeOpacity: 1,
          strokeWidth: arrowWidth,
          strokeLinejoin: 'round'
        })
        .appendTo(svg)
      for (let i = 0; i < this.arrows.length; i++) {
        g.append(this.composeArrows(i))
      }
    }

    return svg
  }

  private composeFace (face: Face, distance: number): HandySVGElement {
    const polygons = []
    for (let j = 0; j < this.dimension; j++) {
      for (let i = 0; i < this.dimension; i ++) {
        let jay = j
        if (this.view !== 'normal' && face !== Face.U && face !== Face.D) {
          jay = 0
        }
        polygons.push(this.composeFacelet(face, i, jay, distance, this.faceletColors[face][i][jay]))
      }
    }
    return SvgBuilder.element('g').addClass('face').append(polygons)
  }

  private composeFacelet (face: Face, i: number, j: number, distance: number, color: Color): HandySVGElement {
    const points = this.cube[face][i][j].points
      .map(p => p.to2dString(distance)).join(' ')
    return SvgBuilder.element('polygon')
      .addClass('facelet')
      .attributes({
        fill: color.hex(),
        opacity: color.alpha(),
        points
      })
  }

  private composeBody (distance: number): HandySVGElement {
    const [corners, vertices] = (this.cube as GeometricCube).silhouette(distance)

    const data: string[] = []

    const move = vertices[vertices.length - 1].edgeEndpoints[corners[0]]
    data.push('M' + move.to2dString(distance))
    for (let i = 0; i < corners.length; i++) {
      const prev = (i - 1 + corners.length) % corners.length
      const next = (i + 1 + corners.length) % corners.length
      const curveStart = vertices[i].edgeEndpoints[corners[prev]]
      const curveEnd = vertices[i].edgeEndpoints[corners[next]]
      const control1 = Point.mid(curveStart, vertices[i].corner, 0.55228475)
      const control2 = Point.mid(curveEnd, vertices[i].corner, 0.55228475)
      data.push('L' + curveStart.to2dString(distance))
      data.push('C' +
        control1.to2dString(distance) + ' ' +
        control2.to2dString(distance) + ' ' +
        curveEnd.to2dString(distance))
    }
    data.push('z')

    return SvgBuilder.element('path')
      .addClass('body')
      .attributes({
        fill: this.cubeColor.hex(),
        opacity: this.cubeColor.alpha(),
        d: data.join(' ')
      })
  }

  private composeLastLayer (distance: number): HandySVGElement {
    const outlines = (this.cube as GeometricLastLayer).sideFaceOutlines
    const data: string[] = []

    for (let i = 0; i < 4; i++) {
      const prev = (i - 1 + 4) % 4
      const next = (i + 1 + 4) % 4

      const prevLeftLine: Line = [outlines[prev].leftTip[2].project(distance), outlines[prev].leftBase.project(distance)]
      const currRightLine: Line = [outlines[i].rightTip[0].project(distance), outlines[i].rightBase.project(distance)]
      const rightInter = intersection(prevLeftLine, currRightLine)
      data.push('L' + rightInter.map(p => p.toFixed(4)).join(','))

      const rightCurveStart = outlines[i].rightTip[0]
      data.push('L' + rightCurveStart.to2dString(distance))

      const rightCurveEnd = outlines[i].rightTip[2]
      const rightControl1 = Point.mid(rightCurveStart, outlines[i].rightTip[1], 0.2)
      const rightControl2 = Point.mid(rightCurveEnd, outlines[i].rightTip[1], 0.2)
      data.push('C' +
        rightControl1.to2dString(distance) + ' ' +
        rightControl2.to2dString(distance) + ' ' +
        rightCurveEnd.to2dString(distance))

      const leftCurveStart = outlines[i].leftTip[0]
      data.push('L' + leftCurveStart.to2dString(distance))

      const leftCurveEnd = outlines[i].leftTip[2]
      const leftControl1 = Point.mid(leftCurveStart, outlines[i].leftTip[1], 0.2)
      const leftControl2 = Point.mid(leftCurveEnd, outlines[i].leftTip[1], 0.2)
      data.push('C' +
        leftControl1.to2dString(distance) + ' ' +
        leftControl2.to2dString(distance) + ' ' +
        leftCurveEnd.to2dString(distance))

      const currLeftLine: Line = [outlines[i].leftTip[2].project(distance), outlines[i].leftBase.project(distance)]
      const nextRightLine: Line = [outlines[next].rightTip[0].project(distance), outlines[next].rightBase.project(distance)]
      const leftInter = intersection(currLeftLine, nextRightLine)
      data.push('L' + leftInter.map(p => p.toFixed(4)).join(','))
    }
    data.push('z')
    data[0] = data[0].replace('L', 'M')

    return SvgBuilder.element('path')
    .addClass('body')
    .attributes({
      fill: this.cubeColor.hex(),
      opacity: this.cubeColor.alpha(),
      d: data.join(' ')
    })
  }

  private composeArrows (face: number): HandySVGElement {
    return new HandySVGElement('path')
  }
}
