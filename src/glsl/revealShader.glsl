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

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st;
	  return 1. - smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
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

  float shape = (uv.x + uv.y - 2. + progressHover * 2.7 + progress * 2.7) * 2.;
  float offX = uv.x + uv.y;
  float offY = uv.y - uv.x;
  float n = snoise3(vec3(offX, offY, time) * 8.) * .5;

  float grd = 0.1 * progressHover;

  float sqr = 100. * ((smoothstep(0., grd, uv.x) - smoothstep(1. - grd, 1., uv.x)) * (smoothstep(0., grd, uv.y) - smoothstep(1. - grd, 1., uv.y))) - 10.;

  uv_h -= vec2(0.5);
  uv_h *= 1. - progressHover * 0.1;
  uv_h += vec2(0.5);

  uv_h *= u_hoverratio;

  uv -= vec2(0.5);
  uv *= 1. - progressHover * 0.2;
  uv *= u_ratio;
  uv += vec2(0.5);

  vec2 cpos = st + mouse;

  float c = circle(cpos, .04 * progressHover + progress * 0.8, 2.) * 50.;

  vec4 image = texture2D(u_map, uv);
  vec4 hover = texture2D(u_hovermap, uv_h + mouse * 0.1 * progressHover);

  float pct = smoothstep(.99, 1., n + shape);

  float finalMask = smoothstep(.0, .1, sqr - c);

  vec4 finalImage = mix(image, hover, pct);

  gl_FragColor = vec4(finalImage.rgb, u_alpha * finalMask) ;
}
