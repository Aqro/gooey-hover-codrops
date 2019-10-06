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

import { _gsScope, globals } from "gsap/TweenLite.js";
import CustomEase from "./CustomEase.js";

_gsScope._gsDefine("easing.CustomBounce", ["easing.CustomEase"], function() {


		var _normalizeX = function (a) { //scales all the x values in an array [x, y, x, y...] AND rounds them to the closest hundredth (decimal)
				var l = a.length,
					s = 1 / a[l - 2],
					rnd = 1000,
					i;
				for (i = 2; i < l; i += 2) {
					a[i] = ((a[i] * s * rnd) | 0) / rnd;
				}
				a[l - 2] = 1; //in case there are any rounding errors. x should always end at 1.
			},

			CustomBounce = function(id, vars) {
				this.vars = vars = vars || {};
				if (vars.squash) {
					this.squash = new CustomEase(vars.squashID || (id + "-squash"));
				}
				CustomEase.call(this, id);
				this.bounce = this;
				this.update(vars);
			},
			p;

		CustomBounce.prototype = p = new CustomEase();
		p.constructor = CustomBounce;

		p.update = function(vars) {
			vars = vars || this.vars;
			var max = 0.999,
				decay = Math.min(max, vars.strength || 0.7),  // Math.min(0.999, 1 - 0.3 / (vars.strength || 1)),
				decayX = decay,
				gap = (vars.squash || 0) / 100,
				originalGap = gap,
				slope = 1 / 0.03,
				w = 0.2,
				h = 1,
				prevX = 0.1,
				path = [0, 0, 0.07, 0, 0.1, 1, 0.1, 1],
				squashPath = [0, 0, 0, 0, 0.1, 0, 0.1, 0],
				cp1, cp2, x, y, i, nextX, squishMagnitude;
			for (i = 0; i < 200; i++) {
				w *= decayX * ((decayX + 1) / 2);
				h *= decay * decay;
				nextX = prevX + w;
				x = prevX + w * 0.49;
				y = 1 - h;
				cp1 = prevX + h / slope;
				cp2 = x + (x - cp1) * 0.8;

				if (gap) {
					prevX += gap;
					cp1 += gap;
					x += gap;
					cp2 += gap;
					nextX += gap;
					squishMagnitude = gap / originalGap;
					squashPath.push(
						prevX - gap, 0,
						prevX - gap, squishMagnitude,
						prevX - gap / 2, squishMagnitude, //center peak anchor
						prevX, squishMagnitude,
						prevX, 0,
						prevX, 0, //base anchor
						prevX, squishMagnitude * -0.6,
						prevX + (nextX - prevX) / 6, 0,
						nextX, 0
					);
					path.push(prevX - gap, 1,
						prevX, 1,
						prevX, 1);
					gap *= decay * decay;
				}

				path.push(prevX, 1,
					cp1, y,
					x, y,
					cp2, y,
					nextX, 1,
					nextX, 1);

				decay *= 0.95;
				slope = h / (nextX - cp2);
				prevX = nextX;
				if (y > max) {
					break;
				}
			}

			if (vars.endAtStart) {
				x = -0.1;
				path.unshift(x, 1, x, 1, -0.07, 0);
				if (originalGap) {
					gap = originalGap * 2.5; //make the initial anticipation squash longer (more realistic)
					x -= gap;
					path.unshift(x, 1, x, 1, x, 1);
					squashPath.splice(0, 6);
					squashPath.unshift(x, 0, x, 0, x, 1, x + gap / 2, 1, x + gap, 1, x + gap, 0, x + gap, 0, x + gap, -0.6, x + gap + 0.033, 0);
					for (i = 0; i < squashPath.length; i+=2) {
						squashPath[i] -= x;
					}
				}
				for (i = 0; i < path.length; i+=2) {
					path[i] -= x;
					path[i+1] = 1 - path[i+1];
				}
			}

			if (gap) {
				_normalizeX(squashPath);
				squashPath[2] = "C" + squashPath[2];
				if (!this.squash) {
					this.squash = new CustomEase(vars.squashID || (this.id + "-squash"));
				}
				this.squash.setData("M" + squashPath.join(","));
			}

			_normalizeX(path);
			path[2] = "C" + path[2];
			return this.setData("M" + path.join(","));
		};

		CustomBounce.create = function(id, vars) {
			return new CustomBounce(id, vars);
		};

		CustomBounce.version = "0.2.1";

		return CustomBounce;

	}, true);


export var CustomBounce = globals.CustomBounce;
export { CustomBounce as default };