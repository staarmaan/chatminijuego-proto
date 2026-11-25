import Phaser from 'phaser';

export const OUTLINE_NODE = 'FilterPixelOutline';

const outlineFrag = `\
#pragma phaserTemplate(shaderName)
#pragma phaserTemplate(fragmentDefine)
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define highmedp highp
#else
#define highmedp mediump
#endif
precision highmedp float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

uniform vec2 texSize;
uniform float thickness;
uniform vec3 outlineColor;

#pragma phaserTemplate(fragmentHeader)

void main() {
    vec4 front = boundedSampler(uMainSampler, outTexCoord);
    vec2 px = vec2(thickness) / texSize;

    float a = 0.0;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            if (x != 0 || y != 0) {
                vec2 off = vec2(float(x), float(y)) * px;
                a = max(a, boundedSampler(uMainSampler, outTexCoord + off).a);
            }
        }
    }

    vec3 rgb = front.rgb + outlineColor * (1.0 - front.a) * a;
    gl_FragColor = vec4(rgb, max(front.a, a));
}
`;

class OutlineNode extends Phaser.Renderer.WebGL.RenderNodes.BaseFilterShader {
    constructor(manager: any) {
        super(OUTLINE_NODE, manager, null, outlineFrag);
    }

    setupUniforms(controller: any, drawingContext: any): void {
        const pm = (this as any).programManager;
        pm.setUniform('thickness', controller.thickness);
        pm.setUniform('outlineColor', [controller.r, controller.g, controller.b]);
        pm.setUniform('texSize', [drawingContext.width, drawingContext.height]);
    }
}

export class OutlineController extends Phaser.Filters.Controller {
    thickness: number;
    r = 1;
    g = 1;
    b = 1;

    constructor(camera: Phaser.Cameras.Scene2D.Camera, thickness = 1, color = 0xffffff) {
        super(camera, OUTLINE_NODE);
        this.thickness = thickness;
        this.setColor(color);
        this.setPaddingOverride(null);
    }

    setColor(hex: number): this {
        const c = Phaser.Display.Color.IntegerToRGB(hex);
        this.r = c.r / 255;
        this.g = c.g / 255;
        this.b = c.b / 255;
        return this;
    }

    // Grow the texture so the outline isn't clipped at the sprite's edges
    getPadding(): any {
        const self = this as any;
        const o = self.paddingOverride;
        if (o) {
            self.currentPadding.setTo(o.x, o.y, o.width, o.height);
            return o;
        }
        const p = self.currentPadding;
        const d = Math.ceil(this.thickness);
        p.left = -d; p.top = -d; p.right = d; p.bottom = d;
        return p;
    }
}

// Call once, after the game has booted (e.g. in your first scene's create)
export function registerOutlineFilter(game: Phaser.Game): void {
    const nodes = (game.renderer as any).renderNodes;
    if (!nodes.hasNode(OUTLINE_NODE)) {
        nodes.addNodeConstructor(OUTLINE_NODE, OutlineNode);
    }
}
