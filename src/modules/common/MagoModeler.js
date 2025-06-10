import {MagoVertex} from "./magoGeometry/MagoVertex.js";
import {MagoFace} from "./magoGeometry/MagoFace.js";
import {MagoSurface} from "./magoGeometry/MagoSurface.js";
import {MagoPrimitive} from "./magoGeometry/MagoPrimitive.js";

export class MagoModeler {

    newVertex(px, py, pz, nx, ny, nz, tx, ty) {
        if (px === undefined || py === undefined || pz === undefined) {
            console.error("MagoModeler.newVertex: px, py, pz, are undefined");
            return undefined;
        }

        var vertex = new MagoVertex();
        vertex.setPosition(px, py, pz);

        if (nx !== undefined && ny !== undefined && nz !== undefined) {
            vertex.setNormal(nx, ny, nz);
        }

        if (tx !== undefined && ty !== undefined) {
            vertex.setTexCoord(tx, ty);
        }

        return vertex;
    }

    createBox(minX, minY, minZ, maxX, maxY, maxZ) {
        if (minX === undefined || minY === undefined || minZ === undefined || maxX === undefined || maxY === undefined || maxZ === undefined) {
            console.error("MagoModeler.createBox: minX, minY, minZ, maxX, maxY, maxZ are undefined");
            return undefined;
        }

        //      7-----------------6
        //     /|                /|
        //    / |               / |
        //   4-----------------5  |
        //   |  |              |  |
        //   |  |              |  |
        //   |  3--------------|--2
        //   | /               | /
        //   |/                |/
        //   0-----------------1
        // bottom face (0, 1, 2, 3)
        let v0 = this.newVertex(minX, minY, minZ);
        let v1 = this.newVertex(maxX, minY, minZ);
        let v2 = this.newVertex(maxX, maxY, minZ);
        let v3 = this.newVertex(minX, maxY, minZ);
        // top face (4, 5, 6, 7)
        let v4 = this.newVertex(minX, minY, maxZ);
        let v5 = this.newVertex(maxX, minY, maxZ);
        let v6 = this.newVertex(maxX, maxY, maxZ);
        let v7 = this.newVertex(minX, maxY, maxZ);
        // bottom face (0, 3, 2, 1)
        let bottomFace = new MagoFace([v0.clone(), v3.clone(), v2.clone(), v1.clone()]);
        let bottomSurface = new MagoSurface();
        bottomSurface.addFace(bottomFace);
        // top face (4, 5, 6, 7)
        let topFace = new MagoFace([v4.clone(), v5.clone(), v6.clone(), v7.clone()]);
        let topSurface = new MagoSurface();
        topSurface.addFace(topFace);
        // left face (0, 4, 7, 3)
        let leftFace = new MagoFace([v0.clone(), v4.clone(), v7.clone(), v3.clone()]);
        let leftSurface = new MagoSurface();
        leftSurface.addFace(leftFace);
        // right face (1, 2, 6, 5)
        let rightFace = new MagoFace([v1.clone(), v2.clone(), v6.clone(), v5.clone()]);
        let rightSurface = new MagoSurface();
        rightSurface.addFace(rightFace);
        // front face (0, 1, 5, 4)
        let frontFace = new MagoFace([v0.clone(), v1.clone(), v5.clone(), v4.clone()]);
        let frontSurface = new MagoSurface();
        frontSurface.addFace(frontFace);
        // back face (3, 7, 6, 2)
        let backFace = new MagoFace([v3.clone(), v7.clone(), v6.clone(), v2.clone()]);
        let backSurface = new MagoSurface();
        backSurface.addFace(backFace);
        let primitive = new MagoPrimitive();
        primitive.addSurface(bottomSurface);
        primitive.addSurface(topSurface);
        primitive.addSurface(leftSurface);
        primitive.addSurface(rightSurface);
        primitive.addSurface(frontSurface);
        primitive.addSurface(backSurface);
        primitive.calculateFacesNormals();
        primitive.setVertexNormalFromFaceNormal();
        let vbo = primitive.getVbo();
        return vbo;
    }

    createBoxBySize(sizeX, sizeY, sizeZ) {
        let semiX = sizeX / 2;
        let semiY = sizeY / 2;
        let semiZ = sizeZ / 2;

        return this.createBox(-semiX, -semiY, -semiZ, semiX, semiY, semiZ);
    }
}