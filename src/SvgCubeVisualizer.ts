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

  constructor (private dimension: number) {
    this.cube = new GeometricCube(this.dimension)
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

    rotations.forEach(rot => this.cube.rotate(rot))

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
        if (!this.cube[f].clockwise(distance)) {
          svg.append(this.composeFace(f, distance))
        }
      }
    }

    // Create outline
    this.composeBody(distance).appendTo(svg)

    // Create polygon for each visible facelet
    for (let f = 0; f < 6; f++) {
      if (this.cube[f].clockwise(distance)) {
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
        polygons.push(this.composeFacelet(face, i, j, distance, this.faceletColors[face][i][j]))
      }
    }
    return SvgBuilder.element('g').addClass('face').append(polygons)
  }

  private composeFacelet (face: Face, i: number, j: number, distance: number, color: Color): HandySVGElement {
    // Scale points in towards centre
    const points = this.cube[face][i][j].points
      .map(p => p.project(distance).join(',')).join(' ')
    return SvgBuilder.element('polygon')
      .addClass('facelet')
      .attributes({
        fill: color.hex(),
        opacity: color.alpha(),
        points
      })
  }

  private composeBody (distance: number): HandySVGElement {
    return new HandySVGElement('polygon')
      .addClass('body')
      .attributes({
        fill: this.cubeColor.hex(),
        opacity: this.cubeColor.alpha(),
        points: this.cube.silhouette(distance).map(p => p.join(',')).join(' ')
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
