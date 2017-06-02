import utility from './tools/utility.js';
import Camera from './camera/camera.js';

import Path from './object/object-path.js';
import Shaders from './shaders/default.js';

class WebGl {
    constructor(dom, config) {
        let Dom = document.getElementById(dom);
        let DomSty = getComputedStyle(Dom);

        let canvas = document.createElement('canvas');
        // console.log(DomSty.height)
        canvas.height = parseInt(DomSty.height);
        canvas.width = parseInt(DomSty.width);
        Dom.appendChild(canvas);

        // init renderlist
        let renderList = this.renderList = [];

        // init webgl context
        let gl = this.gl = utility.getWebGLContext(canvas);
        gl.buffers = utility.BufferManage;

        // init shader
        utility.initShaders(gl, Shaders.VSHADER_SOURCE, Shaders.FSHADER_SOURCE);

        // init camera 
        this.camera = new Camera(this.gl);

        // open depth test and set clear color
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 1.0);

        // auto draw
        (function draw() {
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            for (let i in renderList) {
                renderList[i].render();
            }
            requestAnimationFrame(draw);
        })();
    }
}

// inject objects
let objects = [{
    name: 'Path',
    path: 'object-path.js'
}, {
    name: 'Belt',
    path: 'object-belt.js'
}];

objects.forEach(object => {
    WebGl.prototype[object.name] = function (obj) {
        const objClass = require(`./object/${object.path}`).default;
        let objInstance = new objClass(this, obj);
        this.renderList.push(objInstance);
        return objInstance; 
    }
});

export default WebGl;