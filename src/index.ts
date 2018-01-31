import { Face, Facelet } from './GeometricCube'
import SvgCubeVisualizer, { RenderingArrow } from './SvgCubeVisualizer'
import { Rotation } from './Geometry'
import { TurnableCube } from './TurnableCube'
import { StageMask } from './StageMask'
import * as Color from 'color'
import fill = require('lodash/fill')
import flatten = require('lodash/flatten')
import assign = require('lodash/assign')
import range = require('lodash/range')

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/color/index.d.ts
export type ColorParam = Color | string | ArrayLike<number> | number | { [key: string]: any }

export type Stage =
'fl' | 'f2l' | 'f2l_1' | 'f2l_2' | 'f2l_sm' | 'f2l_3' |
'll' | 'cll' | 'ell' | 'oll' | 'ocll' | 'oell' | 'coll' | 'ocell' |
'wv' | 'vh' | 'els' | 'cls' | 'cmll' |
'cross' | 'f2b' | 'line' | '2x2x2' | '2x2x3' |
'none'

export type FaceletName = string

export interface Arrow {
  facelets: FaceletName[]
  marker?: 'none' | 'start' | 'end' | 'both'
  extendStart?: number
  extendEnd?: number
  color?: ColorParam | undefined
}

export interface ConstructorOptions {
  layerCount?: number,
  colorScheme?: { [name: string]: ColorParam }
}

export interface RenderOptions {
  imageSize?: number,
  distance?: number,
  view?: 'normal' | 'plan',
  rotations?: Rotation[],
  execution?: string,
  solution?: string,
  backgroundColor?: ColorParam | undefined,
  bodyColor?: ColorParam | undefined,
  arrows?: Arrow[],
  defaultArrowColor?: ColorParam | undefined
}

export default class TidyCube {
  private dimension: number
  private colorScheme: { [name: string]: ColorParam } = {
    'U': '#FEFE00',
    'R': '#EE0000',
    'F': '#0000F2',
    'D': '#FFFFFF',
    'L': '#FFA100',
    'B': '#00D800',
    '_': '#404040'
  }
  private faceletsColor: Color[]

  constructor ({
    layerCount= 3,
    colorScheme= {}
  }: ConstructorOptions = {}) {
    this.dimension = layerCount

    assign(this.colorScheme, colorScheme)

    const colors = 'URFDLB'.split('').map(face => {
      const color = Color(this.colorScheme[face])
      return fill(Array(this.dimension * this.dimension), color)
    })
    this.faceletsColor = flatten(colors)
  }

  setFaceletsByMask (stage: Stage, rotation: string = ''): this {
    const cube = new TurnableCube()
    cube.move(rotation)
    const color = Color(this.colorScheme['_'])
    range(6).forEach(face => {
      range(this.dimension).forEach(i => {
        range(this.dimension).forEach(j => {
          if (!StageMask[stage](face, i, j, this.dimension)) {
            const index = face * this.dimension * this.dimension +
              i +
              (this.dimension - j - 1) * this.dimension
            const rotatedIndex = cube.facelets().indexOf(index)
            this.setFaceletByColor(this.faceletIndexToName(rotatedIndex), color)
          }
        })
      })
    })
    return this
  }

  setFaceletsByDefinition (definition: string): this {
    definition.replace(/\s/g, '').split('').forEach((colorName, index) => {
      if (this.colorScheme[colorName]) {
        this.faceletsColor[index] = Color(this.colorScheme[colorName])
      }
    })
    return this
  }

  setFaceletByColor (faceletName: FaceletName, color: ColorParam): this {
    const faceletIndex = this.faceletNameToIndex(faceletName)
    this.faceletsColor[faceletIndex] = Color(color)
    return this
  }

  setSchema (schema: { [name: string]: ColorParam }, definition: string = ''): this {
    return this
  }

  renderSvgXml ({
    imageSize= 128,
    distance= 5,
    view= 'normal',
    rotations= [['y', 45], ['x', -34]],
    execution= '',
    solution= '',
    backgroundColor= 'transparent',
    bodyColor= '#000000',
    arrows= [] as Arrow[],
    defaultArrowColor= '#808080'
  }: RenderOptions = {}): string {
    const visualizer = new SvgCubeVisualizer(this.dimension)

    const geometricRotations = rotations.map(rot => [rot[0], -rot[1]] as Rotation)

    const cube = new TurnableCube()
    cube.move(solution, true).move(execution)
    const faceletsColor = this.dimension === 3 ?
      cube.facelets().map(facelet => this.faceletsColor[facelet]) :
      this.faceletsColor

    const renderingArrows: RenderingArrow[] = arrows.map((arrow) => {
      return {
        facelets: arrow.facelets.map(name => this.faceletNameToTriplet(name)),
        marker: arrow.marker === undefined ? 'end' : arrow.marker,
        extendStart: arrow.extendStart === undefined ? 0 : arrow.extendStart,
        extendEnd: arrow.extendEnd === undefined ? 0 : arrow.extendEnd,
        color: arrow.color === undefined ? Color(defaultArrowColor) : Color(arrow.color)
      }
    })

    const elem = visualizer.visualize(
      view,
      geometricRotations,
      distance,
      imageSize,
      Color(backgroundColor),
      Color(bodyColor),
      this.structFacelets(faceletsColor),
      renderingArrows
    )
    return elem.xml
  }

  private structFacelets<T> (flat: T[]): T[][][] {
    const result = [] as T[][][]
    for (let face = 0; face < 6; face++) {
      result[face] = []
      for (let i = 0; i < this.dimension; i++) {
        result[face][i] = []
        for (let j = 0; j < this.dimension; j++) {
          const index = face * this.dimension * this.dimension +
            i +
            (this.dimension - 1 - j) * this.dimension
          result[face][i][j] = flat[index]
        }
      }
    }
    return result
  }

  private faceletNameToIndex (faceletId: string): number {
    const match = faceletId.match(/^([URFDLB])([0-9]+)/)
    if (match !== null && 2 < match.length) {
      const [, face, numberInFace] = match
      return faceToNumber(face) * this.dimension * this.dimension + parseInt(numberInFace, 10)
    }
    return NaN

    function faceToNumber (face: string): number {
      return 'URFDLB'.split('').indexOf(face)
    }
  }

  private faceletIndexToName (serialNumber: number): FaceletName {
    const sq = this.dimension * this.dimension
    return Face[Math.floor(serialNumber / sq)] + (serialNumber % sq)
  }

  private faceletNameToTriplet (faceletName: FaceletName): Facelet {
    const match = faceletName.match(/^([URFDLB])([0-9]+)/)
    if (match === null || match.length < 3) throw new Error('Invalid facelet name ' + faceletName)
    const face = Face[match[1] as keyof typeof Face]
    const num = parseInt(match[2], 10)
    const i = num % this.dimension
    const j = this.dimension - Math.ceil((num + 1) / this.dimension)
    return [face, i, j]
  }
}
