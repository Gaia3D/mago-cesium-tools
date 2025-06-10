export class MagoPoint3 {
    constructor(x, y, z) {
        if (x !== undefined && y !== undefined && z !== undefined) {
            this.x = x;
            this.y = y;
            this.z = z;
            return;
        }
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() {
        return new MagoPoint3(this.x, this.y, this.z);
    }

    cross(a, b) {
        const x = a.x;
        const y = a.y;
        const z = a.z;

        this.x = y * b.z - z * b.y;
        this.y = z * b.x - x * b.z;
        this.z = x * b.y - y * b.x;

        return this;
    }

    normalize() {
        const x = this.x;
        const y = this.y;
        const z = this.z;

        const length = Math.sqrt(x * x + y * y + z * z);
        if (length > 0) {
            this.x /= length;
            this.y /= length;
            this.z /= length;
        }

        return this;
    }

    sub(a, b) {
        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;

        return this;
    }
}