#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

uniform sampler2D u_map;
uniform sampler2D u_hovermap;


uniform float u_alpha;
uniform float u_time;
uniform float u_progress;
uniform float u_progressHover;
uniform float u_progressClick;

uniform vec2 u_res;
uniform vec2 u_mouse;
uniform vec2 u_ratio;
uniform vec2 u_hoverratio;

varying vec2 v_uv;

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st - vec2(0.5);
	  return 1. - smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
}

float roundedsquare(in vec2 _st, in float _radius) {
    return (smoothstep(0., _radius, _st.x) - smoothstep(1. - _radius, 1., _st.x)) * (smoothstep(0., _radius, _st.y) - smoothstep(1. - _radius, 1., _st.y));
}


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

  vec2 cpos = st + mouse + vec2(.5);

  float c = circle(cpos, .02 * progressHover + progress * 0.8, 2.);

  float offX = uv.x + sin(uv.y + time * 2.);
  float offY = uv.y - time * .2 - cos(time * 2.) * 0.1;
  float nc = (snoise3(vec3(offX, offY, time * .5) * 8.)) * progressHover;
  float nh = (snoise3(vec3(offX, offY, time * .5 ) * 2.)) * .03;

  uv_h -= vec2(0.5);
  uv_h *= 1. - u_progressHover * 0.1;
  uv_h += vec2(0.5);

  uv_h *= u_hoverratio;

  uv -= vec2(0.5);
  uv *= 1. - u_progressHover * 0.2;
  uv *= u_ratio;
  uv += vec2(0.5);

  vec4 image = texture2D(u_hovermap, uv_h);
  vec4 imageDistorted = texture2D(u_map, uv + vec2(nh) * progressHover);

  float finalMask = smoothstep(.95, 1., pow(c, 2.) * 4. + nc * (1. - progress));

  vec4 finalImage = mix(imageDistorted, image, clamp(finalMask + progress, 0., 1.));

  gl_FragColor = vec4(finalImage.rgb, u_alpha) ;
}
