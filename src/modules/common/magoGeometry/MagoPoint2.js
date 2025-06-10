export class MagoPoint2 {
    constructor(x, y) {
        if (x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
            return;
        }
        this.x = 0;
        this.y = 0;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new MagoPoint2(this.x, this.y);
    }
}