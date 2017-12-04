import SvgBuilder, { FluentSVGSVGElement, FluentSVGElement } from './SvgBuilder'
import * as Color from 'color'
import { read } from 'fs';
import { relative } from 'path';

export enum Axis {
  X = 0, Y, Z
}

export class Rotation {
  constructor (public axis: Axis, private degree: number) {}

  get radian (): number {
    const deg = (this.degree % 360 + 360) % 360
    return Math.PI * deg / 180
  }
}

class Rectangle {
  constructor (public x: number, public y: number, public width: number, public height: number) {}

  toString (): string {
    return [this.x, this.y, this.width, this.height].join(' ')
  }
}

enum Face {
  U = 0, R, F, D, L, B
}

class Point {
  constructor (public x: number, public y: number, public z: number) {}

  clone (): Point {
    return new Point(this.x, this.y, this.z)
  }

  translate (delta: Point): Point {
    this.x += delta.x
    this.y += delta.y
    this.z += delta.z
    return this
  }

  scale (factor: number, center: Point | undefined = undefined): Point {
    if (!center) {
      this.x *= factor
      this.y *= factor
      this.z *= factor
    } else {
      const iv = center.clone().invert()
      this.translate(iv).scale(factor).translate(center)
    }
    return this
  }

  rotate (rotation: Rotation): Point {
    const tmp = this.clone()
    const r = rotation.radian
    switch (rotation.axis)
    {
      case Axis.X:
        tmp.z = this.z * Math.cos(r) - this.y * Math.sin(r)
        tmp.y = this.z * Math.sin(r) + this.y * Math.cos(r)
        break
      case Axis.Y:
        tmp.x = this.x * Math.cos(r) + this.z * Math.sin(r)
        tmp.z = -this.x * Math.sin(r) + this.z * Math.cos(r)
        break
      case Axis.Z:
        tmp.x = this.x * Math.cos(r) - this.y * Math.sin(r)
        tmp.y = this.x * Math.sin(r) + this.y * Math.cos(r)
        break
    }
    this.x = tmp.x
    this.y = tmp.y
    this.z = tmp.z
    return this
  }

  project (distance: number): Point {
    const tmp = this.clone()
    this.x = tmp.x * distance / tmp.z
    this.y = tmp.y * distance / tmp.z
    // Maintain z coordinate to allow use of rendering tricks
    return this
  }

  private invert (): Point {
    this.x *= -1
    this.y *= -1
    this.z *= -1
    return this
  }
}

export interface FaceContainer<T> {
  u: T
  r: T
  f: T
  d: T
  l: T
  b: T
}

export interface FaceletContainer<T> extends FaceContainer<T[][]> {}

class FaceletPoints implements FaceletContainer<Point> {
  u: Point[][]
  r: Point[][]
  f: Point[][]
  d: Point[][]
  l: Point[][]
  b: Point[][]
  constructor (public dimension: number) {
    const t = new Point(-dimension / 2, -dimension / 2, -dimension / 2)
    for (let i = 0; i <= dimension; i++) {
      for (let j = 0; j <= dimension; j++) {
        this.u[i][j] = new Point(i, 0, dimension - j).translate(t).scale(1 / dimension)
        this.r[i][j] = new Point(dimension, j, i).translate(t)
        this.f[i][j] = new Point(i, j, 0).translate(t)
        this.d[i][j] = new Point(i, dimension, j).translate(t)
        this.l[i][j] = new Point(0, j, dimension - i).translate(t)
        this.b[i][j] = new Point(dimension - i, j, dimension).translate(t)
      }
    }
  }
}

export type Options = {
  size?: number,
  backgroundColor?: Color,
  cubeColor?: Color,
  view?: 'normal' | 'plan',
  cubeRotations?: Rotation[]
  arrows?: any
}

export default class SvgCubeVisualizer {
  private size: number
  private backgroundColor: Color | undefined
  private cubeColor: Color
  private view: 'normal' | 'plan'
  private cubeRotations: Rotation[]
  private arrows: any[]

  constructor (
    private dimension: number,
    private faceletColors: FaceletContainer<Color>,
    {
      size= 128,
      backgroundColor= undefined,
      cubeColor= Color('black'),
      view= 'normal',
      cubeRotations= [],
      arrows= []
    }: Options = {}
  ) {
    this.size = size
    this.backgroundColor = backgroundColor
    this.cubeColor = cubeColor
    this.view = view
    this.cubeRotations = cubeRotations
    this.arrows = arrows
  }

  visualize (): FluentSVGSVGElement {
    const viewBox = new Rectangle(-0.9, -0.9, 1.8, 1.8)
    const strokeWidth = 0

    const rotationVector: any[] = []
    const renderOrder: any[] = []

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
      for (let i = 0; i < 3; i++) {
        g.append(this.shapeFacelets(renderOrder[i]))
      }

      // Create outline for each background face (transparency only)
      g = svg.g().styles({
        strokeWidth: 0.1,
        strokeLinejoin: 'round',
        opacity: this.cubeColor.alpha()
      })
      for (let i = 0; i < 3; i++) {
        g.append(this.shapeSilhouette(renderOrder[i]))
      }
    }

    // Create outline for each visible face
    let g = svg.g().styles({
      strokeWidth: 0.1,
      strokeLinejoin: 'round',
      opacity: this.cubeColor.alpha()
    })
    for (let i = 3; i < 6; i++) {
      if (this.isFaceVisible(renderOrder[i], rotationVector) || this.cubeColor.alpha() < 1) {
        g.append(this.shapeSilhouette(renderOrder[i]))
      }
    }

    // Create polygon for each visible facelet
    g = svg.g().styles({
      // opacity: faceletOpacity / 100,
      strokeOpacity: 1,
      strokeWidth: strokeWidth,
      strokeLinejoin: 'round'
    })
    for (let i = 3; i < 6; i++) {
      if (this.isFaceVisible(renderOrder[i], rotationVector) || this.cubeColor.alpha() < 1) {
        g.append(this.shapeFacelets(renderOrder[i]))
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
        g.append(this.shapeLastlayer(face))
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
        g.append(this.shapeArrows(i))
      }
    }

    return svg
  }

  private shapeFacelets (face: number): FluentSVGElement {
    return new FluentSVGElement('polygon')
  }

  private shapeSilhouette (face: number): FluentSVGElement {
    return new FluentSVGElement('polygon')
  }

  private shapeLastlayer (face: Face): FluentSVGElement {
    return new FluentSVGElement('polygon')
  }

  private shapeArrows (face: number): FluentSVGElement {
    return new FluentSVGElement('path')
  }

  private isFaceVisible (face: number, rotationVector: any): boolean {
    return true
  }
}
