export class MagoPoint3 {
    constructor(x: any, y: any, z: any);
    x: any;
    y: any;
    z: any;
    set(x: any, y: any, z: any): void;
    clone(): MagoPoint3;
    cross(a: any, b: any): this;
    normalize(): this;
    sub(a: any, b: any): this;
}
