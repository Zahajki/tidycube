import { JSDOM } from 'jsdom'
import * as _ from 'lodash'

namespace Doc {
  export const namespaceURI: string = 'http://www.w3.org/2000/svg'

  const doc: Document =
    typeof window !== 'undefined' ? window.document : (new JSDOM()).window.document

  export function createElement (name: string): Element {
    return doc.createElementNS(namespaceURI, name)
  }
}

export default class SvgBuilder {
  static create (width: number, height: number, viewBox: string): FluentSVGSVGElement {
    const svg = new FluentSVGSVGElement('svg')
    svg.attributes({
      version: 1.1,
      xmlns: Doc.namespaceURI,
      width: width,
      height: height,
      viewBox: viewBox
    })
    return svg
  }
}

export class FluentSVGElement {
  protected nativeElement: Element

  constructor (name: string) {
    this.nativeElement = Doc.createElement(name)
  }

  element (name: string, attributes: object = {}): FluentSVGElement {
    const child = new FluentSVGElement(name)
    this.nativeElement.appendChild(child.nativeElement)
    child.attributes(attributes)
    return child
  }

  attributes (attributes: any): FluentSVGElement {
    Object.keys(attributes).forEach(attrName => {
      if (attrName !== 'style') {
        this.nativeElement.setAttribute(attrName, attributes[attrName])
      } else {
        this.styles(attributes[attrName])
      }
    })
    return this
  }

  styles (styles: any): FluentSVGElement {
    const styleValue = Object.keys(styles).map(prop => _.kebabCase(prop) + ':' + styles[prop]).join(';')
    this.nativeElement.setAttribute('style', styleValue)
    return this
  }

  append (child: FluentSVGElement): void {
    this.nativeElement.appendChild(child.nativeElement)
  }

  g (attributes: object = {}): FluentSVGElement {
    return this.element('g', attributes)
  }

  rect (attributes: object = {}): FluentSVGElement {
    return this.element('rect', attributes)
  }

  polygon (attributes: object = {}): FluentSVGElement {
    return this.element('polygon', attributes)
  }

  path (attributes: object = {}): FluentSVGElement {
    return this.element('path', attributes)
  }
}

export class FluentSVGSVGElement extends FluentSVGElement {
  get xml (): string {
    return [
      '<?xml version="1.0" standalone="no"?>',
      '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
      this.nativeElement.outerHTML
    ].join('\n')
  }

  get dom (): Element {
    return this.nativeElement
  }
}
