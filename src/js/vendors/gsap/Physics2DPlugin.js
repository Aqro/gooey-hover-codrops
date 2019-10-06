/*!
 * VERSION: 0.2.1
 * DATE: 2018-05-30
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2018, GreenSock. All rights reserved.
 * Physics2DPlugin is a Club GreenSock membership benefit; You must have a valid membership to use
 * this code without violating the terms of use. Visit http://greensock.com/club/ to sign up or get more details.
 * This work is subject to the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */

import { _gsScope } from "gsap/TweenLite.js";

var _DEG2RAD = Math.PI / 180,
			Physics2DProp = function(target, p, velocity, acceleration, stepsPerTimeUnit) {
				this.p = p;
				this.f = (typeof(target[p]) === "function");
				this.start = this.value = (!this.f) ? parseFloat(target[p]) : target[ ((p.indexOf("set") || typeof(target["get" + p.substr(3)]) !== "function") ? p : "get" + p.substr(3)) ]();
				this.velocity = velocity || 0;
				this.v = this.velocity / stepsPerTimeUnit;
				if (acceleration || acceleration === 0) {
					this.acceleration = acceleration;
					this.a = this.acceleration / (stepsPerTimeUnit * stepsPerTimeUnit);
				} else {
					this.acceleration = this.a = 0;
				}
			},
			_random = Math.random(),
			_globals = _gsScope._gsDefine.globals,
			_rootFramesTimeline = _globals.com.greensock.core.Animation._rootFramesTimeline,

			Physics2DPlugin = _gsScope._gsDefine.plugin({
				propName: "physics2D",
				version: "0.2.1",
				API: 2,

				//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
				init: function(target, value, tween, index) {
					if (typeof(value) === "function") {
						value = value(index, target);
					}
					this._target = target;
					this._tween = tween;
					this._runBackwards = (tween.vars.runBackwards === true);
					this._step = 0;
					var tl = tween._timeline,
						angle = Number(value.angle) || 0,
						velocity = Number(value.velocity) || 0,
						acceleration = Number(value.acceleration) || 0,
						xProp = value.xProp || "x",
						yProp = value.yProp || "y",
						aAngle = (value.accelerationAngle || value.accelerationAngle === 0) ? Number(value.accelerationAngle) : angle,
						stepsPerTimeUnit;
					while (tl._timeline) {
						tl = tl._timeline;
					}
					this._stepsPerTimeUnit = stepsPerTimeUnit = (tl === _rootFramesTimeline) ? 1 : 30;
					if (value.gravity) {
						acceleration = Number(value.gravity);
						aAngle = 90;
					}
					angle *= _DEG2RAD;
					aAngle *= _DEG2RAD;
					this._friction = 1 - Number(value.friction || 0);
					this._overwriteProps.push(xProp);
					this._overwriteProps.push(yProp);

					this._x = new Physics2DProp(target, xProp, Math.cos(angle) * velocity, Math.cos(aAngle) * acceleration, stepsPerTimeUnit);
					this._y = new Physics2DProp(target, yProp, Math.sin(angle) * velocity, Math.sin(aAngle) * acceleration, stepsPerTimeUnit);
					this._skipX = this._skipY = false;
					return true;
				},

				//called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
				set: function(ratio) {
					var time = this._tween._time,
						xp = this._x,
						yp = this._y,
						x, y, tt, steps, remainder, i;
					if (this._runBackwards === true) {
						time = this._tween._duration - time;
					}
					if (this._friction === 1) {
						tt = time * time * 0.5;
						x = xp.start + ((xp.velocity * time) + (xp.acceleration * tt));
						y = yp.start + ((yp.velocity * time) + (yp.acceleration * tt));
					} else {
						time *= this._stepsPerTimeUnit;
						steps = i = (time | 0) - this._step;
						remainder = (time % 1);
						if (i >= 0) { 	//going forward
							while (--i > -1) {
								xp.v += xp.a;
								yp.v += yp.a;
								xp.v *= this._friction;
								yp.v *= this._friction;
								xp.value += xp.v;
								yp.value += yp.v;
							}

						} else { 		//going backwards
							i = -i;
							while (--i > -1) {
								xp.value -= xp.v;
								yp.value -= yp.v;
								xp.v /= this._friction;
								yp.v /= this._friction;
								xp.v -= xp.a;
								yp.v -= yp.a;
							}
						}
						x = xp.value + (xp.v * remainder);
						y = yp.value + (yp.v * remainder);
						this._step += steps;
					}
					if (!this._skipX) {
						if (xp.m) {
							x = xp.m(x, this._target);
						}
						if (xp.f) {
							this._target[xp.p](x);
						} else {
							this._target[xp.p] = x;
						}
					}
					if (!this._skipY) {
						if (yp.m) {
							y = yp.m(y, this._target);
						}
						if (yp.f) {
							this._target[yp.p](y);
						} else {
							this._target[yp.p] = y;
						}
					}
				}

			}),
			p = Physics2DPlugin.prototype;

		p._kill = function(lookup) {
			if (lookup[this._x.p] != null) {
				this._skipX = true;
			}
			if (lookup[this._y.p] != null) {
				this._skipY = true;
			}
			return this._super._kill.call(this, lookup);
		};

		p._mod = function(lookup) {
			var val = lookup[this._x.p] || lookup.physics2D;
			if (val && typeof(val) === "function") {
				this._x.m = val;
			}
			val = lookup[this._y.p] || lookup.physics2D;
			if (val && typeof(val) === "function") {
				this._y.m = val;
			}
		};

		Physics2DPlugin._autoCSS = true; //indicates that this plugin can be inserted into the "css" object using the autoCSS feature of TweenLite
		Physics2DPlugin._cssRegister = function() {
			var CSSPlugin = _globals.CSSPlugin;
			if (!CSSPlugin) {
				return;
			}
			var _internals = CSSPlugin._internals,
				_parseToProxy = _internals._parseToProxy,
				_setPluginRatio = _internals._setPluginRatio,
				CSSPropTween = _internals.CSSPropTween;
			_internals._registerComplexSpecialProp("physics2D", {parser:function(t, e, prop, cssp, pt, plugin) {
				plugin = new Physics2DPlugin();
				var xProp = e.xProp || "x",
					yProp = e.yProp || "y",
					vars = {},
					data;
				vars[xProp] = vars[yProp] = _random++; //doesn't really matter what values we put here because the plugin will determine end values, but it'd be best of the values don't match the current ones so that CSSPlugin doesn't skip creating a CSSPropTween.
				data = _parseToProxy(t, vars, cssp, pt, plugin);
				pt = new CSSPropTween(t, "physics2D", 0, 0, data.pt, 2);
				pt.data = data;
				pt.plugin = plugin;
				pt.setRatio = _setPluginRatio;
				plugin._onInitTween(data.proxy, e, cssp._tween);
				return pt;
			}});
		};

export { Physics2DPlugin, Physics2DPlugin as default };