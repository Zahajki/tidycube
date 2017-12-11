export enum Axis {
  X = 0, Y, Z
}

namespace Degree {
  export function sin (angle: number): number {
    return Math.sin(Math.PI * angle / 180)
  }

  export function cos (angle: number): number {
    return Math.cos(Math.PI * angle / 180)
  }
}

export interface Rotation {
  axis: Axis
  angle: number
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

  translate (delta: Point): Point
  translate (x: number, y?: number, z?: number): Point
  translate (deltaOrX: number | Point, y?: number, z?: number): Point {
    if (typeof deltaOrX === 'number' && typeof y === 'number' && typeof z === 'number') {
      this.x += deltaOrX
      this.y += y
      this.z += z
    } else if (typeof deltaOrX === 'number' && typeof y === 'undefined') {
      this.x += deltaOrX
      this.y += deltaOrX
      this.z += deltaOrX
    } else if (typeof deltaOrX !== 'number') {
      this.x += deltaOrX.x
      this.y += deltaOrX.y
      this.z += deltaOrX.z
    }
    return this
  }

  rotate (rotation: Rotation): Point {
    const old = this.clone()
    const deg = rotation.angle
    switch (rotation.axis) {
      case Axis.X:
        this.z = old.z * Degree.cos(deg) - old.y * Degree.sin(deg)
        this.y = old.z * Degree.sin(deg) + old.y * Degree.cos(deg)
        break
      case Axis.Y:
        this.x = old.x * Degree.cos(deg) + old.z * Degree.sin(deg)
        this.z = -old.x * Degree.sin(deg) + old.z * Degree.cos(deg)
        break
      case Axis.Z:
        this.x = old.x * Degree.cos(deg) - old.y * Degree.sin(deg)
        this.y = old.x * Degree.sin(deg) + old.y * Degree.cos(deg)
        break
    }
    return this
  }

  project (distance: number): [number, number] {
    if (distance !== Infinity) {
      return [
        this.x * distance / (this.z + distance),
        this.y * distance / (this.z + distance)
      ]
    }
    return [this.x, this.y]
  }
}
