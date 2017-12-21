import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, midPoint, angleBetween, Point2 } from './Geometry'
import { GeometricCube, GeometricLastLayer, Face, Facelet, GeometricArrow, RoundedVertex } from './GeometricCube'
import * as Color from 'color'

class Rectangle {
  constructor (public x: number, public y: number, public width: number, public height: number) {}

  toString (): string {
    return [this.x, this.y, this.width, this.height].join(' ')
  }

  toObject (): object {
    return { x: this.x, y: this.y, width: this.width, height: this.height }
  }
}

export type Arrow = [
  GeometricArrow,
  'none' | 'start' | 'end' | 'both',
  Color
]

export default class SvgCubeVisualizer {
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
    arrows: Arrow[]
  ): HandySVGSVGElement {
    distance *= this.dimension

    if (this.view === 'plan') {
      rotations = [['x', 90]]
    }
    this.cube.rotate(...rotations)

    const [xy, wh] = [-0.9, 1.8].map(n => n * this.dimension)
    const viewBox = new Rectangle(xy, xy, wh, wh)

    const svg = SvgBuilder.create(imageSize, imageSize, viewBox + '')
      .addClass('visualcube')

    // arrow marker
    SvgBuilder.element('defs')
      .appendTo(svg)
      .append(...this.createArrowMarker(arrows))

    const container = SvgBuilder.element('g')
      .addClass('cube')
      // invert Y coordinate
      .attributes({ transform: 'scale(1, -1)' })
      .appendTo(svg)

    // background
    if (backgroundColor) {
      SvgBuilder.element('rect')
        .addClass('background')
        .attributes({
          fill: backgroundColor.hex(),
          opacity: backgroundColor.alpha(),
          ...viewBox.toObject()
        })
        .appendTo(container)
    }

    // backside facelets
    for (let f = 0; f < 6; f++) {
      if (!this.cube.facingFront(f, distance) && this.view === 'normal') {
        container.append(this.createFace(f, distance, faceletColors))
      }
    }

    // cube body
    this.createBody(distance, cubeColor).appendTo(container)

    // foreside facelets
    for (let f = 0; f < 6; f++) {
      if (this.cube.facingFront(f, distance)) {
        container.append(this.createFace(f, distance, faceletColors))
      }
    }

    // arrows
    let g = SvgBuilder.element('g')
      .addClass('arrows')
      .appendTo(container)
    for (let i = 0; i < arrows.length; i++) {
      g.append(this.createArrow(arrows[i], i, distance))
    }

    return svg
  }

  private createFace (face: Face, distance: number, faceletColors: Color[][][]): HandySVGElement {
    const polygons = []
    let j =
      this.view === 'plan' && face !== Face.U && face !== Face.D ?
      this.dimension - 1 : 0
    for (; j < this.dimension; j++) {
      for (let i = 0; i < this.dimension; i ++) {
        polygons.push(this.createFacelet([face, i, j], distance, faceletColors[face][i][j]))
      }
    }
    return SvgBuilder.element('g').addClass('face').append(...polygons)
  }

  private createFacelet (facelet: Facelet, distance: number, color: Color): HandySVGElement {
    const points = this.cube.getSticker(facelet)
      .map(p => p.to2dString(distance)).join(' ')
    return SvgBuilder.element('polygon')
      .addClass('facelet')
      .attributes({
        fill: color.hex(),
        opacity: color.alpha(),
        points
      })
  }

  private createBody (distance: number, color: Color): HandySVGElement {
    const vertices = this.cube.silhouette(distance)
    const data = composePolygon(vertices, distance)
    data.push('z')

    return SvgBuilder.element('path')
      .addClass('body')
      .attributes({
        fill: color.hex(),
        opacity: color.alpha(),
        d: data.join(' ')
      })
  }

  private createArrowMarker (arrows: Arrow[]): HandySVGElement[] {
    const markers: HandySVGElement[] = []
    for (let i = 0; i < arrows.length; i++) {
      const [, head, color] = arrows[i]
      const arrowStart = SvgBuilder.element('marker').attributes({
        id: 'arrowStart' + i,
        refX: 2.3383 - 0.8,
        refY: 1.35,
        orient: 'auto'
      }).append(SvgBuilder.element('polygon')
        .attributes({
          fill: color.hex(),
          opacity: color.alpha(),
          points: '2.3383,0 0,1.35 2.3383,2.7'
        }))
      const arrowEnd = SvgBuilder.element('marker').attributes({
        id: 'arrowEnd' + i,
        refX: 0.8,
        refY: 1.35,
        orient: 'auto'
      }).append(SvgBuilder.element('polygon')
        .attributes({
          fill: color.hex(),
          opacity: color.alpha(),
          points: '0,0 2.3383,1.35 0,2.7'
        }))
      if (head === 'start' || head === 'both') {
        markers.push(arrowStart)
      }
      if (head === 'end' || head === 'both') {
        markers.push(arrowEnd)
      }
    }
    return markers
  }

  private createArrow (arrow: Arrow, i: number, distance: number): HandySVGElement {
    const [geometricArrow, head, color] = arrow
    const vertices = this.cube.arrow(geometricArrow)
    const data = composePolyline(vertices, distance)

    const arrowElem = SvgBuilder.element('path')
      .addClass('arrow')
      .attributes({
        fill: 'none',
        stroke: color.hex(),
        'stroke-opacity': color.alpha(),
        'stroke-width': 0.12,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: data.join(' ')
      })
    if (head === 'start') {
      arrowElem.attributes({ 'marker-start': `url(#arrowStart${i})` })
    } else if (head === 'end') {
      arrowElem.attributes({ 'marker-end': `url(#arrowEnd${i})` })
    } else if (head === 'both') {
      arrowElem.attributes({
        'marker-start': `url(#arrowStart${i})`,
        'marker-end': `url(#arrowEnd${i})`
      })
    }
    return arrowElem
  }
}

