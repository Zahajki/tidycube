import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, Point } from './Geometry'
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
    this.cube.rotate.apply(this.cube, rotations)

    const viewBox = new Rectangle(
      -0.9 * this.dimension,
      -0.9 * this.dimension,
      1.8 * this.dimension,
      1.8 * this.dimension)

    const svg = SvgBuilder.create(imageSize, imageSize, viewBox + '')
      .addClass('visualcube')

    // Draw background
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

    // render backside facelets
    if (this.cubeColor.alpha() < 1) {
      // Create polygon for each backside facelet (transparency only)
      for (let f = 0; f < 6; f++) {
        if (!this.cube[f].facingFront(distance)) {
          svg.append(this.composeFace(f, distance))
        }
      }
    }

    // Create outline
    if (this.view === 'normal') {
      this.composeBody(distance).appendTo(svg)
    }

    // Create polygon for each visible facelet
    for (let f = 0; f < 6; f++) {
      if (this.cube[f].facingFront(distance)) {
        svg.append(this.composeFace(f, distance))
      }
    }

    // Create OLL view guides
    if (this.view === 'plan') {
      let g = SvgBuilder.element('g')
        .styles({
          // opacity: faceletOpacity / 100,
          strokeOpacity: 1,
          strokeWidth: 0.02,
          strokeLinejoin: 'round'
        })
        .appendTo(svg)
      for (let face of [Face.F, Face.L, Face.B, Face.R]) {
        g.append(this.composeLastlayer(face))
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
      const control1 = Point.mid(curveStart, vertices[i].corner, 0.55)
      const control2 = Point.mid(curveEnd, vertices[i].corner, 0.55)
      data.push('L' + curveStart.to2dString(distance))
      data.push('C' +
        control1.to2dString(distance) + ' ' +
        control2.to2dString(distance) + ' ' +
        curveEnd.to2dString(distance))
    }

    return SvgBuilder.element('path')
      .addClass('body')
      .attributes({
        fill: this.cubeColor.hex(),
        opacity: this.cubeColor.alpha(),
        d: data.join(' ')
      })
  }

  private composeLastlayer (face: Face): HandySVGElement {
    return new HandySVGElement('polygon')
  }

  private composeArrows (face: number): HandySVGElement {
    return new HandySVGElement('path')
  }
}
