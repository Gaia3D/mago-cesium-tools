import {MagoMathUtils} from "../mago3D/magoMath/MagoMathUtils";
import {MagoColorLegend} from "../mago3D/magoColor/MagoColorLegend";
import * as Cesium from "cesium";

export class VolumetricRenderUtils {
    static getLegendColors(minValue, maxValue, numberOfDivisions, accentuationFactor, accentuationFactorAlpha) {
        let legend = [];

        if (accentuationFactor === undefined || accentuationFactor === null) {
            accentuationFactor = 1.0;
        }

        if (accentuationFactorAlpha === undefined || accentuationFactorAlpha === null) {
            accentuationFactorAlpha = 1.0;
        }

        let legendValues = MagoMathUtils.getLogDivisions(minValue, maxValue, numberOfDivisions, accentuationFactor);
        let alphaValues = MagoMathUtils.getLogDivisions(0.0, 0.99, numberOfDivisions, accentuationFactorAlpha);
        legend.push(new MagoColorLegend(0 / 255, 0 / 255, 143 / 255, alphaValues[0], legendValues[0]));
        legend.push(new MagoColorLegend(0 / 255, 15 / 255, 255 / 255, alphaValues[1], legendValues[1]));
        legend.push(new MagoColorLegend(0 / 255, 95 / 255, 255 / 255, alphaValues[2], legendValues[2]));
        legend.push(new MagoColorLegend(0 / 255, 175 / 255, 255 / 255, alphaValues[3], legendValues[3]));
        legend.push(new MagoColorLegend(0 / 255, 255 / 255, 255 / 255, alphaValues[4], legendValues[4]));

        legend.push(new MagoColorLegend(79 / 255, 255 / 255, 175 / 255, alphaValues[5], legendValues[5]));
        legend.push(new MagoColorLegend(159 / 255, 255 / 255, 95 / 255, alphaValues[6], legendValues[6]));
        legend.push(new MagoColorLegend(239 / 255, 255 / 255, 15 / 255, alphaValues[7], legendValues[7]));
        legend.push(new MagoColorLegend(255 / 255, 191 / 255, 0 / 255, alphaValues[8], legendValues[8]));
        legend.push(new MagoColorLegend(255 / 255, 111 / 255, 0 / 255, alphaValues[9], legendValues[9]));

        legend.push(new MagoColorLegend(255 / 255, 31 / 255, 0 / 255, alphaValues[10], legendValues[10]));
        legend.push(new MagoColorLegend(207 / 255, 0 / 255, 0 / 255, alphaValues[11], legendValues[11]));
        return legend;
    }

    static getColorLegendAndValues(minValue, maxValue, resultColorLegends, resultColorValues, accentuationFactor, accentuationFactorAlpha) {
        if (accentuationFactor === undefined || accentuationFactor === null) {
            accentuationFactor = 1.0;
        }
        if (accentuationFactorAlpha === undefined || accentuationFactorAlpha === null) {
            accentuationFactorAlpha = 1.0;
        }
        let numberOfDivisions = 12;
        let legend = VolumetricRenderUtils.getLegendColors(minValue, maxValue, numberOfDivisions, accentuationFactor, accentuationFactorAlpha);
        let legendsCount = legend.length;
        for (let i = 0; i < legendsCount; i++) {
            let colorLegend = legend[i];
            let color = new Cesium.Color(colorLegend.red, colorLegend.green, colorLegend.blue, colorLegend.alpha);
            resultColorLegends.push(color);
            resultColorValues.push(colorLegend.value);
        }
    }
}