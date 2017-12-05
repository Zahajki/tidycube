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
  axis: Axis | keyof typeof Axis
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

  translate (delta: Point): Point {
    this.x += delta.x
    this.y += delta.y
    this.z += delta.z
    return this
  }

  scale (factor: number, center: Point | undefined = undefined): Point {
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
      case Axis[Axis.X]:
        this.z = old.z * Degree.cos(deg) - old.y * Degree.sin(deg)
        this.y = old.z * Degree.sin(deg) + old.y * Degree.cos(deg)
        break
      case Axis.Y:
      case Axis[Axis.Y]:
        this.x = old.x * Degree.cos(deg) + old.z * Degree.sin(deg)
        this.z = -old.x * Degree.sin(deg) + old.z * Degree.cos(deg)
        break
      case Axis.Z:
      case Axis[Axis.Z]:
        this.x = old.x * Degree.cos(deg) - old.y * Degree.sin(deg)
        this.y = old.x * Degree.sin(deg) + old.y * Degree.cos(deg)
        break
    }
    return this
  }

  project (distance: number): Point {
    const old = this.clone()
    this.x = old.x * distance / old.z
    this.y = old.y * distance / old.z
    // Maintain z coordinate to allow use of rendering tricks
    return this
  }

  to2dArray (): number[] {
    return [this.x, this.y]
  }

  to2dString (): string {
    return this.x + ',' + this.y
  }

  private invert (): Point {
    this.x *= -1
    this.y *= -1
    this.z *= -1
    return this
  }
}
