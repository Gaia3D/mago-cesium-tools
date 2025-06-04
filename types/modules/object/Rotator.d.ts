export class Rotator {
    constructor(viewer: any, handler?: {});
    viewer: any;
    scene: any;
    handler: {};
    flag: boolean;
    on: (currentPickedObject: any) => void;
    off: () => void;
}
