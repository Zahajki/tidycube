import SvgCubeVisualBuilder from './SvgCubeVisualizer'
import { Axis, Rotation } from './Geometry'
import * as Color from 'color'
const prettifyXml: (input: string, options?: {indent: number, newline: string}) => string = require('prettify-xml')
import { writeFileSync } from 'fs'

export default class VisualCube {
}

const faceletColors = [
  [['white', 'yellow', 'white'], ['white', 'yellow', 'white'], ['white', 'yellow', 'white']],
  [['orange', 'orange', 'orange'], ['red', 'red', 'red'], ['orange', 'orange', 'orange']],
  [['blue', 'green', 'blue'], ['green', 'blue', 'green'], ['blue', 'green', 'blue']],
  [['yellow', 'white', 'yellow'], ['yellow', 'white', 'yellow'], ['yellow', 'white', 'yellow']],
  [['red', 'red', 'red'], ['orange', 'orange', 'orange'], ['red', 'red', 'red']],
  [['green', 'blue', 'green'], ['blue', 'green', 'blue'], ['green', 'blue', 'green']]
].map(face => face.map(row => row.map(name => Color(name).alpha(0.9))))

const rotations: Rotation[] = [
  { axis: Axis.Y, angle: 30 },
  { axis: Axis.X, angle: -25 }
]

const svg = new SvgCubeVisualBuilder(3)
  .visualize(rotations, 5, 512, Color('rgba(0, 255, 255, 0.2)'), Color('rgba(32, 32, 32, 0.9)'), faceletColors, [])
writeFileSync('test.svg', prettifyXml(svg.xml))
