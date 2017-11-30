import SvgCubeVisualBuilder from './SvgCubeVisualBuilder'

export default class VisualCube {
}


const svg = (new SvgCubeVisualBuilder()).build();
console.log(svg.xml);
