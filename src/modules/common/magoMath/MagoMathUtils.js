export class MagoMathUtils {
    static getLogDivisions(minValue, maxValue, numberOfDivisions, accentuationFactor) {
        const logMin = Math.log(minValue + 1); // avoid log(0)
        const logMax = Math.log(maxValue + 1);
        const logRange = logMax - logMin;
        const divisions = [];

        for (let i = 0; i <= numberOfDivisions; i++) {
            const normalizedValue = i / numberOfDivisions;
            const accentuatedValue = Math.pow(normalizedValue, accentuationFactor);
            const logValue = logMin + accentuatedValue * logRange;
            const value = Math.exp(logValue) - 1;
            divisions.push(value);
        }

        return divisions;
    }

    static mix(a, b, t) {
        return a * (1 - t) + b * t;
    }

    static mixVec3(a, b, t) {
        return {
            x: MagoMathUtils.mix(a.x, b.x, t), y: MagoMathUtils.mix(a.y, b.y, t), z: MagoMathUtils.mix(a.z, b.z, t),
        };
    }
}