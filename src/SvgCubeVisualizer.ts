import SvgBuilder, { FluentSVGSVGElement, FluentSVGElement } from './SvgBuilder'
import { Rotation, Point, Axis } from './Geometry'
import { Face, GeometricCube } from './GeometricCube'
import * as Color from 'color'

export class Rectangle {
  constructor (public x: number, public y: number, public width: number, public height: number) {}

  toString (): string {
    return [this.x, this.y, this.width, this.height].join(' ')
  }
}

export type Options = {
  size?: number,
  backgroundColor?: Color,
  cubeColor?: Color,
  view?: 'normal' | 'plan',
  cubeRotations?: Rotation[],
  distance?: 5,
  arrows?: any
}

export default class SvgCubeVisualizer {
  private size: number
  private backgroundColor: Color | undefined
  private cubeColor: Color
  private view: 'normal' | 'plan'
  private cubeRotations: Rotation[]
  private distance: number
  private arrows: any[]

  private cube: GeometricCube

  constructor (
    private dimension: number,
    private faceletColors: Color[][][],
    {
      size= 128,
      backgroundColor= undefined,
      cubeColor= Color('black'),
      view= 'normal',
      cubeRotations= [{ axis: Axis.Y, angle: 30 }, { axis: Axis.X, angle: -25 }],
      distance= 5,
      arrows= []
    }: Options = {}
  ) {
    this.size = size
    this.backgroundColor = backgroundColor
    this.cubeColor = cubeColor
    this.view = view
    this.cubeRotations = cubeRotations
    this.distance = distance
    this.arrows = arrows

    this.cube = new GeometricCube(this.dimension, this.cubeRotations, this.distance)

    this.cube.forEach(point => {
      // Rotate cube as per perameter settings
      this.cubeRotations.forEach(rot => {
        point.rotate(rot)
      })
      // Finally project the 3D points onto 2D
      point.project(distance)
    })
  }

  visualize (): FluentSVGSVGElement {
    const viewBox = new Rectangle(-0.9, -0.9, 1.8, 1.8)
    const strokeWidth = 0

    const rotationVector: Point[] = [
      new Point(0, -1, 0),
      new Point(1, 0, 0),
      new Point(0, 0, -1),
      new Point(0, 1, 0),
      new Point(-1, 0, 0),
      new Point(0, 0, 1)
    ]
    const renderOrder = this.cube.renderOrder()

    const svg = SvgBuilder.create(this.size, this.size, viewBox + '')

    // Draw background
    if (this.backgroundColor) {
      svg.rect({
        fill: this.backgroundColor.hex(),
        x: viewBox.x,
        y: viewBox.y,
        width: viewBox.width,
        height: viewBox.height
      })
    }

    // Transparancy background rendering
    if (this.cubeColor.alpha() < 1) {
      // Create polygon for each background facelet (transparency only)
      let g = svg.g().styles({
        // opacity: faceletOpacity / 100,
        strokeOpacity: 0.5,
        strokeWidth,
        strokeLinejoin: 'round'
      })
      renderOrder.slice(0, 3).forEach(face => {
        g.append(this.composeFace(face))
      })
    }

    // Create outline
    let g = svg.g().styles({
      strokeWidth: 0.1,
      strokeLinejoin: 'round',
      opacity: this.cubeColor.alpha()
    })
    g.append(this.composeBody())

    // Create polygon for each visible facelet
    g = svg.g().styles({
      // opacity: faceletOpacity / 100,
      strokeOpacity: 1,
      strokeWidth: strokeWidth,
      strokeLinejoin: 'round'
    })
    for (let i = 3; i < 6; i++) {
      if (this.isFaceVisible(renderOrder[i], rotationVector) || this.cubeColor.alpha() < 1) {
        g.append(this.composeFace(renderOrder[i]))
      }
    }

    // Create OLL view guides
    if (this.view === 'plan') {
      let g = svg.g().styles({
        // opacity: faceletOpacity / 100,
        strokeOpacity: 1,
        strokeWidth: 0.02,
        strokeLinejoin: 'round'
      })
      for (let face of [Face.F, Face.L, Face.B, Face.R]) {
        g.append(this.composeLastlayer(face))
      }
    }

    // Draw Arrows
    if (this.arrows) {
      const arrowWidth = 0.12 / this.dimension
      let g = svg.g().styles({
        opacity: 1,
        strokeOpacity: 1,
        strokeWidth: arrowWidth,
        strokeLinejoin: 'round'
      })
      for (let i = 0; i < this.arrows.length; i++) {
        g.append(this.composeArrows(i))
      }
    }

    return svg
  }

  private composeFace (face: Face): FluentSVGElement[] {
    const result = []
    for (let j = 0; j < this.dimension; j++) {
      for (let i = 0; i < this.dimension; i ++) {
        result.push(this.composeFacelet(face, i, j, this.faceletColors[face][i][j]))
      }
    }
    return result
  }

  private composeFacelet (face: Face, i: number, j: number, color: Color): FluentSVGElement {
    // Scale points in towards centre
    const points = this.cube.faces[face].facelets[i][j].points
      .map(p => p.to2dString()).join(' ')
    return new FluentSVGElement('polygon')
      .attributes({
        fill: color.hex(),
        stroke: this.cubeColor.hex(),
        opacity: color.alpha(),
        points
      })
  }

  private composeBody (): FluentSVGElement {
    return new FluentSVGElement('polygon')
      .attributes({
        fill: this.cubeColor.hex(),
        stroke: this.cubeColor.hex(),
        points: this.cube.convexHull().map(p => p.to2dString()).join(' ')
      })
  }

  private composeLastlayer (face: Face): FluentSVGElement {
    return new FluentSVGElement('polygon')
  }

  private composeArrows (face: number): FluentSVGElement {
    return new FluentSVGElement('path')
  }

  private isFaceVisible (face: number, rotationVector: any): boolean {
    return true
  }
}
