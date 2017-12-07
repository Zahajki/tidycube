import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, Point, Axis } from './Geometry'
import { Face, GeometricCube } from './GeometricCube'
import * as Color from 'color'

export class Rectangle {
  constructor (public x: number, public y: number, public width: number, public height: number) {}

  toString (): string {
    return [this.x, this.y, this.width, this.height].join(' ')
  }
}

export default class SvgCubeVisualizer {
  private cubeColor: Color
  private faceletColors: Color[][][]
  private view: 'normal' | 'plan' = 'normal'
  private arrows: any[]

  private cube: GeometricCube

  constructor (
    private dimension: number,
    rotations: Rotation[],
    distance: number
  ) {
    this.cube = new GeometricCube(this.dimension, rotations, distance)
  }

  visualize (
    imageSize: number,
    backgroundColor: Color | undefined,
    cubeColor: Color,
    faceletColors: Color[][][],
    arrows: any[]
  ): HandySVGSVGElement {
    this.cubeColor = cubeColor
    this.faceletColors = faceletColors
    this.arrows = arrows

    const viewBox = new Rectangle(-0.9, -0.9, 1.8, 1.8)

    const rotationVector: Point[] = [
      new Point(0, -1, 0),
      new Point(1, 0, 0),
      new Point(0, 0, -1),
      new Point(0, 1, 0),
      new Point(-1, 0, 0),
      new Point(0, 0, 1)
    ]
    const renderOrder = this.cube.renderOrder()

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

    // Transparancy background rendering
    if (this.cubeColor.alpha() < 1) {
      // Create polygon for each background facelet (transparency only)
      let g = SvgBuilder.element('g')
        .styles({
          // opacity: faceletOpacity / 100,
          strokeOpacity: 0.5,
          strokeLinejoin: 'round'
        })
        .appendTo(svg)
      renderOrder.slice(0, 3).forEach(face => {
        g.append(this.composeFace(face))
      })
    }

    // Create outline
    this.composeBody().appendTo(svg)

    // Create polygon for each visible facelet
    for (let i = 3; i < 6; i++) {
      if (this.isFaceVisible(renderOrder[i], rotationVector) || this.cubeColor.alpha() < 1) {
        svg.append(this.composeFace(renderOrder[i]))
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

  private composeFace (face: Face): HandySVGElement {
    const polygons = []
    for (let j = 0; j < this.dimension; j++) {
      for (let i = 0; i < this.dimension; i ++) {
        polygons.push(this.composeFacelet(face, i, j, this.faceletColors[face][i][j]))
      }
    }
    return SvgBuilder.element('g').addClass('face').append(polygons)
  }

  private composeFacelet (face: Face, i: number, j: number, color: Color): HandySVGElement {
    // Scale points in towards centre
    const points = this.cube[face][i][j].points
      .map(p => p.to2dString()).join(' ')
    return SvgBuilder.element('polygon')
      .addClass('facelet')
      .attributes({
        fill: color.hex(),
        opacity: color.alpha(),
        points
      })
  }

  private composeBody (): HandySVGElement {
    return new HandySVGElement('polygon')
      .addClass('body')
      .attributes({
        fill: this.cubeColor.hex(),
        opacity: this.cubeColor.alpha(),
        stroke: this.cubeColor.hex(),
        strokeOpacity: this.cubeColor.alpha(),
        strokeWidth: (1 - 0.85) / 3,
        strokeLinejoin: 'round',
        points: this.cube.silhouette().map(p => p.to2dString()).join(' ')
      })
  }

  private composeLastlayer (face: Face): HandySVGElement {
    return new HandySVGElement('polygon')
  }

  private composeArrows (face: number): HandySVGElement {
    return new HandySVGElement('path')
  }

  private isFaceVisible (face: number, rotationVector: any): boolean {
    return true
  }
}
