export class MagoColorUtils {
    static getColorFromHex(hex) {
        const r = (hex >> 16) & 0xff;
        const g = (hex >> 8) & 0xff;
        const b = hex & 0xff;
        return {r, g, b};
    }

    static getHexFromColor(r, g, b) {
        return (r << 16) | (g << 8) | b;
    }

    static getColorFromString(colorString) {
        if (colorString.startsWith("#")) {
            return this.getColorFromHex(parseInt(colorString.slice(1), 16));
        }
        // Add more color parsing logic if needed
        throw new Error("Unsupported color format");
    }
}