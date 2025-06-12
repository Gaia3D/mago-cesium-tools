/**
 * Axis-Aligned Bounding Box (AABB) class.
 */
export class AxisAlignedBoundingBox {
    /**
     * Creates an instance of AxisAlignedBoundingBox.
     * @param {Cesium.Cartesian3} min - The minimum position of the bounding box.
     * @param {Cesium.Cartesian3} max - The maximum position of the bounding box.
     */
    constructor(min: Cesium.Cartesian3, max: Cesium.Cartesian3);
    /**
     * Minimum position of the bounding box.
     * @type {Cesium.Cartesian3}
     */
    min: Cesium.Cartesian3;
    /**
     * Maximum position of the bounding box.
     * @type {Cesium.Cartesian3}
     */
    max: Cesium.Cartesian3;
}
