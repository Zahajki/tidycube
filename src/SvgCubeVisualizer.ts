import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, Point, intersection, Line2, midPoint } from './Geometry'
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
      rotations = [['x', 90]]
    }
    this.cube.rotate(...rotations)

    const viewBox = new Rectangle(
      -0.9 * this.dimension,
      -0.9 * this.dimension,
      1.8 * this.dimension,
      1.8 * this.dimension)

    const svg = SvgBuilder.create(imageSize, imageSize, viewBox + '')
      .addClass('visualcube')
    const container = SvgBuilder.element('g')
      .attributes({
        transform: 'scale(1, -1)'
      })
      .appendTo(svg)

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
        .appendTo(container)
    }

    // backside facelets
    if (this.cubeColor.alpha() < 1) {
      for (let f = 0; f < 6; f++) {
        if (!this.cube.facingFront(f, distance)) {
          container.append(this.composeFace(f, distance))
        }
      }
    }

    // cube body
    this.composeBody(distance).appendTo(container)

    // foreside facelets
    for (let f = 0; f < 6; f++) {
      if (this.cube.facingFront(f, distance)) {
        container.append(this.composeFace(f, distance))
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
        .appendTo(container)
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
          jay = this.dimension - 1
        }
        polygons.push(this.composeFacelet(face, i, jay, distance, this.faceletColors[face][i][jay]))
      }
    }
    return SvgBuilder.element('g').addClass('face').append(polygons)
  }

  private composeFacelet (face: Face, i: number, j: number, distance: number, color: Color): HandySVGElement {
    const points = this.cube.getSticker(face, i, j)
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
    const lines = this.cube.silhouette(distance)
    const data: string[] = []

    data.push('M' + lines[0][0].to2dString(distance))
    for (let i = 0; i < lines.length; i++) {
      const curr = lines[i]
      const next = lines[(i + 1) % lines.length]
      for (let i = 1; i < curr.length; i++) {
        data.push('L' + curr[i].to2dString(distance))
      }
      data.push(composeCurve(
        [curr[curr.length - 2], curr[curr.length - 1]],
        [next[0], next[1]],
        distance,
        this.view === 'normal' ? 0.55228475 : 0.8
      ))
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

  private composeArrows (face: number): HandySVGElement {
    return new HandySVGElement('path')
  }
}

function composeCurve (line1: [Point, Point], line2: [Point, Point], distance: number, ratio: number): string {
  const line2d1 = line1.map(p => p.project(distance)) as Line2
  const line2d2 = line2.map(p => p.project(distance)) as Line2
  const intersect = intersection(line2d1, line2d2)
  const control1 = midPoint(line2d1[1], intersect, ratio)
  const control2 = midPoint(line2d2[0], intersect, ratio)
  return 'C' +
    control1.map(p => p.toFixed(4)).join(',') + ' ' +
    control2.map(p => p.toFixed(4)).join(',') + ' ' +
    line2[0].to2dString(distance)
}
