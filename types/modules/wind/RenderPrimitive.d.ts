export class RenderPrimitive {
    constructor(context: any, options: any);
    show: boolean;
    context: any;
    commandToExecute: any;
    clearCommand: any;
    createCommand(context: any): any;
    update(frameState: any): void;
    isDestroyed(): boolean;
    destroy(): void;
}
