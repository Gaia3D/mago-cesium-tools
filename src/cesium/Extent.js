export class Extent {
    constructor(minX, minY, maxX, maxY) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    /**
     * Returns the minimum longitude of the extent
     */
    static createFromDegrees(minLon, minLat, maxLon, maxLat) {
        return new Extent(minLon, minLat, maxLon, maxLat);
    }

    /**
     * Returns the minimum longitude of the extent
     * @returns {*}
     */
    getMinLon() {
        return this.minX;
    }

    /**
     * Returns the maximum longitude of the
     * @returns {*}
     */
    getMaxLon() {
        return this.maxX;
    }

    /**
     * Returns the minimum latitude of the extent
     * @returns {*}
     */
    getMinLat() {
        return this.minY;
    }

    /**
     * Returns the maximum latitude of the extent
     * @returns {*}
     */
    getMaxLat() {
        return this.maxY;
    }

    /**
     * Returns the width of the extent
     * @returns {number}
     */
    getWidth() {
        return this.maxX - this.minX;
    }

    /**
     * Returns the height of the extent
     * @returns {number}
     */
    getHeight() {
        return this.maxY - this.minY;
    }

    /**
     * Returns the center of the extent
     * @returns {{x: number, y: number}}
     */
    getCenter() {
        return {
            x: (this.minX + this.maxX) / 2,
            y: (this.minY + this.maxY) / 2
        }
    }

    /**
     * Returns the center of the extent
     */
    getCenterLonLat() {
        return {
            lon: (this.minX + this.maxX) / 2,
            lat: (this.minY + this.maxY) / 2
        }
    }

    /**
     * Returns the area of the extent
     * @returns {number}
     */
    getArea() {
        return this.getWidth() * this.getHeight();
    }
}