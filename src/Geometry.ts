export enum Axis {
  X = 'x', Y = 'y', Z = 'z'
}

namespace Degree {
  function deg2rad (degree: number) {
    return Math.PI * degree / 180
  }

  export function sin (angle: number): number {
    return Math.sin(deg2rad(angle))
  }

  export function cos (angle: number): number {
    return Math.cos(deg2rad(angle))
  }
}

export type Rotation = [Axis | 'x' | 'y' | 'z', number]

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
    function r (self: Point, rotation: Rotation): Point {
      const { x, y, z } = self
      const [axis, angle] = rotation
      switch (axis) {
        case Axis.X:
          self.z = z * Degree.cos(angle) - y * Degree.sin(angle)
          self.y = z * Degree.sin(angle) + y * Degree.cos(angle)
          break
        case Axis.Y:
          self.x = x * Degree.cos(angle) + z * Degree.sin(angle)
          self.z = -x * Degree.sin(angle) + z * Degree.cos(angle)
          break
        case Axis.Z:
          self.x = x * Degree.cos(angle) - y * Degree.sin(angle)
          self.y = x * Degree.sin(angle) + y * Degree.cos(angle)
          break
      }
      return self
    }

    rotations.forEach(rot => r(this, rot))
    return this
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
