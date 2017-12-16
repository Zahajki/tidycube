import { GeometricCubeBase, Corner, STICKER_MARGIN, EXTRA_MARGIN } from './GeometricCubeBase'
import { Point, Polyline } from './Geometry'
const convexHull: (points: [number, number][]) => number[] = require('monotone-convex-hull-2d')

const unitCorners = [
  /* URF */ new Point(1, 1, 1),
  /* UFL */ new Point(0, 1, 1),
  /* ULB */ new Point(0, 0, 1),
  /* UBR */ new Point(1, 0, 1),
  /* DFR */ new Point(1, 1, 0),
  /* DLF */ new Point(0, 1, 0),
  /* DBL */ new Point(0, 0, 0),
  /* DRB */ new Point(1, 0, 0)
].map(p => p.translate(-0.5))

export class GeometricCube extends GeometricCubeBase {
  silhouette (distance: number): Polyline[] {
    const corners2 = unitCorners.map(p => p
      .clone()
      .rotate(...this.rotations)
      .project(distance))
    const hull: Corner[] = convexHull(corners2)

    let result: [Point, Point][] = []
    for (let i = 0; i < hull.length; i++) {
      const curr = hull[i]
      const next: Corner = hull[(i + 1) % hull.length]
      result.push([this.edgeEndpoint(curr, next), this.edgeEndpoint(next, curr)])
    }
    return result
  }

  private edgeEndpoint (nearCorner: Corner, farCorner: Corner): Point {
    const [nP, fP] = [nearCorner, farCorner].map(c =>
      unitCorners[c].clone()
        .scale(this.dimension + 2 * EXTRA_MARGIN)
        .rotate(...this.rotations))
    return Point.mid(nP, fP,
      (STICKER_MARGIN + EXTRA_MARGIN) / (this.dimension + 2 * EXTRA_MARGIN))
  }
}
