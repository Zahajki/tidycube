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

  static mid (p1: Point, p2: Point): Point {
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2)
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

  scale (factor: number, center?: Point): Point {
    if (!center) {
      this.x *= factor
      this.y *= factor
      this.z *= factor
    } else {
      const iv = center.clone().invert()
      this.translate(iv).scale(factor).translate(center)
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

  project (distance: number): Point {
    if (distance !== Infinity) {
      const old = this.clone()
      this.x = old.x * distance / (old.z + distance)
      this.y = old.y * distance / (old.z + distance)
      // Maintain z coordinate to allow use of rendering tricks
    }
    return this
  }

  to2dArray (): [number, number] {
    return [this.x, this.y]
  }

  to2dString (): string {
    return this.x.toFixed(8) + ',' + this.y.toFixed(8)
  }

  private invert (): Point {
    this.x *= -1
    this.y *= -1
    this.z *= -1
    return this
  }
}
