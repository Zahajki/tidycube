import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, Point } from './Geometry'
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
    const [corners, vertices] = this.cube.silhouette(distance)

    const move = vertices[vertices.length - 1].edgeEndpoints[corners[0]]
    let d = `M${move.project(distance).join(',')} `
    for (let i = 0; i < corners.length; i++) {
      const prev = (i - 1 + corners.length) % corners.length
      const next = (i + 1 + corners.length) % corners.length
      const curveStart = vertices[i].edgeEndpoints[corners[prev]]
      const curveEnd = vertices[i].edgeEndpoints[corners[next]]
      const control1 = Point.mid(curveStart, vertices[i].corner, 0.55)
      const control2 = Point.mid(curveEnd, vertices[i].corner, 0.55)
      d += `L${curveStart.project(distance).join(',')} `
      d += `C${control1.project(distance).join(',')} ${control2.project(distance).join(',')} ${curveEnd.project(distance).join(',')} `
    }

    return SvgBuilder.element('path')
      .addClass('body')
      .attributes({
        fill: this.cubeColor.hex(),
        opacity: this.cubeColor.alpha(),
        d
      })
  }

  private composeLastlayer (face: Face): HandySVGElement {
    return new HandySVGElement('polygon')
  }

  private composeArrows (face: number): HandySVGElement {
    return new HandySVGElement('path')
  }
}
