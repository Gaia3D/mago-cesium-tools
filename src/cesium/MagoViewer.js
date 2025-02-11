import { Viewer, Entity, Cartesian3, Color } from "cesium";

export class MagoViewer {
    constructor(viewer) {
        this.viewer = viewer;
    }

    addPoint(longitude, latitude) {
        this.viewer.entities.add(
            new Entity({
                position: Cartesian3.fromDegrees(longitude, latitude),
                point: {
                    pixelSize: 5,
                    color: Color.RED
                },
            })
        );
    }

    sample(count) {
        for (let i = 0; i < count; i++) {
            // random points
            let randomX = (Math.random() * 360) - 180;
            let randomY = (Math.random() * 180) - 90;
            this.viewer.entities.add(
            new Entity({
                position: Cartesian3.fromDegrees(randomX, randomY),
                point: {
                    pixelSize: 5,
                    color: Color.BLUE
                },
            })
            );
        }
    }

    destroy() {
        this.viewer.destroy();
    }
}