import { Face, FaceletName, parseFaceletName } from './GeometricCube'
import SvgCubeVisualizer, { Arrow } from './SvgCubeVisualizer'
import { Rotation } from './Geometry'
import { TurnableCube } from './TurnableCube'
const normalize: (s: string, o: object) => string = require('cube-notation-normalizer')
import * as Color from 'color'
import fill = require('lodash/fill')
import flatten = require('lodash/flatten')
import assign = require('lodash/assign')
import range = require('lodash/range')

const prettifyXml: (input: string, options?: {indent: number, newline: string}) => string = require('prettify-xml')
import { writeFileSync } from 'fs'

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/color/index.d.ts
export type ColorParam = Color | string | ArrayLike<number> | number | { [key: string]: any }

export type Stage =
'fl' | 'f2l' | 'f2l_3' | 'f2l_2' | 'f2l_sm' | 'f2l_1' |
'll' | 'cll' | 'ell' | 'oll' | 'ocll' | 'oell' | 'coll' | 'ocell' |
'wv' | 'vh' | 'els' | 'cls' | 'cmll' | 'cross' | 'f2b' | 'line' |
'2x2x2' | '2x2x3' |
'none'

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

const StageMask: { [s: string]: (f: FaceletName, d: number) => boolean } = {
  'fl': (faceletName: FaceletName, dimension: number): boolean => {
    const [face, i, j] = parseFaceletName(faceletName, dimension)
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
    const alg = normalize(rotation, {
      separator: '',
      useModifiers: false,
      uniformCenterMoves: 'slice'
    }).split('')
    cube.move(...alg)
    range(6 * this.dimension * this.dimension).forEach(num => {
      const [orgFace, orgSubNum] = this.serialNumberToName(num)
      const [rotFace, rotSubNum] = this.serialNumberToName(cube.facelets()[num])
      if (!StageMask[stage](rotFace + rotSubNum, this.dimension)) {
        const color = Color(this.colorScheme['_'])
        this.setFaceletByColor(orgFace + orgSubNum, color)
      }
    })
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
      faceletsColor,
      arrows
    )
    return elem.xml
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

  private serialNumberToName (serialNumber: number): [string, number] {
    const sq = this.dimension * this.dimension
    return [Face[Math.floor(serialNumber / sq)], serialNumber % sq]
  }
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
    extendEnd: 0.3,
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
  .setFaceletsByScheme('DUU _UU BBU')
  .setFaceletByColor('F6', 'skyblue')
  .setFaceletsByMask('fl', 'x')
  .renderXml({
    rotations,
    execution: 'R',
    // view: 'plan',
    arrows
  })
writeFileSync('test.svg', prettifyXml(svg))
