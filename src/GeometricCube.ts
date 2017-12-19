import { GeometricCubeBase, RoundedVertex, STICKER_MARGIN, EXTRA_MARGIN } from './GeometricCubeBase'
import { Point } from './Geometry'
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
  silhouette (distance: number): RoundedVertex[] {
    const corners2 = unitCorners.map(p => p
      .clone()
      .rotate(...this.rotations)
      .project(distance / this.dimension))

    return convexHull(corners2).map(corner => {
      return {
        vertex: unitCorners[corner].clone()
          .scale(this.dimension + 2 * EXTRA_MARGIN)
          .rotate(...this.rotations),
        prevCutoff: STICKER_MARGIN + EXTRA_MARGIN,
        nextCutoff: STICKER_MARGIN + EXTRA_MARGIN
      }
    })
  }
}
