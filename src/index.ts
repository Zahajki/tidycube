import SvgCubeVisualBuilder from './SvgCubeVisualizer'
import * as Color from 'color'
import { writeFileSync } from 'fs'

export default class VisualCube {
}

const svg = (new SvgCubeVisualBuilder(3, [
  [[Color('yellow'), Color('yellow'), Color('yellow')], [Color('yellow'), Color('yellow'), Color('yellow')], [Color('yellow'), Color('yellow'), Color('yellow')]],
  [[Color('red'), Color('red'), Color('red')], [Color('red'), Color('red'), Color('red')], [Color('red'), Color('red'), Color('red')]],
  [[Color('blue'), Color('blue'), Color('blue')], [Color('blue'), Color('blue'), Color('blue')], [Color('blue'), Color('blue'), Color('blue')]],
  [[Color('white'), Color('white'), Color('white')], [Color('white'), Color('white'), Color('white')], [Color('white'), Color('white'), Color('white')]],
  [[Color('orange'), Color('orange'), Color('orange')], [Color('orange'), Color('orange'), Color('orange')], [Color('orange'), Color('orange'), Color('orange')]],
  [[Color('green'), Color('green'), Color('green')], [Color('green'), Color('green'), Color('green')], [Color('green'), Color('green'), Color('green')]]
])).visualize()
writeFileSync('test.svg', svg.xml)
