import { Face, Facelet } from './GeometricCube'
import SvgCubeVisualizer, { RenderingArrow } from './SvgCubeVisualizer'
import { Rotation } from './Geometry'
import { TurnableCube } from './TurnableCube'
import * as Color from 'color'
import fill = require('lodash/fill')
import flatten = require('lodash/flatten')
import assign = require('lodash/assign')
import range = require('lodash/range')

import { writeFileSync } from 'fs'

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/color/index.d.ts
export type ColorParam = Color | string | ArrayLike<number> | number | { [key: string]: any }

export type Stage =
'fl' | 'f2l' | 'f2l_3' | 'f2l_2' | 'f2l_sm' | 'f2l_1' |
'll' | 'cll' | 'ell' | 'oll' | 'ocll' | 'oell' | 'coll' | 'ocell' |
'wv' | 'vh' | 'els' | 'cls' | 'cmll' | 'cross' | 'f2b' | 'line' |
'2x2x2' | '2x2x3' |
'none'

export type FaceletName = string

export interface Arrow {
  facelets: FaceletName[]
  marker?: 'none' | 'start' | 'end' | 'both'
  extendStart?: number
  extendEnd?: number
  color?: ColorParam
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
  backgroundColor?: Color | undefined,
  bodyColor?: Color,
  arrows?: Arrow[],
  defaultArrowColor?: Color
}

const StageMask: { [s: string]: (f: FaceletName, d: number) => boolean } = {
  'fl': (faceletName: FaceletName, dimension: number): boolean => {
    const [face, , j] = faceletNameToTriplet(faceletName, dimension)
    return face !== Face.U && (face === Face.D || j === 0)
  }
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
    range(6 * this.dimension * this.dimension).forEach(num => {
      const originalName = this.faceletIndexToName(num)
      const rotatedName = this.faceletIndexToName(cube.facelets()[num])
      if (!StageMask[stage](rotatedName, this.dimension)) {
        const color = Color(this.colorScheme['_'])
        this.setFaceletByColor(originalName, color)
      }
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

  renderSvgXml ({
    imageSize= 128,
    distance= 5,
    view= 'normal',
    rotations= [['y', 45], ['x', -34]],
    execution= '',
    solution= '',
    backgroundColor= undefined,
    bodyColor= '#000000',
    arrows= [] as Arrow[],
    defaultArrowColor= '#808080'
  }: RenderOptions = {}): string {
    const visualizer = new SvgCubeVisualizer(this.dimension)

    const geometricRotations = rotations.map(rot => [rot[0], -rot[1]] as Rotation)

    const cube = new TurnableCube()
    cube.move(solution, true).move(execution)
    const faceletsColor = cube.facelets().map(facelet => this.faceletsColor[facelet])

    const renderingArrows: RenderingArrow[] = arrows.map(arrow => {
      return {
        facelets: arrow.facelets.map(name => faceletNameToTriplet(name, this.dimension)),
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
      backgroundColor ? Color(backgroundColor) : backgroundColor,
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
      for (let i = 0; i < 6; i++) {
        result[face][i] = []
        for (let j = 0; j < 6; j++) {
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
}

function faceletNameToTriplet (faceletName: FaceletName, dimension: number): Facelet {
  const match = faceletName.match(/^([URFDLB])([0-9]+)/)
  if (match === null || match.length < 3) throw new Error('Invalid facelet name ' + faceletName)
  const face = Face[match[1] as keyof typeof Face]
  const num = parseInt(match[2], 10)
  const i = num % dimension
  const j = dimension - Math.ceil((num + 1) / dimension)
  return [face, i, j]
}

//
// temp test
//
const rotations: Rotation[] = [
  ['y', 30],
  ['x', 25]
]

const arrows: Arrow[] = [
  {
    facelets: ['R5', 'F7'],
    extendStart: 0,
    extendEnd: 0,
    marker: 'both',
    color: Color('gray')
  },
  {
    facelets: ['U3', 'U6', 'U8', 'U5'],
    extendStart: -0.2,
    // extendEnd: 0.3,
    marker: 'end',
    color: Color('gray')
  }
]

const svg = new TidyCube({
    colorScheme: {
      U: '#F8FF00',
      R: '#FF264A',
      F: '#0066FF',
      D: '#FFFFFF',
      L: '#F2A200',
      B: '#00CC44'
    }
  })
  .setFaceletsByDefinition('DUU _UU BBU')
  .setFaceletByColor('F6', 'skyblue')
  .setFaceletsByMask('fl', 'x')
  .renderSvgXml({
    imageSize: 512,
    rotations,
    execution: 'R',
    // view: 'plan',
    arrows
  })
writeFileSync('test.svg', svg)
