import * as Cesium from "cesium";

export class Segment2D {

    /**
     * Represents a 2D segment defined by a start and end point.
     * @param {Cesium.Cartesian2} start The starting point of the segment.
     * @param {Cesium.Cartesian2} end The ending point of the segment.
     */
    constructor(start, end) {
        this.start = start || new Cesium.Cartesian2();
        this.end = end || new Cesium.Cartesian2();
        this.vector = undefined;
        this.calculateVector();
    }

    calculateVector() {
        this.vector = Cesium.Cartesian2.subtract(this.end, this.start, new Cesium.Cartesian2());
        return this.vector;
    }

    static fromCartesian2(start, end, segment2d) {
        segment2d.start = start || new Cesium.Cartesian2();
        segment2d.end = end || new Cesium.Cartesian2();
        segment2d.vector = undefined; // Reset vector to recalculate
        segment2d.calculateVector();
    }

    static fromCartesian3(start, end, segment2d) {
        segment2d.start = new Cesium.Cartesian2(start.x, start.y);
        segment2d.end = new Cesium.Cartesian2(end.x, end.y);
        segment2d.vector = undefined; // Reset vector to recalculate
        segment2d.calculateVector();
    }

    /**
     * Calculates the length of the segment.
     * @returns {number} The length of the segment.
     */
    length() {
        return Cesium.Cartesian2.distance(this.start, this.end);
    }

    /**
     * Checks if the segment intersects with another segment.
     * @param point
     * @returns {boolean}
     */
    intersectPoint(point) {
        const crossProduct = Cesium.Cartesian2.cross(
            Cesium.Cartesian2.subtract(this.end, this.start, new Cesium.Cartesian2()),
            Cesium.Cartesian2.subtract(point, this.start, new Cesium.Cartesian2()),
        );
        return Math.abs(crossProduct) < Cesium.Math.EPSILON6;
    }

    /**
     * Checks if the segment intersects with another segment.
     * @param otherSegment
     * @returns {module:cesium.Cartesian2|null}
     */
    intersectSegment(otherSegment) {
        const a1 = this.end.y - this.start.y;
        const b1 = this.start.x - this.end.x;
        const c1 = a1 * this.start.x + b1 * this.start.y;

        const a2 = otherSegment.end.y - otherSegment.start.y;
        const b2 = otherSegment.start.x - otherSegment.end.x;
        const c2 = a2 * otherSegment.start.x + b2 * otherSegment.start.y;

        const determinant = a1 * b2 - a2 * b1;

        if (determinant === 0) {
            return null;
        } else {
            const x = (b2 * c1 - b1 * c2) / determinant;
            const y = (a1 * c2 - a2 * c1) / determinant;
            return new Cesium.Cartesian2(x, y);
        }
    }
}