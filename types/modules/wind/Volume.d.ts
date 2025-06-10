export class Volume {
    constructor(options: any);
    bounds: number[][];
    getPosition(normalizedXYZ: any): any;
    mix(a: any, b: any, t: any): any[];
}
export class HomogeneousVolume extends Volume {
    getPosition(normalizedXYZ: any): any[];
}
export class LonLatAltVolume extends HomogeneousVolume {
    constructor(lonlatQuad: any, altitudeRange: any, options: any);
    bounds: any[][];
    getAltitudeRange(): any[];
}
