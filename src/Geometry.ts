export type Axis = 'x' | 'y' | 'z'

export type Rotation = [Axis, number]

export type Point2 = [number, number]
export type Line2 = [Point2, Point2]

export const axes: Axis[] = ['x', 'y', 'z']

export class Point {
  constructor (public x: number, public y: number, public z: number) {}

  static dot (a: Point, b: Point): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  clone (): Point {
    return new Point(this.x, this.y, this.z)
  }

  equals (other: Point): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z
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

  move (to: Point, distance: number): this {
    if (this.equals(to)) return this
    const delta = to.clone().translate(-this.x, -this.y, -this.z).normalize().scale(distance)
    return this.translate(delta.x, delta.y, delta.z)
  }

  normalize (): this {
    return this.scale(1 / this.magnitude())
  }

  magnitude (): number {
    return Math.sqrt(Point.dot(this, this))
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

// https://math.stackexchange.com/a/274728
export function onRightSide (line: Line2, point: Point2): boolean {
  const [[x1, y1], [x2, y2]] = line
  const [x, y] = point
  const d = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
  return d > 0
}

// https://math.stackexchange.com/a/361419
export function angleBetween (a: Point2, b: Point2, c: Point2): number {
  const ab: Point2 = [b[0] - a[0], b[1] - a[1]]
  const bc: Point2 = [c[0] - b[0], c[1] - b[1]]
  return Math.acos(dot(ab, bc) / norm(ab) * norm(bc))
}

function dot (a: Point2, b: Point2): number {
  return a[0] * b[0] + a[1] * b[1]
}

function norm (a: Point2): number {
  return Math.sqrt(dot(a, a))
}