function composePolygon (vertices: RoundedVertex[], distance: number): string[] {
  const data: string[] = []

  const [last, first] = triplet(vertices, 0)
  data.push('M' + first.vertex.clone().move(last.vertex, first.prevCutoff).to2dString(distance))
  for (let i = 0; i < vertices.length; i++) {
    const [prev, curr, next] = triplet(vertices, i)
    if (curr.prevCutoff !== 0 && curr.nextCutoff !== 0) {
      data.push('C' + composeCurveData(prev, curr, next, distance))
    }
    if (!curr.vertex.equals(next.vertex)) {
      data.push('L' + next.vertex.clone().move(curr.vertex, next.prevCutoff).to2dString(distance))
    }
  }
  return data
}

function composePolyline (vertices: RoundedVertex[], distance: number): string[] {
  const data: string[] = []

  const [, first, second] = triplet(vertices, 0)
  data.push('M' + first.vertex.clone().move(second.vertex, first.nextCutoff).to2dString(distance))
  for (let i = 0; i < vertices.length - 1; i++) {
    const [prev, curr, next] = triplet(vertices, i)
    if (curr.prevCutoff !== 0 && curr.nextCutoff !== 0 && i !== 0) {
      data.push('C' + composeCurveData(prev, curr, next, distance))
    }
    if (!curr.vertex.equals(next.vertex)) {
      data.push('L' + next.vertex.clone().move(curr.vertex, next.prevCutoff).to2dString(distance))
    }
  }
  return data
}

function composeCurveData (prev: RoundedVertex, curr: RoundedVertex, next: RoundedVertex, distance: number): string {
  const [a, b, c] = [
    curr.vertex.clone().move(prev.vertex, curr.prevCutoff),
    curr.vertex.clone(),
    curr.vertex.clone().move(next.vertex, curr.nextCutoff)
  ].map(p => p.project(distance))

  // https://math.stackexchange.com/a/873589
  const ratio = (4 / 3) * Math.tan(angleBetween(a, b, c) / 4)
  const control1 = midPoint(a, b, ratio)
  const control2 = midPoint(c, b, ratio)
  return [
    toSvgString(control1),
    toSvgString(control2),
    toSvgString(c)
  ].join(' ')
}

function triplet<T> (array: T[], index: number): [T, T, T] {
  return [
    array[(index - 1 + array.length) % array.length],
    array[index],
    array[(index + 1) % array.length]
  ]
}

function toSvgString (p: Point2): string {
  return p.map(p => p.toFixed(4)).join(',')
}
