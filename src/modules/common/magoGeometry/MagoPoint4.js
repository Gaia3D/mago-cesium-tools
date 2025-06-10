export class MagoPoint4 {
    constructor(x, y, z, w) {
        if (x !== undefined && y !== undefined && z !== undefined && w !== undefined) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return;
        }
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.w = 0;
    }

    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    clone() {
        return new MagoPoint4(this.x, this.y, this.z, this.w);
    }
}