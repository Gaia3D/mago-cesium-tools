export function pack(value) {
    const bit_shift = [16777216.0, 65536.0, 256.0, 1.0];
    const bit_mask = [0.0, 0.00390625, 0.00390625, 0.00390625];
    const value_A = [
        value * bit_shift[0] * 255.0,
        value * bit_shift[1] * 255.0,
        value * bit_shift[2] * 255.0,
        value * bit_shift[3] * 255.0,
    ];
    const value_B = [256.0, 256.0, 256.0, 256.0];

    const resAux = [
        (value_A[0] % value_B[0]) / 255.0,
        (value_A[1] % value_B[1]) / 255.0,
        (value_A[2] % value_B[2]) / 255.0,
        (value_A[3] % value_B[3]) / 255.0,
    ];

    const resBitMasked = [
        resAux[0] * bit_mask[0],
        resAux[0] * bit_mask[1],
        resAux[1] * bit_mask[2],
        resAux[2] * bit_mask[3],
    ];

    const res = [
        resAux[0] - resBitMasked[0],
        resAux[1] - resBitMasked[1],
        resAux[2] - resBitMasked[2],
        resAux[3] - resBitMasked[3],
    ];
    return [res[3], res[2], res[1], res[0]];
}

export function unpack(values) {
    return values[0] + values[1] / 255.0 + values[2] / 65025.0 + values[3] /
        16581375.0;
}