/**
 * VolumetricData class
 */
export class VolumetricData {
    mosaicTexture = undefined;

    /**
     * Creates an instance of VolumetricData.
     * @param options
     */
    constructor(options) {
    }

    /**
     * Sets the mosaic texture for the volumetric data.
     * @param texture
     */
    setMosaicTexture(texture) {
        this.mosaicTexture = texture;
    }
}