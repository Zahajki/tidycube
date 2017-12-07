import { JSDOM } from 'jsdom'
import kebabCase = require('lodash/kebabCase')

const namespaceURI: string = 'http://www.w3.org/2000/svg'

namespace Doc {
  const doc: Document =
    // tslint:disable-next-line:strict-type-predicates
    typeof window !== 'undefined' ? window.document : (new JSDOM()).window.document

  export function createElement (name: string): Element {
    return doc.createElementNS(namespaceURI, name)
  }
}

export default class SvgBuilder {
  static create (width: number, height: number, viewBox: string): HandySVGSVGElement {
    // tslint:disable-next-line:no-use-before-declare
    const svg = new HandySVGSVGElement('svg')
    svg.attributes({
      version: 1.1,
      xmlns: namespaceURI,
      width: width,
      height: height,
      viewBox: viewBox
    })
    return svg
  }

  static element (name: string): HandySVGElement {
    // tslint:disable-next-line:no-use-before-declare
    return new HandySVGElement(name)
  }
}

export class HandySVGElement {
  protected nativeElement: Element

  constructor (name: string) {
    this.nativeElement = Doc.createElement(name)
  }

  attributes (attributes: any): this {
    Object.keys(attributes).forEach(attrName => {
      if (attrName !== 'style') {
        const kebabAttrName = attrName === 'viewBox' ? attrName : kebabCase(attrName)
        this.nativeElement.setAttribute(kebabAttrName, attributes[attrName])
      } else {
        this.styles(attributes[attrName])
      }
    })
    return this
  }

  styles (styles: any): this {
    const styleValue = Object.keys(styles).map(prop => kebabCase(prop) + ':' + styles[prop]).join(';')
    this.nativeElement.setAttribute('style', styleValue)
    return this
  }

  addClass (className: string): this {
    this.nativeElement.setAttribute('class', className)
    return this
  }

  append (children: HandySVGElement | HandySVGElement[]): this {
    if (children instanceof Array) {
      children.forEach(child => {
        this.nativeElement.appendChild(child.nativeElement)
      })
    } else {
      this.nativeElement.appendChild(children.nativeElement)
    }
    return this
  }

  appendTo (target: HandySVGElement): this {
    target.nativeElement.appendChild(this.nativeElement)
    return this
  }
}

export class HandySVGSVGElement extends HandySVGElement {
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
