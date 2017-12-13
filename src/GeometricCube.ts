import { GeometricCubeBase, Corner, Util, STICKER_MARGIN, EXTRA_MARGIN } from './GeometricCubeBase'
import { Point } from './Geometry'
const convexHull: (points: [number, number][]) => number[] = require('monotone-convex-hull-2d')

export class Vertex {
  corner: Point
  edgeEndpoints: Point[] = []

  constructor (corner: Point) {
    // URF corner vertex
    this.corner = corner.clone()
  }

  private static adjacent (c1: Corner, c2: Corner) {
    const match = Corner[c1].match(new RegExp(`[${Corner[c2]}]`, 'g'))
    return match && match.length === 2
  }

  setEdgeEndpoints (dimension: number, corner: Corner, vertices: Vertex[]): void {
    Util.times(8, c => {
      if (Vertex.adjacent(corner, c)) {
        this.edgeEndpoints[c] = Point.mid(
          this.corner,
          vertices[c].corner,
          (dimension + EXTRA_MARGIN - STICKER_MARGIN) / (dimension + 2 * EXTRA_MARGIN)
        )
      }
    })
  }

  forEach (callbackfn: (p: Point) => void): void {
    callbackfn(this.corner)
    Util.times(8, c => {
      if (this.edgeEndpoints[c]) {
        callbackfn(this.edgeEndpoints[c])
      }
    })
  }
}

export class GeometricCube extends GeometricCubeBase {
  vertices: Vertex[] = []

  constructor (dimension: number) {
    super(dimension)

    //
    // assign corners and edges points for more accurate rendering
    //

    // URF corner vertex
    const urf = new Point(dimension + EXTRA_MARGIN, -EXTRA_MARGIN, -EXTRA_MARGIN)
      .translate(-dimension / 2)
    let p = urf.clone()
    this.vertices[Corner.URF] = new Vertex(p)
    this.vertices[Corner.UFL] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.ULB] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.UBR] = new Vertex(p.rotate(['y', -90]))
    p = urf.rotate(['x', -90])
    this.vertices[Corner.DFR] = new Vertex(p)
    this.vertices[Corner.DLF] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.DBL] = new Vertex(p.rotate(['y', -90]))
    this.vertices[Corner.DRB] = new Vertex(p.rotate(['y', -90]))

    // set edge endpoints for each edge
    Util.times(8, c => {
      this.vertices[c].setEdgeEndpoints(dimension, c, this.vertices)
    })
  }

  silhouette (distance: number): [number[], Vertex[]] {
    const points = this.vertices.map(v => v.corner.project(distance))
    const hull = convexHull(points)
    return [hull, hull.map(index => this.vertices[index])]
  }

  protected forEach (callbackfn: (p: Point) => void): void {
    super.forEach(callbackfn)
    this.vertices.forEach(v => v.forEach(callbackfn))
  }
}
