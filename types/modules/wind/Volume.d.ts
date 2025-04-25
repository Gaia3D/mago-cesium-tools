export class Volume {
    constructor(options: any);
    bounds: number[][];
    getPosition(normalizedXYZ: any): any;
    /**
     * vertex mixing
     * @param {Array<Number>} a
     * @param {Array<Number>} b
     * @param {Number} t
     */
    _mix(a: Array<number>, b: Array<number>, t: number): number[];
}
export class HomogeneousVolume extends Volume {
    getPosition(normalizedXYZ: any): number[];
}
export class LonLatAltVolume extends HomogeneousVolume {
    constructor(lonlatQuad: any, altitudeRange: any, options: any);
    bounds: any[][];
    getAltitudeRange(): any[];
}
