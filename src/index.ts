import SvgCubeVisualBuilder from './SvgCubeVisualizer'
import { Axis } from './Geometry'
import * as Color from 'color'
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
].map(face => face.map(row => row.map(name => Color(name))))

const rotations = [{ axis: Axis.Y, angle: 30 }, { axis: Axis.X, angle: -25 }]

const svg = new SvgCubeVisualBuilder(3, rotations, 5)
  .visualize(512, undefined, Color('black'), faceletColors, [])
writeFileSync('test.svg', svg.xml)
