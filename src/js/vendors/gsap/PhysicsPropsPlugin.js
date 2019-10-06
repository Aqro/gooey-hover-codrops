/*!
 * VERSION: 0.2.1
 * DATE: 2018-05-30
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2018, GreenSock. All rights reserved.
 * PhysicsPropsPlugin is a Club GreenSock membership benefit; You must have a valid membership to use
 * this code without violating the terms of use. Visit http://greensock.com/club/ to sign up or get more details.
 * This work is subject to the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */

import { _gsScope } from "gsap/TweenLite.js";

var PhysicsProp = function(target, p, velocity, acceleration, friction, stepsPerTimeUnit) {
				this.p = p;
				this.f = (typeof(target[p]) === "function");
				this.start = this.value = (!this.f) ? parseFloat(target[p]) : target[ ((p.indexOf("set") || typeof(target["get" + p.substr(3)]) !== "function") ? p : "get" + p.substr(3)) ]();
				this.velocity = velocity || 0;
				this.v = this.velocity / stepsPerTimeUnit;
				if (acceleration || acceleration == 0) {
					this.acceleration = acceleration;
					this.a = this.acceleration / (stepsPerTimeUnit * stepsPerTimeUnit);
				} else {
					this.acceleration = this.a = 0;
				}
				this.friction = 1 - (friction || 0) ;
			},
			_random = Math.random(),
			_globals = _gsScope._gsDefine.globals,
			_rootFramesTimeline = _globals.com.greensock.core.Animation._rootFramesTimeline,

			PhysicsPropsPlugin = _gsScope._gsDefine.plugin({
				propName: "physicsProps",
				version: "0.2.1",
				API: 2,

				//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
				init: function(target, value, tween, index) {
					if (typeof(value) === "function") {
						value = value(target);
					}
					this._target = target;
					this._tween = tween;
					this._runBackwards = (tween.vars.runBackwards === true);
					this._step = 0;
					var tl = tween._timeline,
						cnt = 0,
						p, curProp;
					while (tl._timeline) {
						tl = tl._timeline;
					}
					this._stepsPerTimeUnit = (tl === _rootFramesTimeline) ? 1 : 30;
					this._props = [];
					for (p in value) {
						curProp = value[p];
						if (typeof(curProp) === "function") {
							curProp = curProp(index, target);
						}
						if (curProp.velocity || curProp.acceleration) {
							this._props[cnt++] = new PhysicsProp(target, p, curProp.velocity, curProp.acceleration, curProp.friction, this._stepsPerTimeUnit);
							this._overwriteProps[cnt] = p;
							if (curProp.friction) {
								this._hasFriction = true;
							}
						}
					}
					return true;
				},

				//called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
				set: function(ratio) {
					var i = this._props.length,
						time = this._tween._time,
						target = this._target,
						curProp, val, steps, remainder, j, tt;
					if (this._runBackwards) {
						time = this._tween._duration - time;
					}
					if (this._hasFriction) {
						time *= this._stepsPerTimeUnit;
						steps = (time | 0) - this._step;
						remainder = time % 1;
						if (steps >= 0) { 	//going forward
							while (--i > -1) {
								curProp = this._props[i];
								j = steps;
								while (--j > -1) {
									curProp.v += curProp.a;
									curProp.v *= curProp.friction;
									curProp.value += curProp.v;
								}
								val = curProp.value + (curProp.v * remainder);
								if (curProp.m) {
									val = curProp.m(val, target);
								}
								if (curProp.f) {
									target[curProp.p](val);
								} else {
									target[curProp.p] = val;
								}
							}

						} else { 			//going backwards
							while (--i > -1) {
								curProp = this._props[i];
								j = -steps;
								while (--j > -1) {
									curProp.value -= curProp.v;
									curProp.v /= curProp.friction;
									curProp.v -= curProp.a;
								}
								val = curProp.value + (curProp.v * remainder);
								if (curProp.m) {
									val = curProp.m(val, target);
								}
								if (curProp.f) {
									target[curProp.p](val);
								} else {
									target[curProp.p] = val;
								}
							}
						}
						this._step += steps;

					} else {
						tt = time * time * 0.5;
						while (--i > -1) {
							curProp = this._props[i];
							val = curProp.start + ((curProp.velocity * time) + (curProp.acceleration * tt));
							if (curProp.m) {
								val = curProp.m(val, target);
							}
							if (curProp.f) {
								target[curProp.p](val);
							} else {
								target[curProp.p] = val;
							}
						}
					}
				}

			}),
			p = PhysicsPropsPlugin.prototype;

		p._kill = function(lookup) {
			var i = this._props.length;
			while (--i > -1) {
				if (this._props[i].p in lookup) {
					this._props.splice(i, 1);
				}
			}
			return this._super._kill.call(this, lookup);
		};

		p._mod = function(lookup) {
			var i = this._props.length,
				val;
			while (--i > -1) {
				val = lookup[this._props[i].p] || lookup.physicsProps;
				if (typeof(val) === "function") {
					this._props[i].m = val;
				}
			}
		};

		PhysicsPropsPlugin._autoCSS = true; //indicates that this plugin can be inserted into the "css" object using the autoCSS feature of TweenLite
		PhysicsPropsPlugin._cssRegister = function() {
			var CSSPlugin = _globals.CSSPlugin;
			if (!CSSPlugin) {
				return;
			}
			var _internals = CSSPlugin._internals,
				_parseToProxy = _internals._parseToProxy,
				_setPluginRatio = _internals._setPluginRatio,
				CSSPropTween = _internals.CSSPropTween;
			_internals._registerComplexSpecialProp("physicsProps", {parser:function(t, e, prop, cssp, pt, plugin) {
				plugin = new PhysicsPropsPlugin();
				var vars = {},
					p, data;
				if (e.scale) {
					e.scaleX = e.scaleY = e.scale;
					delete e.scale;
				}
				for (p in e) {
					vars[p] = _random++; //doesn't really matter what values we put here because the plugin will determine end values, but it'd be best of the values don't match the current ones so that CSSPlugin doesn't skip creating a CSSPropTween.
				}
				data = _parseToProxy(t, vars, cssp, pt, plugin);
				pt = new CSSPropTween(t, "physicsProps", 0, 0, data.pt, 2);
				pt.data = data;
				pt.plugin = plugin;
				pt.setRatio = _setPluginRatio;
				plugin._onInitTween(data.proxy, e, cssp._tween);
				return pt;
			}});
		};

export { PhysicsPropsPlugin, PhysicsPropsPlugin as default };