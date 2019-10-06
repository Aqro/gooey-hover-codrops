/*!
 * VERSION: 0.2.1
 * DATE: 2018-08-27
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2018, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 *
 * @author: Jack Doyle, jack@greensock.com
 **/

import { _gsScope, globals, Ease } from "gsap/TweenLite.js";
import CustomEase from "./CustomEase.js";

_gsScope._gsDefine("easing.CustomWiggle", ["easing.CustomEase", "easing.Ease"], function() {


		var eases = {
				easeOut: new CustomEase("", "M0,1,C0.7,1,0.6,0,1,0"),
				easeInOut: new CustomEase("", "M0,0,C0.104,0,0.242,1,0.444,1,0.644,1,0.608,0,1,0"),
				anticipate: new CustomEase("", "M0,0,C0,0.222,0.024,0.386,0.06,0.402,0.181,0.455,0.647,0.646,0.7,0.67,0.9,0.76,1,0.846,1,1"),
				uniform: new CustomEase("", "M0,0,C0,0.95,0.01,1,0.01,1,0.01,1,1,1,1,1,1,1,1,0.01,1,0")
			},
			_linearEase = new CustomEase(), //linear
			_parseEase = function(ease, invertNonCustomEases) {
				ease = ease.getRatio ? ease : Ease.map[ease] || new CustomEase("", ease);
				return (ease.rawBezier || !invertNonCustomEases) ? ease : {getRatio:function(n) { return 1 - ease.getRatio(n); }};
			},


			CustomWiggle = function(id, vars) {
				this.vars = vars || {};
				CustomEase.call(this, id);
				this.update(this.vars);
			},
			p;

		CustomWiggle.prototype = p = new CustomEase();
		p.constructor = CustomWiggle;

		p.update = function(vars) {
			vars = vars || this.vars;
			var wiggles = (vars.wiggles || 10) | 0,
				inc = 1 / wiggles,
				x = inc / 2,
				anticipate = (vars.type === "anticipate"),
				yEase = eases[vars.type] || eases.easeOut,
				xEase = _linearEase,
				rnd = 1000,
				nextX, nextY, angle, handleX, handleY, easedX, y, path, i;
			if (anticipate) { //the anticipate ease is actually applied on the x-axis (timing) and uses easeOut for amplitude.
				xEase = yEase;
				yEase = eases.easeOut;
			}
			if (vars.timingEase) {
				xEase = _parseEase(vars.timingEase);
			}
			if (vars.amplitudeEase) {
				yEase = _parseEase(vars.amplitudeEase, true);
			}
			easedX = xEase.getRatio(x);
			y = anticipate ? -yEase.getRatio(x) : yEase.getRatio(x);
			path = [0, 0, easedX / 4, 0, easedX / 2, y, easedX, y];

			if (vars.type === "random") { //if we just select random values on the y-axis and plug them into the "normal" algorithm, since the control points are always straight horizontal, it creates a bit of a slowdown at each anchor which just didn't seem as desirable, so we switched to an algorithm that bends the control points to be more in line with their context.
				path.length = 4;
				nextX = xEase.getRatio(inc);
				nextY = Math.random() * 2 - 1;
				for (i = 2; i < wiggles; i++) {
					x = nextX;
					y = nextY;
					nextX = xEase.getRatio(inc * i);
					nextY = Math.random() * 2 - 1;
					angle = Math.atan2(nextY - path[path.length - 3], nextX - path[path.length - 4]);
					handleX = Math.cos(angle) * inc;
					handleY = Math.sin(angle) * inc;
					path.push(x - handleX, y - handleY, x, y, x + handleX, y + handleY);
				}
				path.push(nextX, 0, 1, 0);
			} else {
				for (i = 1; i < wiggles; i++) {
					path.push(xEase.getRatio(x + inc / 2), y);
					x += inc;
					y = ((y > 0) ? -1 : 1) * (yEase.getRatio(i * inc));
					easedX = xEase.getRatio(x);
					path.push(xEase.getRatio(x - inc / 2), y, easedX, y);
				}
				path.push(xEase.getRatio(x + inc / 4), y, xEase.getRatio(x + inc / 4), 0, 1, 0);
			}
			i = path.length;
			while (--i > -1) {
				path[i] = ((path[i] * rnd) | 0) / rnd; //round values to avoid odd strings for super tiny values
			}
			path[2] = "C" + path[2];
			this.setData("M" + path.join(","));
		};

		CustomWiggle.create = function (id, vars) {
			return new CustomWiggle(id, vars);
		};

		CustomWiggle.version = "0.2.1";
		CustomWiggle.eases = eases;

		return CustomWiggle;

	}, true);


export var CustomWiggle = globals.CustomWiggle;
export { CustomWiggle as default };