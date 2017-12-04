import SvgCubeVisualBuilder from './SvgCubeVisualBuilder'
import * as Color from 'color'

export default class VisualCube {
}

const svg = (new SvgCubeVisualBuilder(3, {
  u: [[Color()]],
  r: [[Color()]],
  f: [[Color()]],
  d: [[Color()]],
  l: [[Color()]],
  b: [[Color()]]
})).visualize()
console.log(svg.xml)
