#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

uniform sampler2D u_map;
uniform sampler2D u_hovermap;

uniform float u_time;
uniform float u_alpha;


uniform vec2 u_res;
uniform vec2 u_ratio;
uniform vec2 u_hoverratio;
uniform vec2 u_mouse;
uniform float u_progressHover;
uniform float u_progressClick;

varying vec2 v_uv;


void main() {
  vec2 resolution = u_res * PR;
  vec2 uv = v_uv;
  vec2 uv_h = v_uv;
  float time = u_time * 0.05;
  float progress = u_progressClick;
  float progressHover = u_progressHover;

  float shape = (uv.x + uv.y - 2. + progressHover * 2.7 + progress * 2.7) * 2.;
  float offX = uv.x + uv.y;
  float offY = uv.y - uv.x;
  float n = snoise3(vec3(offX, offY, time) * 8.) * .5;

  uv_h -= vec2(0.5);
  uv_h *= 1. - progressHover * 0.1;
  uv_h += vec2(0.5);

  uv_h *= u_hoverratio;

  uv -= vec2(0.5);
  uv *= 1. - progressHover * 0.2;
  uv *= u_ratio;
  uv += vec2(0.5);

  vec4 image = texture2D(u_map, uv);
  vec4 hover = texture2D(u_hovermap, uv_h);

  float pct = smoothstep(.99, 1., n + shape);

  vec4 finalImage = mix(image, hover, pct);

  gl_FragColor = vec4(finalImage.rgb, u_alpha) ;
}
