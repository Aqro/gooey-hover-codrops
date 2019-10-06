#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

uniform sampler2D u_map;
uniform sampler2D u_hovermap;
uniform sampler2D u_shape;

uniform float u_time;
uniform float u_alpha;


uniform vec2 u_res;
uniform vec2 u_ratio;
uniform vec2 u_hoverratio;
uniform vec2 u_mouse;
uniform float u_progressHover;
uniform float u_progressClick;

varying vec2 v_uv;

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st-vec2(0.5);
	  return 1.-smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
}


void main() {
  vec2 resolution = u_res * PR;
  vec2 uv = v_uv;
  vec2 uv_h = v_uv;
  float time = u_time * 0.05;
  float progress = u_progressClick;
  float progressHover = u_progressHover;

  vec2 st = gl_FragCoord.xy / resolution.xy - vec2(.5);
  st.y *= resolution.y / resolution.x;

  vec2 mouse = vec2((u_mouse.x / u_res.x) * 2. - 1.,-(u_mouse.y / u_res.y) * 2. + 1.) * -.5;
  mouse.y *= resolution.y / resolution.x;

  uv -= vec2(0.5);
  uv *= u_ratio;
  uv += vec2(0.5);

  vec2 shapeUv = (st + mouse) * PR * 2.;
  shapeUv *= 1.5 - (progressHover + progress) * 0.8;
  shapeUv /= progressHover;
  shapeUv += vec2(.5);

  vec4 shape = texture2D(u_shape, shapeUv);

  float s = (shape.r) * 3. * (1. - progress);
  float offX = uv.x + time;
  float offY = uv.y + time * .2 + cos(time * 2.);
  float n = snoise3(vec3(offX, offY, time) * 5.) + 2.;

  uv_h -= vec2(0.5);
  uv_h *= u_hoverratio;
  uv_h += vec2(0.5);


  vec4 image = texture2D(u_map, uv);
  vec4 hover = texture2D(u_hovermap, uv_h);

  float pct = smoothstep(.99, 1., clamp(n - s, 0., 1.) + progress);

  vec4 finalImage = mix(image, hover, pct);

  gl_FragColor = vec4(finalImage.rgb, u_alpha) ;
  // gl_FragColor = vec4(vec3(pct), 1.);
}
