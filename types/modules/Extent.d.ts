/**
 * Represents a 2D extent defined by its minimum and maximum coordinates.
 * @alias Extent
 * @constructor
 * @param {Number} minX The minimum x coordinate.
 * @param {Number} minY The minimum y coordinate.
 * @param {Number} maxX The maximum x coordinate.
 * @param {Number} maxY The maximum y coordinate.
 * @ignore
 * @example
 * const extent = new Extent(0.0, 0.0, 1.0, 1.0);
 */
export class Extent {
    /**
     * Returns the minimum longitude of the extent
     */
    static createFromDegrees(minLon: any, minLat: any, maxLon: any, maxLat: any): Extent;
    constructor(minX: any, minY: any, maxX: any, maxY: any);
    minX: any;
    minY: any;
    maxX: any;
    maxY: any;
    /**
     * Returns the minimum longitude of the extent
     * @returns {*}
     */
    getMinLon(): any;
    /**
     * Returns the maximum longitude of the
     * @returns {*}
     */
    getMaxLon(): any;
    /**
     * Returns the minimum latitude of the extent
     * @returns {*}
     */
    getMinLat(): any;
    /**
     * Returns the maximum latitude of the extent
     * @returns {*}
     */
    getMaxLat(): any;
    /**
     * Returns the width of the extent
     * @returns {number}
     */
    getWidth(): number;
    /**
     * Returns the height of the extent
     * @returns {number}
     */
    getHeight(): number;
    /**
     * Returns the center of the extent
     * @returns {{x: number, y: number}}
     */
    getCenter(): {
        x: number;
        y: number;
    };
    /**
     * Returns the center of the extent
     */
    getCenterLonLat(): {
        lon: number;
        lat: number;
    };
    /**
     * Returns the area of the extent
     * @returns {number}
     */
    getArea(): number;
}
