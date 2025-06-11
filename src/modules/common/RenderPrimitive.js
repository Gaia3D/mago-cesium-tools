import * as Cesium from "cesium";

export class RenderPrimitive {
    show = true;

    constructor(context, options) {
        Object.assign(this, options);
        this.context = context;
        this.commandToExecute = this.createCommand(context);
        this.clearCommand = undefined;
        if (this.autoClear) {
            this.clearCommand = new Cesium.ClearCommand({
                color: new Cesium.Color(0.0, 0.0, 0.0, 0.0), depth: 1.0, framebuffer: this.framebuffer, pass: Cesium.Pass.OPAQUE,
            });
        }
    }

    createCommand(context) {
        const vertexArray = Cesium.VertexArray.fromGeometry({
            context: context, geometry: this.geometry, attributeLocations: this.attributeLocations, bufferUsage: Cesium.BufferUsage.STATIC_DRAW,
        });

        const shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context, attributeLocations: this.attributeLocations, vertexShaderSource: this.vertexShaderSource, fragmentShaderSource: this.fragmentShaderSource,
        });

        const renderState = Cesium.RenderState.fromCache(this.rawRenderState);
        return new Cesium.DrawCommand({
            owner: this,
            vertexArray: vertexArray,
            primitiveType: this.primitiveType,
            uniformMap: this.uniformMap,
            modelMatrix: this.modelMatrix,
            shaderProgram: shaderProgram,
            framebuffer: this.framebuffer,
            renderState: renderState,
            pass: Cesium.Pass.OPAQUE,
        });
    }

    update(frameState) {
        if (!this.show) {
            return;
        }

        if (Cesium.defined(this.preExecute)) {
            this.preExecute();
        }

        if (Cesium.defined(this.clearCommand)) {
            frameState.commandList.push(this.clearCommand);
        }
        frameState.commandList.push(this.commandToExecute);
    }

    isDestroyed() {
        return false;
    }

    destroy() {
        if (Cesium.defined(this.commandToExecute)) {
            this.commandToExecute.shaderProgram = this.commandToExecute.shaderProgram && this.commandToExecute.shaderProgram.destroy();
        }
        return Cesium.destroyObject(this);
    }
}