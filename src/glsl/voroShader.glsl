#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

#pragma glslify: worley3D = require(glsl-worley/worley3D.glsl)

uniform sampler2D u_map;
uniform sampler2D u_hovermap;


uniform float u_alpha;
uniform float u_time;
uniform float u_progressHover;
uniform float u_progressClick;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec2 u_ratio;
uniform vec2 u_hoverratio;

varying vec2 v_uv;



void main() {
  vec2 resolution = u_res * PR;
  float time = u_time * 0.05;
  float progress = u_progressClick;
  float progressHover = u_progressHover;
  vec2 uv = v_uv;
  vec2 uv_h = v_uv;


  vec2 st = gl_FragCoord.xy / resolution.xy - vec2(.5);
  st.y *= resolution.y / resolution.x;

  vec2 mouse = vec2((u_mouse.x / u_res.x) * 2. - 1.,-(u_mouse.y / u_res.y) * 2. + 1.) * -.5;
  mouse.y *= resolution.y / resolution.x;

  uv_h -= vec2(0.5);
  // uv_h *= 1. - u_progressHover * 0.1;
  uv_h *= u_hoverratio;
  uv_h += vec2(0.5);


  uv -= vec2(0.5);
  // uv *= 1. - u_progressHover * 0.2;
  uv *= u_ratio;
  uv += vec2(0.5);

  float n = snoise3(vec3(uv.x, uv.y, time) * 5.) * 2.;
  // float r = pow(n.r, 4.);

  vec2 F = worley3D(vec3(uv.x, uv.y, progressHover * .1) * 5., 2., false) * 2.;
  float F1 = F.x;
  float F2 = F.y;

  float r = clamp(pow(F2 - F1, 4.), 0., 1.) - 1. + progressHover + progress;

  vec4 image = texture2D(u_map, uv);
  vec4 hover = texture2D(u_hovermap, uv_h);

  vec4 finalImage = mix(image, hover, r);

  gl_FragColor = vec4(finalImage.rgb, u_alpha);
  // gl_FragColor = vec4(vec3(r), u_alpha);
}
