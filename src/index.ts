import SvgCubeVisualizer, { Arrow } from './SvgCubeVisualizer'
import { Rotation } from './Geometry'
import { TurnableCube } from './TurnableCube'
import * as Color from 'color'
import fill = require('lodash/fill')
import flatten = require('lodash/flatten')
import assign = require('lodash/assign')
const prettifyXml: (input: string, options?: {indent: number, newline: string}) => string = require('prettify-xml')
import { writeFileSync } from 'fs'

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/color/index.d.ts
export type ColorParam = Color | string | ArrayLike<number> | number | { [key: string]: any }

export type Stage =
'fl' | 'f2l' | 'f2l_3' | 'f2l_2' | 'f2l_sm' | 'f2l_1' |
'll' | 'cll' | 'ell' | 'oll' | 'ocll' | 'oell' | 'coll' | 'ocell' |
'wv' | 'vh' | 'els' | 'cls' | 'cmll' | 'cross' | 'f2b' | 'line' |
'2x2x2' | '2x2x3'

export interface ConstructorOptions {
  layerCount?: number,
  colorScheme?: { [name: string]: ColorParam }
}

// stage: Stage,
// faceletColors: { 'U': Color[], 'R': Color[], 'F': Color[], 'D': Color[], 'L': Color[], 'B': Color[] },
// faceletDefinition: any

export interface RenderOptions {
  imageSize?: number,
  view?: 'normal' | 'plan',
  rotations?: Rotation[],
  execution?: string,
  solution?: string,
  backgroundColor?: Color | undefined,
  bodyColor?: Color,
  distance?: number,
  arrows?: Arrow[],
  defaultArrowColor?: Color
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
    this.dimension = 3

    assign(this.colorScheme, colorScheme)

    const colors = 'URFDLB'.split('').map(face => {
      const color = Color(this.colorScheme[face])
      return fill(Array(this.dimension * this.dimension), color)
    })
    this.faceletsColor = flatten(colors)
  }

  setFaceletsByMask (stage: Stage, rotation: string): this {
    return this
  }

  setFaceletsByScheme (scheme: string): this {
    scheme.replace(/\s/g, '').split('').forEach((colorName, index) => {
      this.faceletsColor[index] = Color(this.colorScheme[colorName])
    })
    return this
  }

  setFaceletByColor (faceletId: string, color: ColorParam): this {
    const faceletNumber = this.parseFaceletId(faceletId)
    this.faceletsColor[faceletNumber] = Color(color)
    return this
  }

  renderXml ({
    imageSize= 128,
    view= 'normal',
    rotations= [['y', 45], ['x', -34]],
    execution= '',
    solution= '',
    backgroundColor= undefined,
    bodyColor= '#000000',
    distance= 5,
    arrows= [],
    defaultArrowColor= '#808080'
  }: RenderOptions = {}): string {
    const visualizer = new SvgCubeVisualizer(this.dimension)

    const geometricRotations = rotations.map(rot => [rot[0], -rot[1]] as Rotation)

    const cube = new TurnableCube()
    cube.move(execution)
    const faceletsColor = cube.facelets().map(facelet => this.faceletsColor[facelet])

    const elem = visualizer.visualize(
      view,
      geometricRotations,
      distance,
      imageSize,
      backgroundColor ? Color(backgroundColor) : backgroundColor,
      Color(bodyColor),
      this.destructFacelets(faceletsColor),
      arrows
    )
    return elem.xml
  }

  private destructFacelets<T> (flat: T[]): T[][][] {
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

  private parseFaceletId (faceletId: string): number {
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
}

//
// temp test
//
const rots: Rotation[] = [
  ['y', 30],
  ['x', -25]
]

const arrows: Arrow[] = [
  [
      // facelets
    [[[1, 2, 1], [2, 1, 0]], 0, 0],
    'both',
    Color('gray')
  ],
  [
    [[[0, 0, 1], [0, 0, 0], [0, 2, 0], [0, 2, 1]], -0.2, 0.3],
    'end',
    Color('gray')
  ]
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
  .setFaceletsByScheme('DUU _UU BBB')
  .setFaceletByColor('F6', 'skyblue')
  .renderXml({
    rotations: rots,
    execution: 'R'
  })
writeFileSync('test.svg', prettifyXml(svg))
