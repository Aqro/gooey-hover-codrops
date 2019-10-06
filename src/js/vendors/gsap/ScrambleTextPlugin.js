/*!
 * VERSION: 0.5.2
 * DATE: 2018-09-11
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2018, GreenSock. All rights reserved.
 * ScrambleTextPlugin is a Club GreenSock membership benefit; You must have a valid membership to use
 * this code without violating the terms of use. Visit http://greensock.com/club/ to sign up or get more details.
 * This work is subject to the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */

import { _gsScope } from "gsap/TweenLite.js";

var _trimExp = /(^\s+|\s+$)/g,
	_spacesExp = /\s+/g,
	_getText = function(e) {
				var type = e.nodeType,
					result = "";
				if (type === 1 || type === 9 || type === 11) {
					if (typeof(e.textContent) === "string") {
						return e.textContent;
					} else {
						for (e = e.firstChild; e; e = e.nextSibling ) {
							result += _getText(e);
						}
					}
				} else if (type === 3 || type === 4) {
					return e.nodeValue;
				}
				return result;
			},
			_scrambleText = function(length, chars) {
				var l = chars.length,
					s = "";
				while (--length > -1) {
					s += chars[ ((Math.random() * l) | 0) ];
				}
				return s;
			},
			CharSet = function(chars) {
				this.chars = _emojiSafeSplit(chars);
				this.sets = [];
				this.length = 50;
				var i;
				for (i = 0; i < 20; i++) {
					this.sets[i] = _scrambleText(80, this.chars); //we create 20 strings that are 80 characters long, randomly chosen and pack them into an array. We then randomly choose the scrambled text from this array in order to greatly improve efficiency compared to creating new randomized text from scratch each and every time it's needed. This is a simple lookup whereas the other technique requires looping through as many times as there are characters needed, and calling Math.random() each time through the loop, building the string, etc.
				}
				this.grow = function(newLength) { //if we encounter a tween that has more than 80 characters, we'll need to add to the character sets accordingly. Once it's cached, it'll only need to grow again if we exceed that new length. Again, this is an efficiency tactic.
					for (i = 0; i < 20; i++) {
						this.sets[i] += _scrambleText(newLength - this.length, this.chars);
					}
					this.length = newLength;
				};
			},
			_emoji = "[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2694-\u2697]|\uD83E[\uDD10-\uDD5D]|[\uD800-\uDBFF][\uDC00-\uDFFF]",
			_emojiExp = new RegExp(_emoji),
			_emojiAndCharsExp = new RegExp(_emoji + "|.", "g"),
			_emojiSafeSplit = function(text, delimiter, trim) {
				if (trim) {
					text = text.replace(_trimExp, "");
				}
				return ((delimiter === "" || !delimiter) && _emojiExp.test(text)) ? text.match(_emojiAndCharsExp) : text.split(delimiter || "");
			},
			_upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			_lower = _upper.toLowerCase(),
			_charsLookup = {
				upperCase: new CharSet(_upper),
				lowerCase: new CharSet(_lower),
				upperAndLowerCase: new CharSet(_upper + _lower)
			},



			ScrambleTextPlugin = _gsScope._gsDefine.plugin({
				propName: "scrambleText",
				version: "0.5.2",
				API: 2,
				overwriteProps:["scrambleText","text"],

				//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
				init: function(target, value, tween, index) {
					this._prop = ("innerHTML" in target) ? "innerHTML" : ("textContent" in target) ? "textContent" : 0; // SVG text in IE doesn't have innerHTML, but it does have textContent.
					if (!this._prop) {
						return false;
					}
					if (typeof(value) === "function") {
						value = value(index, target);
					}
					this._target = target;
					if (typeof(value) !== "object") {
						value = {text:value};
					}
					var text = value.text || value.value,
						trim = (value.trim !== false),
						delim, maxLength, charset, splitByChars;
					this._delimiter = delim = value.delimiter || "";
					this._original = _emojiSafeSplit(_getText(target).replace(_spacesExp, " ").split("&nbsp;").join(""), delim, trim);
					if (text === "{original}" || text === true || text == null) {
						text = this._original.join(delim);
					}
					this._text = _emojiSafeSplit((text || "").replace(_spacesExp, " "), delim, trim);
					this._hasClass = false;
					if (typeof(value.newClass) === "string") {
						this._newClass = value.newClass;
						this._hasClass = true;
					}
					if (typeof(value.oldClass) === "string") {
						this._oldClass = value.oldClass;
						this._hasClass = true;
					}
					splitByChars = (delim === "");
					this._textHasEmoji = (_emojiExp.test(this._text.join(delim)) && splitByChars);
					this._charsHaveEmoji = !!value.chars && _emojiExp.test(value.chars);
					this._length = splitByChars ? this._original.length : this._original.join(delim).length;
					this._lengthDif = (splitByChars ? this._text.length : this._text.join(delim).length) - this._length;
					this._fillChar = value.fillChar || (value.chars && value.chars.indexOf(" ") !== -1) ? "&nbsp;" : "";
					this._charSet = charset = _charsLookup[(value.chars || "upperCase")] || new CharSet(value.chars);
					this._speed = 0.016 / (value.speed || 1);
					this._prevScrambleTime = 0;
					this._setIndex = (Math.random() * 20) | 0;
					maxLength = this._length + Math.max(this._lengthDif, 0);
					if (maxLength > charset.length) {
						charset.grow(maxLength);
					}
					this._chars = charset.sets[this._setIndex];
					this._revealDelay = value.revealDelay || 0;
					this._tweenLength = (value.tweenLength !== false);
					this._tween = tween;
					this._rightToLeft = !!value.rightToLeft;
					return true;
				},

				//called each time the values should be updated, and the ratio gets passed as the only parameter (typically it's a value between 0 and 1, but it can exceed those when using an ease like Elastic.easeOut or Back.easeOut, etc.)
				set: function(ratio) {
					var l = this._text.length,
						delim = this._delimiter,
						time = this._tween._time,
						timeDif = time - this._prevScrambleTime,
						i, i2, startText, endText, applyNew, applyOld, str, startClass, endClass;
					if (this._revealDelay) {
						if (this._tween.vars.runBackwards) {
							time = this._tween._duration - time; //invert the time for from() tweens
						}
						ratio = (time === 0) ? 0 : (time < this._revealDelay) ? 0.000001 : (time === this._tween._duration) ? 1 : this._tween._ease.getRatio((time - this._revealDelay) / (this._tween._duration - this._revealDelay));
					}
					if (ratio < 0) {
						ratio = 0;
					} else if (ratio > 1) {
						ratio = 1;
					}
					if (this._rightToLeft) {
						ratio = 1 - ratio;
					}
					i = (ratio * l + 0.5) | 0;
					if (ratio) {
						if (timeDif > this._speed || timeDif < -this._speed) {
							this._setIndex = (this._setIndex + ((Math.random() * 19) | 0)) % 20;
							this._chars = this._charSet.sets[this._setIndex];
							this._prevScrambleTime += timeDif;
						}
						endText = this._chars;
					} else {
						endText = this._original.join(delim);
					}

					if (this._rightToLeft) {
						if (ratio === 1 && (this._tween.vars.runBackwards || this._tween.data === "isFromStart")) { //special case for from() tweens
							startText = "";
							endText = this._original.join(delim);
						} else {
							str = this._text.slice(i).join(delim);
							if (this._charsHaveEmoji) {
								startText = _emojiSafeSplit(endText).slice(0, ((this._length + (this._tweenLength ? 1 - (ratio * ratio * ratio) : 1) * this._lengthDif) - ((this._textHasEmoji ? _emojiSafeSplit(str) : str).length) + 0.5) | 0).join("");
							} else {
								startText = endText.substr(0, ((this._length + (this._tweenLength ? 1 - (ratio * ratio * ratio) : 1) * this._lengthDif) - ((this._textHasEmoji ? _emojiSafeSplit(str) : str).length) + 0.5) | 0);
							}
							endText = str;
						}

					} else {
						startText = this._text.slice(0, i).join(delim);
						i2 = (this._textHasEmoji ? _emojiSafeSplit(startText) : startText).length;
						if (this._charsHaveEmoji) {
							endText = _emojiSafeSplit(endText).slice(i2, ((this._length + (this._tweenLength ? 1 - ((ratio = 1 - ratio) * ratio * ratio * ratio) : 1) * this._lengthDif) + 0.5) | 0).join("");
						} else {
							endText = endText.substr(i2, ((this._length + (this._tweenLength ? 1 - ((ratio = 1 - ratio) * ratio * ratio * ratio) : 1) * this._lengthDif) - i2 + 0.5) | 0);
						}
					}

					if (this._hasClass) {
						startClass = this._rightToLeft ? this._oldClass : this._newClass;
						endClass = this._rightToLeft ? this._newClass : this._oldClass;
						applyNew = (startClass && i !== 0);
						applyOld = (endClass && i !== l);
						str = (applyNew ? "<span class='" + startClass + "'>" : "") + startText + (applyNew ? "</span>" : "") + (applyOld ? "<span class='" + endClass + "'>" : "") + delim + endText + (applyOld ? "</span>" : "");
					} else {
						str = startText + delim + endText;
					}
					this._target[this._prop] = (this._fillChar === "&nbsp;" && str.indexOf("  ") !== -1) ? str.split("  ").join("&nbsp;&nbsp;") : str;
				}

			}),
			p = ScrambleTextPlugin.prototype;

		p._newClass = p._oldClass = "";
		for (p in _charsLookup) {
			_charsLookup[p.toLowerCase()] = _charsLookup[p];
			_charsLookup[p.toUpperCase()] = _charsLookup[p];
		}


export { ScrambleTextPlugin, ScrambleTextPlugin as default };