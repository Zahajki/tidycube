import SvgCubeVisualBuilder from './SvgCubeVisualizer'
import { Rotation } from './Geometry'
import * as Color from 'color'
const prettifyXml: (input: string, options?: {indent: number, newline: string}) => string = require('prettify-xml')
import { writeFileSync } from 'fs'

export default class VisualCube {
}

const faceletColors = [
  [['yellow', 'yellow', 'white'], ['white', 'yellow', 'white'], ['white', 'yellow', 'white']],
  [['red', 'orange', 'orange'], ['red', 'red', 'red'], ['orange', 'orange', 'orange']],
  [['blue', 'blue', 'blue'], ['green', 'blue', 'green'], ['blue', 'green', 'blue']],
  [['white', 'white', 'yellow'], ['yellow', 'white', 'yellow'], ['yellow', 'white', 'yellow']],
  [['orange', 'red', 'red'], ['orange', 'orange', 'orange'], ['red', 'red', 'red']],
  [['green', 'green', 'green'], ['blue', 'green', 'blue'], ['green', 'blue', 'green']]
].map(face => face.map(row => row.map(name => Color(name).alpha(0.9))))

const rotations: Rotation[] = [
  // ['y', 30],
  // ['x', -25]
  ['x', -90]
]

const svg = new SvgCubeVisualBuilder(3, 'plan')
  .visualize(rotations, 5, 512, Color('rgba(0, 255, 255, 0.2)'), Color('rgba(32, 32, 32, 0.9)'), faceletColors, [])
writeFileSync('test.svg', prettifyXml(svg.xml))
