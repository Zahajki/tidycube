import SvgBuilder, { HandySVGSVGElement, HandySVGElement } from './SvgBuilder'
import { Rotation, midPoint, angleBetween, Point2 } from './Geometry'
import { Face, Facelet, RoundedVertex, STICKER_MARGIN } from './GeometricCubeBase'
import { GeometricCube } from './GeometricCube'
import * as Color from 'color'
import { GeometricLastLayer } from './GeometricLastLayer'

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
  Facelet[],
  'none' | 'start' | 'end' | 'both',
  Color,
  number /* startCutoff */, number /* endCutoff */
]

export default class SvgCubeVisualizer {
  private cubeColor: Color
  private faceletColors: Color[][][]
  private arrows: Arrow[]

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

    // arrow marker
    const defs = SvgBuilder.element('defs')
      .appendTo(svg)
    for (let i = 0; i < arrows.length; i++) {
      const arrowStart = SvgBuilder.element('marker').attributes({
        id: 'arrowStart' + i,
        refX: 2.3383 - 0.8,
        refY: 1.35,
        orient: 'auto'
      }).append(SvgBuilder.element('polygon')
        .attributes({
          fill: arrows[i][2].hex(),
          opacity: arrows[i][2].alpha(),
          points: '2.3383,0 0,1.35 2.3383,2.7'
        }))
      const arrowEnd = SvgBuilder.element('marker').attributes({
        id: 'arrowEnd' + i,
        refX: 0.8,
        refY: 1.35,
        orient: 'auto'
      }).append(SvgBuilder.element('polygon')
        .attributes({
          fill: arrows[i][2].hex(),
          opacity: arrows[i][2].alpha(),
          points: '0,0 2.3383,1.35 0,2.7'
        }))
      defs.append([arrowStart, arrowEnd])
    }

    const container = SvgBuilder.element('g')
      .addClass('cube')
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
          ...viewBox.toObject()
        })
        .appendTo(container)
    }

    // backside facelets
    for (let f = 0; f < 6; f++) {
      if (!this.cube.facingFront(f, distance)) {
        container.append(this.composeFace(f, distance))
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

    // arrows
    let g = SvgBuilder.element('g')
      .addClass('arrows')
      .appendTo(container)
    for (let i = 0; i < this.arrows.length; i++) {
      g.append(this.composeArrow(this.arrows[i], i, distance))
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
        polygons.push(this.composeFacelet([face, i, jay], distance, this.faceletColors[face][i][jay]))
      }
    }
    return SvgBuilder.element('g').addClass('face').append(polygons)
  }

  private composeFacelet (facelet: Facelet, distance: number, color: Color): HandySVGElement {
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

  private composeBody (distance: number): HandySVGElement {
    const vertices = this.cube.silhouette(distance)
    const data = composePoly(vertices, distance)
    data.push('z')

    return SvgBuilder.element('path')
      .addClass('body')
      .attributes({
        fill: this.cubeColor.hex(),
        opacity: this.cubeColor.alpha(),
        d: data.join(' ')
      })
  }

  private composeArrow (arrow: Arrow, i: number, distance: number): HandySVGElement {
    const vertices: RoundedVertex[] = []
    const [facelets, head, color, startCutoff, endCutoff] = arrow
    for (let i = 0; i < facelets.length; i++) {
      const cutOff =
        i === 0 ? startCutoff :
          i === facelets.length - 1 ? endCutoff : 0.5
      vertices.push({
        vertex: this.cube.getStickerCenter(facelets[i]),
        prevCutoff: cutOff, nextCutoff: cutOff
      })
      if (i < facelets.length - 1 && facelets[i][0] !== facelets[i + 1][0]) {
        vertices.push({
          vertex: this.cube.bentPoint(facelets[i], facelets[i + 1]),
          nextCutoff: STICKER_MARGIN, prevCutoff: STICKER_MARGIN
        })
      }
    }
    const data = composePoly(vertices, distance, 'polyline')

    const arrowElem = SvgBuilder.element('path')
      .addClass('arrow')
      .attributes({
        fill: 'none',
        stroke: color.hex(),
        'stroke-pacity': color.alpha(),
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

function composePoly (vertices: RoundedVertex[], distance: number, shape: 'polygon' | 'polyline' = 'polygon'): string[] {
  const data: string[] = []

  const first = vertices[0]
  if (shape === 'polygon') {
    const last = vertices[vertices.length - 1]
    data.push('M' + first.vertex.clone().move(last.vertex, first.prevCutoff).to2dString(distance))
  } else {
    const second = vertices[1]
    data.push('M' + first.vertex.clone().move(second.vertex, first.nextCutoff).to2dString(distance))
  }
  for (let i = 0; i < vertices.length; i++) {
    const curr = vertices[i]
    const prev = vertices[(i - 1 + vertices.length) % vertices.length]
    const next = vertices[(i + 1) % vertices.length]
    if (shape === 'polygon' || i < vertices.length - 1) {
      if (curr.prevCutoff !== 0 && curr.nextCutoff !== 0 && (shape === 'polygon' || i !== 0)) {
        const [a, b, c] = [
          curr.vertex.clone().move(prev.vertex, curr.prevCutoff),
          curr.vertex.clone(),
          curr.vertex.clone().move(next.vertex, curr.nextCutoff)
        ].map(p => p.project(distance))
        data.push('C' + composeCurveData(a, b, c))
      }
      if (!curr.vertex.equals(next.vertex)) {
        data.push('L' + next.vertex.clone().move(curr.vertex, next.prevCutoff).to2dString(distance))
      }
    }
  }
  return data
}

function toSvgString (p: Point2): string {
  return p.map(p => p.toFixed(4)).join(',')
}

function composeCurveData (a: Point2, b: Point2, c: Point2): string {
  // https://math.stackexchange.com/a/873589
  const ratio = (4 / 3) * Math.tan(angleBetween(a, b, c) / 4)
  const control1 = midPoint(a, b, ratio)
  const control2 = midPoint(c, b, ratio)
  return [
    toSvgString(control1),
    toSvgString(control2),
    toSvgString(c)].join(' ')
}
