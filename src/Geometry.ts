const wrapAngle: (angle: number) => number = require('normalize-range').curry(0, Math.PI).wrap

export type Axis = 'x' | 'y' | 'z'

export type Rotation = [Axis, number]

export type Line = [Point, Point]
export type Polyline = Point[]

export type Point2 = [number, number]
export type Line2 = [Point2, Point2]

export const axes: Axis[] = ['x', 'y', 'z']

export class Point {
  constructor (public x: number, public y: number, public z: number) {}

  clone (): Point {
    return new Point(this.x, this.y, this.z)
  }

  translate (x: number, y?: number, z?: number): this {
    if (typeof y === 'undefined') y = x
    if (typeof z === 'undefined') z = y
    this.x += x
    this.y += y
    this.z += z
    return this
  }

  scale (factor: number): this {
    this.x *= factor
    this.y *= factor
    this.z *= factor
    return this
  }

  rotate (...rotations: Rotation[]): this {
    return rotations.reduce((self, rotation) => {
      const { x, y, z } = self
      const axis = rotation[0]
      const angle = Math.PI * rotation[1] / 180
      // https://www.siggraph.org/education/materials/HyperGraph/modeling/mod_tran/3drota.htm
      switch (axis) {
        case 'x':
          self.y = y * Math.cos(angle) - z * Math.sin(angle)
          self.z = y * Math.sin(angle) + z * Math.cos(angle)
          break
        case 'y':
          self.z = z * Math.cos(angle) - x * Math.sin(angle)
          self.x = z * Math.sin(angle) + x * Math.cos(angle)
          break
        case 'z':
          self.x = x * Math.cos(angle) - y * Math.sin(angle)
          self.y = x * Math.sin(angle) + y * Math.cos(angle)
          break
      }
      return self
    }, this)
  }

  move (to: Point, distance: number): Point {
    const delta = to.clone().translate(-this.x, -this.y, -this.z).normalize().scale(distance)
    return this.translate(delta.x, delta.y, delta.z)
  }

  normalize (): Point {
    return this.scale(1 / this.magnitude())
  }

  magnitude (): number {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2))
  }

  project (distance: number): Point2 {
    if (distance === Infinity) {
      return [this.x, this.y]
    }
    // http://slideplayer.com/slide/8612932/
    return [
      distance * this.x / (distance - this.z),
      distance * this.y / (distance - this.z)
    ]
  }

  axisOfMaxAbs (): Axis {
    return axes
      .map(a => [a, Math.abs(this[a])] as [Axis, number])
      .reduce((prev, curr) => {
        return prev[1] > curr[1] ? prev : curr
      })[0]
  }

  to2dString (distance: number): string {
    return this.project(distance).map(n => n.toFixed(4)).join(',')
  }
}

export function midPoint (p1: Point2, p2: Point2, ratio: number): Point2 {
  return [
    (1 - ratio) * p1[0] + ratio * p2[0],
    (1 - ratio) * p1[1] + ratio * p2[1]]
}

// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
export function intersection (l1: Line2, l2: Line2): Point2 {
  const [[x1, y1], [x2, y2]] = l1
  const [[x3, y3], [x4, y4]] = l2
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  const xNumer = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)
  const yNumer = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)
  return [xNumer / denom, yNumer / denom]
}

// https://math.stackexchange.com/a/274728
export function onRightSide (line: Line2, point: Point2): boolean {
  const [[x1, y1], [x2, y2]] = line
  const [x, y] = point
  const d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
  return d > 0
}

// https://math.stackexchange.com/a/873400
export function angleBetween (l1: Line2, l2: Line2): number {
  const [a, b] = l1
  const [c, d] = l2
  const alpha0 = Math.atan2(a[1] - b[1], a[0] - b[0])
  const alpha1 = Math.atan2(d[1] - c[1], d[0] - c[0])
  const angle = wrapAngle(alpha1 - alpha0)
  return angle <= Math.PI ? angle : 2 * Math.PI - angle
}
