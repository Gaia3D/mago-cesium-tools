export class Volume {

    // define volume bounds
    //   7 - 6
    //  /   /|
    // 4 - 5 |
    // |   | |
    // | 3 - 2
    // |/  |/
    // 0 - 1
    bounds = [
        [120, 30, 0],
        [130, 30, 0],
        [130, 40, 0],
        [120, 40, 0],
        [120, 30, 10000],
        [130, 30, 10000],
        [130, 40, 10000],
        [120, 40, 10000],
    ];

    constructor(options) {
        Object.assign(this, options);
    }

    getPosition(normalizedXYZ) { return normalizedXYZ; }

    /**
     * vertex mixing
     * @param {Array<Number>} a
     * @param {Array<Number>} b
     * @param {Number} t
     */
    _mix(a, b, t) {
        return [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t,
        ]
    }
}

export class HomogeneousVolume extends Volume {
    getPosition(normalizedXYZ) {
        const [x, y, z] = normalizedXYZ;

        const bottomBack = this._mix(this.bounds[0], this.bounds[1], x);
        const bottomFront = this._mix(this.bounds[3], this.bounds[2], x);
        const bottom = this._mix(bottomBack, bottomFront, y);

        const topBack = this._mix(this.bounds[4], this.bounds[5], x);
        const topFront = this._mix(this.bounds[7], this.bounds[6], x);
        const top = this._mix(topBack, topFront, y);

        const position = this._mix(bottom, top, z);
        return position;
    }

}

export class LonLatAltVolume extends HomogeneousVolume {
    constructor(lonlatQuad, altitudeRange, options) {
        super(options);

        this.bounds = [
            [lonlatQuad[0][0], lonlatQuad[0][1], altitudeRange[0]],
            [lonlatQuad[1][0], lonlatQuad[1][1], altitudeRange[0]],
            [lonlatQuad[2][0], lonlatQuad[2][1], altitudeRange[0]],
            [lonlatQuad[3][0], lonlatQuad[3][1], altitudeRange[0]],
            [lonlatQuad[0][0], lonlatQuad[0][1], altitudeRange[1]],
            [lonlatQuad[1][0], lonlatQuad[1][1], altitudeRange[1]],
            [lonlatQuad[2][0], lonlatQuad[2][1], altitudeRange[1]],
            [lonlatQuad[3][0], lonlatQuad[3][1], altitudeRange[1]],
        ];
    }

    getAltitudeRange() {
        return [this.bounds[0][2], this.bounds[4][2]];
    }
}