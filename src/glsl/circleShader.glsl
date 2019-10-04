#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

uniform sampler2D u_map;

uniform float u_time;
uniform float u_progress;
uniform float u_progressHover;
uniform float u_progressLoading;

uniform vec2 u_res;
uniform vec2 u_mouse;

varying vec2 v_uv;

float circle(in vec2 _st, in float _radius, in float blurriness){
    vec2 dist = _st - vec2(0.5);
	  return 1. - smoothstep(_radius-(_radius*blurriness), _radius+(_radius*blurriness), dot(dist,dist)*4.0);
}

float roundedsquare(in vec2 _st, in float _radius) {
    return (smoothstep(0., _radius, _st.x) - smoothstep(1. - _radius, 1., _st.x)) * (smoothstep(0., _radius, _st.y) - smoothstep(1. - _radius, 1., _st.y));
}


void main() {
  float maxSide = normalize(min(u_res.x, u_res.y));
  vec2 resolution = u_res * 2.;
  float time = u_time * 0.05;

  float progressHover = u_progressHover;

  vec2 st = gl_FragCoord.xy / resolution.xy - vec2(.5);
  st.y *= resolution.y / resolution.x;

  vec2 mouse = u_mouse * 0.5;
  mouse *= -1.;
  mouse.y *= resolution.y / resolution.x;

  vec2 uv = v_uv;

  float borders = 0.04 * u_progressLoading;
  float sqr = roundedsquare(uv, borders) * 5.;

  float c = circle(st + mouse + vec2(0.5), .02 * progressHover, 0.8) * 5. + 0.1;
  float offX = uv.x + sin(uv.y + time * 2.);
  float offY = uv.y - time * .2 - cos(time * 2.) * 0.1;
  float n = (snoise3(vec3(offX, offY, time * 0.5) * 2.) * 2. - 2.) * u_progressLoading;

  float borderMask = n + sqr;
  vec4 image = texture2D(u_map, uv);
  vec4 imageDistorted = texture2D(u_map, uv + vec2(n * 0.03) * 0.5) - 0.15 * progressHover;

  float finalborderMask = 1. - smoothstep(.5, 1., clamp(borderMask * 6. - c, 0., 1.));

  vec4 finalCursor = mix(image, vec4(0.), 1. - smoothstep(-.8, -.2, c - borderMask));

  vec4 finalImage = mix(imageDistorted, finalCursor, smoothstep(-.1, .1, c - borderMask));

  gl_FragColor = mix(finalImage, vec4(0.), finalborderMask);
}
