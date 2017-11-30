import SvgBuilder, { FluentSVGSVGElement, FluentSVGElement } from './SvgBuilder';
import * as Color from 'color';


export default class SvgCubeVisualBuilder {
  build (): FluentSVGSVGElement {
    const [U, R, F, D, L, B] = [0, 1, 2, 3, 4, 5];

    const dimension = 3;
    const size = 128;
    const background = new Color('white');
    const cubeOpacity = 99;
    const faceletOpacity = 99;
    const view = 'plan';
    const arrows: number[] = [];

    const viewBox = new Rectangle(-0.9, -0.9, 1.8, 1.8);
    const strokeWidth = 0;

    const rotationVector: any[] = [];
    const renderOrder: any[] = [];

    const svg = SvgBuilder.create(size, size, viewBox + '');

    // Draw background
    if (background) {
      svg.rect({
        fill: background.hex(),
        x: viewBox.x,
        y: viewBox.y,
        width: viewBox.width,
        height: viewBox.height,
      });
    }

    // Transparancy background rendering
    if (cubeOpacity < 100) {
      // Create polygon for each background facelet (transparency only)
      let g = svg.g().styles({
        opacity: faceletOpacity / 100,
        strokeOpacity: 0.5,
        strokeWidth: strokeWidth,
        strokeLinejoin: 'round'
      });
      for (let i = 0; i < 3; i++) {
        g.append(this.facelet(renderOrder[i]));
      }

      // Create outline for each background face (transparency only)
      g = svg.g().styles({
        strokeWidth: 0.1,
        strokeLinejoin: 'round',
        opacity: cubeOpacity / 100
      });
      for (let i = 0; i < 3; i++) {
        g.append(this.outline(renderOrder[i]));
      }
    }

    // Create outline for each visible face
    let g = svg.g().styles({
      strokeWidth: 0.1,
      strokeLinejoin: 'round',
      opacity: cubeOpacity / 100
    });
    for (let i = 3; i < 6; i++) {
      if (this.isFaceVisible(renderOrder[i], rotationVector) || cubeOpacity < 100) {
        g.append(this.outline(renderOrder[i]));
      }
    }

    // Create polygon for each visible facelet
    g = svg.g().styles({
      opacity: faceletOpacity / 100,
      strokeOpacity: 1,
      strokeWidth: strokeWidth,
      strokeLinejoin: 'round'
    })
    for (let i = 3; i < 6; i++) {
      if (this.isFaceVisible(renderOrder[i], rotationVector) || cubeOpacity < 100) {
        g.append(this.facelet(renderOrder[i]));
      }
    }

    // Create OLL view guides
    if (view == 'plan') {
      let g = svg.g().styles({
        opacity: faceletOpacity / 100,
        strokeOpacity: 1,
        strokeWidth: 0.02,
        strokeLinejoin: 'round'
      });
      for (let face of [F, L, B, R]) {
        g.append(this.oll(face));
      }
    }

    // Draw Arrows
    if (arrows) {
      const arrowWidth = 0.12 / dimension;
      let g = svg.g().styles({
        opacity: 1,
        strokeOpacity: 1,
        strokeWidth: arrowWidth,
        strokeLinejoin: 'round'
      });
      for (let i = 0; i < arrows.length; i++) {
        g.append(this.arrow(i));
      }
    }

    return svg;
  }

  facelet (face: number): FluentSVGElement {
    return new FluentSVGElement('polygon');
  }
  
  outline (face: number): FluentSVGElement {
    return new FluentSVGElement('polygon');
  }

  oll (face: number): FluentSVGElement {
    return new FluentSVGElement('polygon');
  }
  
  arrow (face: number): FluentSVGElement {
    return new FluentSVGElement('polygon');
  }

  isFaceVisible (face: number, rotationVector: any): boolean {
    return true;
  }
}

class Rectangle {
  constructor (public x: number, public y: number, public width: number, public height: number) {}

  toString (): string {
    return [this.x, this.y, this.width, this.height].join(' ');
  }
}
