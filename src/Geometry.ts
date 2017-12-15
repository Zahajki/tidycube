export type Axis = 'x' | 'y' | 'z'

export type Rotation = [Axis, number]

function deg2rad (degree: number) {
  return Math.PI * degree / 180
}

export class Point {
  constructor (public x: number, public y: number, public z: number) {}

  static mid (p1: Point, p2: Point, ratio: number): Point {
    return new Point(
      ratio * p1.x + (1 - ratio) * p2.x,
      ratio * p1.y + (1 - ratio) * p2.y,
      ratio * p1.z + (1 - ratio) * p2.z
    )
  }

  clone (): Point {
    return new Point(this.x, this.y, this.z)
  }

  translate (x: number, y?: number, z?: number): Point {
    if (typeof y === 'undefined') y = x
    if (typeof z === 'undefined') z = y
    this.x += x
    this.y += y
    this.z += z
    return this
  }

  rotate (...rotations: Rotation[]): Point {
    return rotations.reduce((self, rotation) => {
      const { x, y, z } = self
      const axis = rotation[0]
      const angle = Math.PI * rotation[1] / 180
      switch (axis) {
        case 'x':
          self.z = z * Math.cos(angle) - y * Math.sin(angle)
          self.y = z * Math.sin(angle) + y * Math.cos(angle)
          break
        case 'y':
          self.x = x * Math.cos(angle) + z * Math.sin(angle)
          self.z = -x * Math.sin(angle) + z * Math.cos(angle)
          break
        case 'z':
          self.x = x * Math.cos(angle) - y * Math.sin(angle)
          self.y = x * Math.sin(angle) + y * Math.cos(angle)
          break
      }
      return self
    }, this)
  }

  project (distance: number): [number, number] {
    if (distance === Infinity) {
      return [this.x, this.y]
    }
    return [
      this.x * distance / (this.z + distance),
      this.y * distance / (this.z + distance)
    ]
  }

  to2dString (distance: number): string {
    return this.project(distance).map(n => n.toFixed(4)).join(',')
  }
}

// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
export function intersection (l1: [[number, number], [number, number]], l2: [[number, number], [number, number]]): [number, number] {
  const [[x1, y1], [x2, y2]] = l1
  const [[x3, y3], [x4, y4]] = l2
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  const xNumer = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)
  const yNumer = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)
  return [xNumer / denom, yNumer / denom]
}
