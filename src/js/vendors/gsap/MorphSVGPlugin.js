/*!
 * VERSION: 0.8.11
 * DATE: 2018-05-30
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2018, GreenSock. All rights reserved.
 * MorphSVGPlugin is a Club GreenSock membership benefit; You must have a valid membership to use
 * this code without violating the terms of use. Visit http://greensock.com/club/ to sign up or get more details.
 * This work is subject to the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */

import { _gsScope } from "gsap/TweenLite.js";

var _DEG2RAD = Math.PI / 180,
		_RAD2DEG = 180 / Math.PI,
		_svgPathExp = /[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,
		_numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,
		_selectorExp = /(^[#\.][a-z]|[a-y][a-z])/gi,
		_commands = /[achlmqstvz]/ig,
		_scientific = /[\+\-]?\d*\.?\d+e[\+\-]?\d+/ig,
		//_attrExp = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/gi, //finds all the attribute name/value pairs in an HTML element
		//_outerTagExp = /^<([A-Za-z0-9_\-]+)((?:\s+[A-Za-z0-9_\-]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/i, //takes the outerHTML and pulls out [0] - the first tag, [1] - the tag name, and [2] - the attribute name/value pairs (space-delimited)
		//_wrappingQuotesExp = /^["']|["']$/g,
		TweenLite = _gsScope._gsDefine.globals.TweenLite,
		//_nonNumbersExp = /(?:([\-+](?!(\d|=)))|[^\d\-+=e]|(e(?![\-+][\d])))+/ig,

		_log = function(message) {
			if (_gsScope.console) {
				console.log(message);
			}
		},

		// translates an arc into a normalized array of cubic beziers excluding the starting x/y. The circle the arc follows will be centered at 0,0 and have a radius of 1 (hence normalized). Each bezier covers no more than 90 degrees; the arc will be divided evenly into a maximum of four curves.
		_normalizedArcToBeziers = function(angleStart, angleExtent) {
			var segments = Math.ceil(Math.abs(angleExtent) / 90),
				l = 0,
				a = [],
				angleIncrement, controlLength, angle, dx, dy, i;
			angleStart *= _DEG2RAD;
			angleExtent *= _DEG2RAD;
			angleIncrement = angleExtent / segments;
			controlLength = 4 / 3 * Math.sin(angleIncrement / 2) / (1 + Math.cos(angleIncrement / 2));
			for (i = 0; i < segments; i++) {
				angle = angleStart + i * angleIncrement;
				dx = Math.cos(angle);
				dy = Math.sin(angle);
				a[l++] = dx - controlLength * dy;
				a[l++] = dy + controlLength * dx;
				angle += angleIncrement;
				dx = Math.cos(angle);
				dy = Math.sin(angle);
				a[l++] = dx + controlLength * dy;
				a[l++] = dy - controlLength * dx;
				a[l++] = dx;
				a[l++] = dy;
			}
			return a;
		},

		// translates SVG arc data into an array of cubic beziers
		_arcToBeziers = function(lastX, lastY, rx, ry, angle, largeArcFlag, sweepFlag, x, y) {
			if (lastX === x && lastY === y) {
				return;
			}
			rx = Math.abs(rx);
			ry = Math.abs(ry);
			var angleRad = (angle % 360) * _DEG2RAD,
				cosAngle = Math.cos(angleRad),
				sinAngle = Math.sin(angleRad),
				dx2 = (lastX - x) / 2,
				dy2 = (lastY - y) / 2,
				x1 = (cosAngle * dx2 + sinAngle * dy2),
				y1 = (-sinAngle * dx2 + cosAngle * dy2),
				rx_sq = rx * rx,
				ry_sq = ry * ry,
				x1_sq = x1 * x1,
				y1_sq = y1 * y1,
				radiiCheck = x1_sq / rx_sq + y1_sq / ry_sq;
			if (radiiCheck > 1) {
				rx = Math.sqrt(radiiCheck) * rx;
				ry = Math.sqrt(radiiCheck) * ry;
				rx_sq = rx * rx;
				ry_sq = ry * ry;
			}
			var sign = (largeArcFlag === sweepFlag) ? -1 : 1,
				sq = ((rx_sq * ry_sq) - (rx_sq * y1_sq) - (ry_sq * x1_sq)) / ((rx_sq * y1_sq) + (ry_sq * x1_sq));
			if (sq < 0) {
				sq = 0;
			}
			var coef = (sign * Math.sqrt(sq)),
				cx1 = coef * ((rx * y1) / ry),
				cy1 = coef * -((ry * x1) / rx),
				sx2 = (lastX + x) / 2,
				sy2 = (lastY + y) / 2,
				cx = sx2 + (cosAngle * cx1 - sinAngle * cy1),
				cy = sy2 + (sinAngle * cx1 + cosAngle * cy1),
				ux = (x1 - cx1) / rx,
				uy = (y1 - cy1) / ry,
				vx = (-x1 - cx1) / rx,
				vy = (-y1 - cy1) / ry,
				n = Math.sqrt((ux * ux) + (uy * uy)),
				p = ux;
			sign = (uy < 0) ? -1 : 1;
			var angleStart = (sign * Math.acos(p / n)) * _RAD2DEG;

			n = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
			p = ux * vx + uy * vy;
			sign = (ux * vy - uy * vx < 0) ? -1 : 1;
			var angleExtent = (sign * Math.acos(p / n)) * _RAD2DEG;
			if (!sweepFlag && angleExtent > 0) {
				angleExtent -= 360;
			} else if (sweepFlag && angleExtent < 0) {
				angleExtent += 360;
			}
			angleExtent %= 360;
			angleStart %= 360;

			var bezierPoints = _normalizedArcToBeziers(angleStart, angleExtent),
				a = cosAngle * rx,
				b = sinAngle * rx,
				c = sinAngle * -ry,
				d = cosAngle * ry,
				l = bezierPoints.length - 2,
				i, px, py;
			//translate all the bezier points according to the matrix...
			for (i = 0; i < l; i +=  2) {
				px = bezierPoints[i];
				py = bezierPoints[i+1];
				bezierPoints[i] = px * a + py * c + cx;
				bezierPoints[i+1] = px * b + py * d + cy;
			}
			bezierPoints[bezierPoints.length-2] = x; //always set the end to exactly where it's supposed to be
			bezierPoints[bezierPoints.length-1] = y;
			return bezierPoints;
		},

		//Spits back an array of cubic Bezier segments that use absolute coordinates. Each segment starts with a "moveTo" command (x coordinate, then y) and then 2 control points (x, y, x, y), then anchor. The goal is to minimize memory and maximize speed.
		_pathDataToBezier = function(d) {
			var a = (d + "").replace(_scientific, function(m) { var n = +m; return (n < 0.0001 && n > -0.0001) ? 0 : n; }).match(_svgPathExp) || [], //some authoring programs spit out very small numbers in scientific notation like "1e-5", so make sure we round that down to 0 first.
				path = [],
				relativeX = 0,
				relativeY = 0,
				elements = a.length,
				l = 2,
				points = 0,
				i, j, x, y, command, isRelative, segment, startX, startY, difX, difY, beziers, prevCommand;
			if (!d || !isNaN(a[0]) || isNaN(a[1])) {
				_log("ERROR: malformed path data: " + d);
				return path;
			}
			for (i = 0; i < elements; i++) {
				prevCommand = command;
				if (isNaN(a[i])) {
					command = a[i].toUpperCase();
					isRelative = (command !== a[i]); //lower case means relative
				} else { //commands like "C" can be strung together without any new command characters between.
					i--;
				}
				x = +a[i+1];
				y = +a[i+2];
				if (isRelative) {
					x += relativeX;
					y += relativeY;
				}
				if (i === 0) {
					startX = x;
					startY = y;
				}

				// "M" (move)
				if (command === "M") {
					if (segment && segment.length < 8) { //if the path data was funky and just had a M with no actual drawing anywhere, skip it.
						path.length-=1;
						l = 0;
					}
					relativeX = startX = x;
					relativeY = startY = y;
					segment = [x, y];
					points += l;
					l = 2;
					path.push(segment);
					i += 2;
					command = "L"; //an "M" with more than 2 values gets interpreted as "lineTo" commands ("L").

				// "C" (cubic bezier)
				} else if (command === "C") {
					if (!segment) {
						segment = [0, 0];
					}
					segment[l++] = x;
					segment[l++] = y;
					if (!isRelative) {
						relativeX = relativeY = 0;
					}
					segment[l++] = relativeX + a[i + 3] * 1; //note: "*1" is just a fast/short way to cast the value as a Number. WAAAY faster in Chrome, slightly slower in Firefox.
					segment[l++] = relativeY + a[i + 4] * 1;
					segment[l++] = relativeX = relativeX + a[i + 5] * 1;
					segment[l++] = relativeY = relativeY + a[i + 6] * 1;
					//if (y === segment[l-1] && y === segment[l-3] && x === segment[l-2] && x === segment[l-4]) { //if all the values are the same, eliminate the waste.
					//	segment.length = l = l-6;
					//}
					i += 6;

				// "S" (continuation of cubic bezier)
				} else if (command === "S") {
					if (prevCommand === "C" || prevCommand === "S") {
						difX = relativeX - segment[l - 4];
						difY = relativeY - segment[l - 3];
						segment[l++] = relativeX + difX;
						segment[l++] = relativeY + difY;
					} else {
						segment[l++] = relativeX;
						segment[l++] = relativeY;
					}
					segment[l++] = x;
					segment[l++] = y;
					if (!isRelative) {
						relativeX = relativeY = 0;
					}
					segment[l++] = relativeX = relativeX + a[i + 3] * 1;
					segment[l++] = relativeY = relativeY + a[i + 4] * 1;
					//if (y === segment[l-1] && y === segment[l-3] && x === segment[l-2] && x === segment[l-4]) { //if all the values are the same, eliminate the waste.
					//	segment.length = l = l-6;
					//}
					i += 4;

				// "Q" (quadratic bezier)
				} else if (command === "Q") {
					difX = x - relativeX;
					difY = y - relativeY;
					segment[l++] = relativeX + difX * 2 / 3;
					segment[l++] = relativeY + difY * 2 / 3;
					if (!isRelative) {
						relativeX = relativeY = 0;
					}
					relativeX = relativeX + a[i + 3] * 1;
					relativeY = relativeY + a[i + 4] * 1;
					difX = x - relativeX;
					difY = y - relativeY;
					segment[l++] = relativeX + difX * 2 / 3;
					segment[l++] = relativeY + difY * 2 / 3;
					segment[l++] = relativeX;
					segment[l++] = relativeY;

					i += 4;

				// "T" (continuation of quadratic bezier)
				} else if (command === "T") {
					difX = relativeX - segment[l-4];
					difY = relativeY - segment[l-3];
					segment[l++] = relativeX + difX;
					segment[l++] = relativeY + difY;
					difX = (relativeX + difX * 1.5) - x;
					difY = (relativeY + difY * 1.5) - y;
					segment[l++] = x + difX * 2 / 3;
					segment[l++] = y + difY * 2 / 3;
					segment[l++] = relativeX = x;
					segment[l++] = relativeY = y;

					i += 2;

				// "H" (horizontal line)
				} else if (command === "H") {
					y = relativeY;
					//if (x !== relativeX) {
						segment[l++] = relativeX + (x - relativeX) / 3;
						segment[l++] = relativeY + (y - relativeY) / 3;
						segment[l++] = relativeX + (x - relativeX) * 2 / 3;
						segment[l++] = relativeY + (y - relativeY) * 2 / 3;
						segment[l++] = relativeX = x;
						segment[l++] = y;
					//}
					i += 1;

				// "V" (horizontal line)
				} else if (command === "V") {
					y = x; //adjust values because the first (and only one) isn't x in this case, it's y.
					x = relativeX;
					if (isRelative) {
						y += relativeY - relativeX;
					}
					//if (y !== relativeY) {
						segment[l++] = x;
						segment[l++] = relativeY + (y - relativeY) / 3;
						segment[l++] = x;
						segment[l++] = relativeY + (y - relativeY) * 2 / 3;
						segment[l++] = x;
						segment[l++] = relativeY = y;
					//}
					i += 1;

				// "L" (line) or "Z" (close)
				} else if (command === "L" || command === "Z") {
					if (command === "Z") {
						x = startX;
						y = startY;
						segment.closed = true;
					}
					if (command === "L" || Math.abs(relativeX - x) > 0.5 || Math.abs(relativeY - y) > 0.5) {
						segment[l++] = relativeX + (x - relativeX) / 3;
						segment[l++] = relativeY + (y - relativeY) / 3;
						segment[l++] = relativeX + (x - relativeX) * 2 / 3;
						segment[l++] = relativeY + (y - relativeY) * 2 / 3;
						segment[l++] = x;
						segment[l++] = y;
						if (command === "L") {
							i += 2;
						}
					}
					relativeX = x;
					relativeY = y;

				// "A" (arc)
				} else if (command === "A") {
					beziers = _arcToBeziers(relativeX, relativeY, a[i+1]*1, a[i+2]*1, a[i+3]*1, a[i+4]*1, a[i+5]*1, (isRelative ? relativeX : 0) + a[i+6]*1, (isRelative ? relativeY : 0) + a[i+7]*1);
					if (beziers) {
						for (j = 0; j < beziers.length; j++) {
							segment[l++] = beziers[j];
						}
					}
					relativeX = segment[l-2];
					relativeY = segment[l-1];
					i += 7;

				} else {
					_log("Error: malformed path data: " + d);
				}
			}
			path.totalPoints = points + l;
			return path;
		},

		//adds a certain number of Beziers while maintaining the path shape (so that the start/end values can have a matching quantity of points to animate). Only pass in ONE segment of the Bezier at a time. Format: [xAnchor, yAnchor, xControlPoint1, yControlPoint1, xControlPoint2, yControlPoint2, xAnchor, yAnchor, xControlPoint1, etc...]
		_subdivideBezier = function(bezier, quantity) {
			var tally = 0,
				max = 0.999999,
				l = bezier.length,
				newPointsPerSegment = quantity / ((l - 2) / 6),
				ax, ay, cp1x, cp1y, cp2x, cp2y, bx, by,
				x1, y1, x2, y2, i, t;
			for (i = 2; i < l; i += 6) {
				tally += newPointsPerSegment;
				while (tally > max) { //compare with 0.99999 instead of 1 in order to prevent rounding errors
					ax = bezier[i-2];
					ay = bezier[i-1];
					cp1x = bezier[i];
					cp1y = bezier[i+1];
					cp2x = bezier[i+2];
					cp2y = bezier[i+3];
					bx = bezier[i+4];
					by = bezier[i+5];
					t = 1 / (Math.floor(tally) + 1); //progress along the bezier (value between 0 and 1)

					x1 = ax + (cp1x - ax) * t;
					x2 = cp1x + (cp2x - cp1x) * t;
					x1 += (x2 - x1) * t;
					x2 += ((cp2x + (bx - cp2x) * t) - x2) * t;

					y1 = ay + (cp1y - ay) * t;
					y2 = cp1y + (cp2y - cp1y) * t;
					y1 += (y2 - y1) * t;
					y2 += ((cp2y + (by - cp2y) * t) - y2) * t;

					bezier.splice(i, 4,
						ax + (cp1x - ax) * t,   //first control point
						ay + (cp1y - ay) * t,
						x1,                     //second control point
						y1,
						x1 + (x2 - x1) * t,     //new fabricated anchor on line
						y1 + (y2 - y1) * t,
						x2,                     //third control point
						y2,
						cp2x + (bx - cp2x) * t, //fourth control point
						cp2y + (by - cp2y) * t
					);
					i += 6;
					l += 6;
					tally--;
				}
			}
			return bezier;
		},
		_bezierToPathData = function(beziers) {
			var data = "",
				l = beziers.length,
				rnd = 100,
				sl, s, i, segment;
			for (s = 0; s < l; s++) {
				segment = beziers[s];
				data += "M" + segment[0] + "," + segment[1] + " C";
				sl = segment.length;
				for (i = 2; i < sl; i++) {
					data += (((segment[i++] * rnd) | 0) / rnd) + "," + (((segment[i++] * rnd) | 0) / rnd) + " " + (((segment[i++] * rnd) | 0) / rnd) + "," + (((segment[i++] * rnd) | 0) / rnd) + " " + (((segment[i++] * rnd) | 0) / rnd) + "," + (((segment[i] * rnd) | 0) / rnd) + " ";
				}
				if (segment.closed) {
					data += "z";
				}
			}
			return data;
		},
		_reverseBezier = function(bezier) {
			var a = [],
				i = bezier.length - 1,
				l = 0;
			while (--i > -1) {
				a[l++] = bezier[i];
				a[l++] = bezier[i+1];
				i--;
			}
			for (i = 0; i < l; i++) {
				bezier[i] = a[i];
			}
			bezier.reversed = bezier.reversed ? false : true;
		},
		_getAverageXY = function(bezier) {
			var l = bezier.length,
				x = 0,
				y = 0,
				i;
			for (i = 0; i < l; i++) {
				x += bezier[i++];
				y += bezier[i];
			}
			return [x / (l / 2), y / (l / 2)];
		},
		_getSize = function(bezier) { //rough estimate of the bounding box (based solely on the anchors) of a single segment. sets "size", "centerX", and "centerY" properties on the bezier array itself, and returns the size (width * height)
			var l = bezier.length,
				xMax = bezier[0],
				xMin = xMax,
				yMax = bezier[1],
				yMin = yMax,
				x, y, i;
			for (i = 6; i < l; i+=6) {
				x = bezier[i];
				y = bezier[i+1];
				if (x > xMax) {
					xMax = x;
				} else if (x < xMin) {
					xMin = x;
				}
				if (y > yMax) {
					yMax = y;
				} else if (y < yMin) {
					yMin = y;
				}
			}
			bezier.centerX = (xMax + xMin) / 2;
			bezier.centerY = (yMax + yMin) / 2;
			return (bezier.size = (xMax - xMin) * (yMax - yMin));
		},
		_getTotalSize = function(bezier) { //rough estimate of the bounding box of the entire list of Bezier segments (based solely on the anchors). sets "size", "centerX", and "centerY" properties on the bezier array itself, and returns the size (width * height)
			var segment = bezier.length,
				xMax = bezier[0][0],
				xMin = xMax,
				yMax = bezier[0][1],
				yMin = yMax,
				l, x, y, i, b;
			while (--segment > -1) {
				b = bezier[segment];
				l = b.length;
				for (i = 6; i < l; i+=6) {
					x = b[i];
					y = b[i+1];
					if (x > xMax) {
						xMax = x;
					} else if (x < xMin) {
						xMin = x;
					}
					if (y > yMax) {
						yMax = y;
					} else if (y < yMin) {
						yMin = y;
					}
				}
			}
			bezier.centerX = (xMax + xMin) / 2;
			bezier.centerY = (yMax + yMin) / 2;
			return (bezier.size = (xMax - xMin) * (yMax - yMin));
		},
		_sortByComplexity = function(a, b) {
			return b.length - a.length;
		},
		_sortBySize = function(a, b) {
			var sizeA = a.size || _getSize(a),
				sizeB = b.size || _getSize(b);
			return (Math.abs(sizeB - sizeA) < (sizeA + sizeB) / 20) ? (b.centerX - a.centerX) || (b.centerY - a.centerY) : sizeB - sizeA; //if the size is within 10% of each other, prioritize position from left to right, then top to bottom.
		},
		_offsetBezier = function(bezier, shapeIndex) {
			var a = bezier.slice(0),
				l = bezier.length,
				wrap = l - 2,
				i, index;
			shapeIndex = shapeIndex | 0;
			for (i = 0; i < l; i++) {
				index = (i + shapeIndex) % wrap;
				bezier[i++] = a[index];
				bezier[i] = a[index+1];
			}
		},
		_getTotalMovement = function(sb, eb, shapeIndex, offsetX, offsetY) {
			var l = sb.length,
				d = 0,
				wrap = l - 2,
				index, i, x, y;
			shapeIndex *= 6;
			for (i = 0; i < l; i += 6) {
				index = (i + shapeIndex) % wrap;
				y = sb[index] - (eb[i] - offsetX);
				x = sb[index+1] - (eb[i+1] - offsetY);
				d += Math.sqrt(x * x + y * y);
			}
			return d;
		},
		_getClosestShapeIndex = function(sb, eb, checkReverse) { //finds the index in a closed cubic bezier array that's closest to the angle provided (angle measured from the center or average x/y).
			var l = sb.length,
				sCenter = _getAverageXY(sb), //when comparing distances, adjust the coordinates as if the shapes are centered with each other.
				eCenter = _getAverageXY(eb),
				offsetX = eCenter[0] - sCenter[0],
				offsetY = eCenter[1] - sCenter[1],
				min = _getTotalMovement(sb, eb, 0, offsetX, offsetY),
				minIndex = 0,
				copy, d, i;
			for (i = 6; i < l; i += 6) {
				d = _getTotalMovement(sb, eb, i / 6, offsetX, offsetY);
				if (d < min) {
					min = d;
					minIndex = i;
				}
			}
			if (checkReverse) {
				copy = sb.slice(0);
				_reverseBezier(copy);
				for (i = 6; i < l; i += 6) {
					d = _getTotalMovement(copy, eb, i / 6, offsetX, offsetY);
					if (d < min) {
						min = d;
						minIndex = -i;
					}
				}
			}
			return minIndex / 6;
		},
		_getClosestAnchor = function(bezier, x, y) { //finds the x/y of the anchor that's closest to the provided x/y coordinate (returns an array, like [x, y]). The bezier should be the top-level type that contains an array for each segment.
			var j = bezier.length,
				closestDistance = 99999999999,
				closestX = 0,
				closestY = 0,
				b, dx, dy, d, i, l;
			while (--j > -1) {
				b = bezier[j];
				l = b.length;
				for (i = 0; i < l; i += 6) {
					dx = b[i] - x;
					dy = b[i+1] - y;
					d = Math.sqrt(dx * dx + dy * dy);
					if (d < closestDistance) {
						closestDistance = d;
						closestX = b[i];
						closestY = b[i+1];
					}
				}
			}
			return [closestX, closestY];
		},
		_getClosestSegment = function(bezier, pool, startIndex, sortRatio, offsetX, offsetY) { //matches the bezier to the closest one in a pool (array) of beziers, assuming they are in order of size and we shouldn't drop more than 20% of the size, otherwise prioritizing location (total distance to the center). Extracts the segment out of the pool array and returns it.
			var l = pool.length,
				index = 0,
				minSize = Math.min(bezier.size || _getSize(bezier), pool[startIndex].size || _getSize(pool[startIndex])) * sortRatio, //limit things based on a percentage of the size of either the bezier or the next element in the array, whichever is smaller.
				min = 999999999999,
				cx = bezier.centerX + offsetX,
				cy = bezier.centerY + offsetY,
				size, i, dx, dy, d;
			for (i = startIndex; i < l; i++) {
				size = pool[i].size || _getSize(pool[i]);
				if (size < minSize) {
					break;
				}
				dx = pool[i].centerX - cx;
				dy = pool[i].centerY - cy;
				d = Math.sqrt(dx * dx + dy * dy);
				if (d < min) {
					index = i;
					min = d;
				}
			}
			d = pool[index];
			pool.splice(index, 1);
			return d;
		},
		_equalizeSegmentQuantity = function(start, end, shapeIndex, map) { //returns an array of shape indexes, 1 for each segment.
			var dif = end.length - start.length,
				longer = dif > 0 ? end : start,
				shorter = dif > 0 ? start : end,
				added = 0,
				sortMethod = (map === "complexity") ? _sortByComplexity : _sortBySize,
				sortRatio = (map === "position") ? 0 : (typeof(map) === "number") ? map : 0.8,
				i = shorter.length,
				shapeIndices = (typeof(shapeIndex) === "object" && shapeIndex.push) ? shapeIndex.slice(0) : [shapeIndex],
				reverse = (shapeIndices[0] === "reverse" || shapeIndices[0] < 0),
				log = (shapeIndex === "log"),
				eb, sb, b, x, y, offsetX, offsetY;
			if (!shorter[0]) {
				return;
			}
			if (longer.length > 1) {
				start.sort(sortMethod);
				end.sort(sortMethod);
				offsetX = longer.size || _getTotalSize(longer); //ensures centerX and centerY are defined (used below).
				offsetX = shorter.size || _getTotalSize(shorter);
				offsetX = longer.centerX - shorter.centerX;
				offsetY = longer.centerY - shorter.centerY;
				if (sortMethod === _sortBySize) {
					for (i = 0; i < shorter.length; i++) {
						longer.splice(i, 0, _getClosestSegment(shorter[i], longer, i, sortRatio, offsetX, offsetY));
					}
				}
			}
			if (dif) {
				if (dif < 0) {
					dif = -dif;
				}
				if (longer[0].length > shorter[0].length) { //since we use shorter[0] as the one to map the origination point of any brand new fabricated segments, do any subdividing first so that there are more points to choose from (if necessary)
					_subdivideBezier(shorter[0], ((longer[0].length - shorter[0].length)/6) | 0);
				}
				i = shorter.length;
				while (added < dif) {
					x = longer[i].size || _getSize(longer[i]); //just to ensure centerX and centerY are calculated which we use on the next line.
					b = _getClosestAnchor(shorter, longer[i].centerX, longer[i].centerY);
					x = b[0];
					y = b[1];
					shorter[i++] = [x, y, x, y, x, y, x, y];
					shorter.totalPoints += 8;
					added++;
				}
			}
			for (i = 0; i < start.length; i++) {
				eb = end[i];
				sb = start[i];
				dif = eb.length - sb.length;
				if (dif < 0) {
					_subdivideBezier(eb, (-dif/6) | 0);
				} else if (dif > 0) {
					_subdivideBezier(sb, (dif/6) | 0);
				}
				if (reverse && !sb.reversed) {
					_reverseBezier(sb);
				}
				shapeIndex = (shapeIndices[i] || shapeIndices[i] === 0) ? shapeIndices[i] : "auto";
				if (shapeIndex) {
					//if start shape is closed, find the closest point to the start/end, and re-organize the bezier points accordingly so that the shape morphs in a more intuitive way.
					if (sb.closed || (Math.abs(sb[0] - sb[sb.length - 2]) < 0.5 && Math.abs(sb[1] - sb[sb.length - 1]) < 0.5)) {
						if (shapeIndex === "auto" || shapeIndex === "log") {
							shapeIndices[i] = shapeIndex = _getClosestShapeIndex(sb, eb, i === 0);
							if (shapeIndex < 0) {
								reverse = true;
								_reverseBezier(sb);
								shapeIndex = -shapeIndex;
							}
							_offsetBezier(sb, shapeIndex * 6);

						} else if (shapeIndex !== "reverse") {
							if (i && shapeIndex < 0) { //only happens if an array is passed as shapeIndex and a negative value is defined for an index beyond 0. Very rare, but helpful sometimes.
								_reverseBezier(sb);
							}
							_offsetBezier(sb, (shapeIndex < 0 ? -shapeIndex : shapeIndex) * 6);
						}
					//otherwise, if it's not a closed shape, consider reversing it if that would make the overall travel less
					} else if (!reverse && (shapeIndex === "auto" && (Math.abs(eb[0] - sb[0]) + Math.abs(eb[1] - sb[1]) + Math.abs(eb[eb.length - 2] - sb[sb.length - 2]) + Math.abs(eb[eb.length - 1] - sb[sb.length - 1]) > Math.abs(eb[0] - sb[sb.length - 2]) + Math.abs(eb[1] - sb[sb.length - 1]) + Math.abs(eb[eb.length - 2] - sb[0]) + Math.abs(eb[eb.length - 1] - sb[1])) || (shapeIndex % 2))) {
						_reverseBezier(sb);
						shapeIndices[i] = -1;
						reverse = true;
					} else if (shapeIndex === "auto") {
						shapeIndices[i] = 0;
					} else if (shapeIndex === "reverse") {
						shapeIndices[i] = -1;
					}
					if (sb.closed !== eb.closed) { //if one is closed and one isn't, don't close either one otherwise the tweening will look weird (but remember, the beginning and final states will honor the actual values, so this only affects the inbetween state)
						sb.closed = eb.closed = false;
					}
				}
			}
			if (log) {
				_log("shapeIndex:[" + shapeIndices.join(",") + "]");
			}
			return shapeIndices;
		},
		_pathFilter = function(a, shapeIndex, map, precompile) {
			var start = _pathDataToBezier(a[0]),
				end = _pathDataToBezier(a[1]);
			if (!_equalizeSegmentQuantity(start, end, (shapeIndex || shapeIndex === 0) ? shapeIndex : "auto", map)) {
				return; //malformed path data or null target
			}
			a[0] = _bezierToPathData(start);
			a[1] = _bezierToPathData(end);
			if (precompile === "log" || precompile === true) {
				_log('precompile:["' + a[0] + '","' + a[1] + '"]');
			}
		},
		_buildPathFilter = function(shapeIndex, map, precompile) {
			return (map || precompile || shapeIndex || shapeIndex === 0) ? function(a) {
				_pathFilter(a, shapeIndex, map, precompile);
			} : _pathFilter;
		},
		_offsetPoints = function(text, offset) {
			if (!offset) {
				return text;
			}
			var a = text.match(_numbersExp) || [],
				l = a.length,
				s = "",
				inc, i, j;
			if (offset === "reverse") {
				i = l-1;
				inc = -2;
			} else {
				i = (((parseInt(offset, 10) || 0) * 2 + 1) + l * 100) % l;
				inc = 2;
			}
			for (j = 0; j < l; j += 2) {
				s += a[i-1] + "," + a[i] + " ";
				i = (i + inc) % l;
			}
			return s;
		},
		//adds a certain number of points while maintaining the polygon/polyline shape (so that the start/end values can have a matching quantity of points to animate). Returns the revised string.
		_equalizePointQuantity = function(a, quantity) {
			var tally = 0,
				x = parseFloat(a[0]),
				y = parseFloat(a[1]),
				s = x + "," + y + " ",
				max = 0.999999,
				newPointsPerSegment, i, l, j, factor, nextX, nextY;
			l = a.length;
			newPointsPerSegment = quantity * 0.5 / (l * 0.5 - 1);
			for (i = 0; i < l-2; i += 2) {
				tally += newPointsPerSegment;
				nextX = parseFloat(a[i+2]);
				nextY = parseFloat(a[i+3]);
				if (tally > max) { //compare with 0.99999 instead of 1 in order to prevent rounding errors
					factor = 1 / (Math.floor(tally) + 1);
					j = 1;
					while (tally > max) {
						s += (x + (nextX - x) * factor * j).toFixed(2) + "," + (y + (nextY - y) * factor * j).toFixed(2) + " ";
						tally--;
						j++;
					}
				}
				s += nextX + "," + nextY + " ";
				x = nextX;
				y = nextY;
			}
			return s;
		},
		_pointsFilter = function(a) {
			var startNums = a[0].match(_numbersExp) || [],
				endNums = a[1].match(_numbersExp) || [],
				dif = endNums.length - startNums.length;
			if (dif > 0) {
				a[0] = _equalizePointQuantity(startNums, dif);
			} else {
				a[1] = _equalizePointQuantity(endNums, -dif);
			}
		},
		_buildPointsFilter = function(shapeIndex) {
			return !isNaN(shapeIndex) ? function(a) {
				_pointsFilter(a);
				a[1] = _offsetPoints(a[1], parseInt(shapeIndex, 10));
			} : _pointsFilter;
		},
		_createPath = function(e, ignore) {
			var path = _gsScope.document.createElementNS("http://www.w3.org/2000/svg", "path"),
				attr = Array.prototype.slice.call(e.attributes),
				i = attr.length,
				name;
			ignore = "," + ignore + ",";
			while (--i > -1) {
				name = attr[i].nodeName.toLowerCase(); //in Microsoft Edge, if you don't set the attribute with a lowercase name, it doesn't render correctly! Super weird.
				if (ignore.indexOf("," + name + ",") === -1) {
					path.setAttributeNS(null, name, attr[i].nodeValue);
				}
			}
			return path;
		},
		_convertToPath = function(e, swap) {
			var type = e.tagName.toLowerCase(),
				circ = 0.552284749831,
				data, x, y, r, ry, path, rcirc, rycirc, points, w, h, x2, x3, x4, x5, x6, y2, y3, y4, y5, y6;
			if (type === "path" || !e.getBBox) {
				return e;
			}
			path = _createPath(e, "x,y,width,height,cx,cy,rx,ry,r,x1,x2,y1,y2,points");
			if (type === "rect") {
				r = +e.getAttribute("rx") || 0;
				ry = +e.getAttribute("ry") || 0;
				x = +e.getAttribute("x") || 0;
				y = +e.getAttribute("y") || 0;
				w = (+e.getAttribute("width") || 0) - r * 2;
				h = (+e.getAttribute("height") || 0) - ry * 2;
				if (r || ry) { //if there are rounded corners, render cubic beziers
					x2 = x + r * (1 - circ);
					x3 = x + r;
					x4 = x3 + w;
					x5 = x4 + r * circ;
					x6 = x4 + r;
					y2 = y + ry * (1 - circ);
					y3 = y + ry;
					y4 = y3 + h;
					y5 = y4 + ry * circ;
					y6 = y4 + ry;
					data = "M" + x6 + "," + y3 + " V" + y4 + " C" + [x6, y5, x5, y6, x4, y6, x4 - (x4 - x3) / 3, y6, x3 + (x4 - x3) / 3, y6, x3, y6, x2, y6, x, y5, x, y4, x, y4 - (y4 - y3) / 3, x, y3 + (y4 - y3) / 3, x, y3, x, y2, x2, y, x3, y, x3 + (x4 - x3) / 3, y, x4 - (x4 - x3) / 3, y, x4, y, x5, y, x6, y2, x6, y3].join(",") + "z";
				} else {
					data = "M" + (x + w) + "," + y + " v" + h + " h" + (-w) + " v" + (-h) + " h" + w + "z";
				}

			} else if (type === "circle" || type === "ellipse") {
				if (type === "circle") {
					r = ry = +e.getAttribute("r") || 0;
					rycirc = r * circ;
				} else {
					r = +e.getAttribute("rx") || 0;
					ry = +e.getAttribute("ry") || 0;
					rycirc = ry * circ;
				}
				x = +e.getAttribute("cx") || 0;
				y = +e.getAttribute("cy") || 0;
				rcirc = r * circ;
				data = "M" + (x+r) + "," + y + " C" + [x+r, y + rycirc, x + rcirc, y + ry, x, y + ry, x - rcirc, y + ry, x - r, y + rycirc, x - r, y, x - r, y - rycirc, x - rcirc, y - ry, x, y - ry, x + rcirc, y - ry, x + r, y - rycirc, x + r, y].join(",") + "z";
			} else if (type === "line") {
				data = _bezierToPathData(_pathDataToBezier("M" + (e.getAttribute("x1") || 0) + "," + (e.getAttribute("y1") || 0) + " L" + (e.getAttribute("x2") || 0) + "," + (e.getAttribute("y2") || 0))); //previously, we just converted to "Mx,y Lx,y" but Safari has bugs that cause that not to render properly when using a stroke-dasharray that's not fully visible! Using a cubic bezier fixes that issue.
			} else if (type === "polyline" || type === "polygon") {
				points = (e.getAttribute("points") + "").match(_numbersExp) || [];
				x = points.shift();
				y = points.shift();
				data = "M" + x + "," + y + " L" + points.join(",");
				if (type === "polygon") {
					data += "," + x + "," + y + "z";
				}
			}
			path.setAttribute("d", data);
			if (swap && e.parentNode) {
				e.parentNode.insertBefore(path, e);
				e.parentNode.removeChild(e);
			}

			return path;
		},
		_parseShape = function(shape, forcePath, target) {
			var isString = typeof(shape) === "string",
				e, type;
			if (!isString || _selectorExp.test(shape) || (shape.match(_numbersExp) || []).length < 3) {
				e = isString ? TweenLite.selector(shape) : (shape && shape[0]) ? shape : [shape]; //allow array-like objects like jQuery objects.
				if (e && e[0]) {
					e = e[0];
					type = e.nodeName.toUpperCase();
					if (forcePath && type !== "PATH") { //if we were passed an element (or selector text for an element) that isn't a path, convert it.
						e = _convertToPath(e, false);
						type = "PATH";
					}
					shape = e.getAttribute(type === "PATH" ? "d" : "points") || "";
					if (e === target) { //if the shape matches the target element, the user wants to revert to the original which should have been stored in the data-original attribute
						shape = e.getAttributeNS(null, "data-original") || shape;
					}
				} else {
					_log("WARNING: invalid morph to: " + shape);
					shape = false;
				}
			}
			return shape;
		},
		_morphMessage = "Use MorphSVGPlugin.convertToPath(elementOrSelectorText) to convert to a path before morphing.",



		MorphSVGPlugin = _gsScope._gsDefine.plugin({
			propName: "morphSVG",
			API: 2,
			global: true,
			version: "0.8.11",

			//called when the tween renders for the first time. This is where initial values should be recorded and any setup routines should run.
			init: function(target, value, tween, index) {
				var type, p, pt, shape, isPoly;
				if (typeof(target.setAttribute) !== "function") {
					return false;
				}
				if (typeof(value) === "function") {
					value = value(index, target);
				}
				type = target.nodeName.toUpperCase();
				isPoly = (type === "POLYLINE" || type === "POLYGON");
				if (type !== "PATH" && !isPoly) {
					_log("WARNING: cannot morph a <" + type + "> SVG element. " + _morphMessage);
					return false;
				}
				p = (type === "PATH") ? "d" : "points";
				if (typeof(value) === "string" || value.getBBox || value[0]) {
					value = {shape:value};
				}
				shape = _parseShape(value.shape || value.d || value.points || "", (p === "d"), target);
				if (isPoly && _commands.test(shape)) {
					_log("WARNING: a <" + type + "> cannot accept path data. " + _morphMessage);
					return false;
				}
				if (shape) {
					this._target = target;
					if (!target.getAttributeNS(null, "data-original")) {
						target.setAttributeNS(null, "data-original", target.getAttribute(p)); //record the original state in a data-original attribute so that we can revert to it later.
					}
					pt = this._addTween(target, "setAttribute", target.getAttribute(p) + "", shape + "", "morphSVG", false, p, (typeof(value.precompile) === "object") ? function(a) {a[0] = value.precompile[0]; a[1] = value.precompile[1];} : (p === "d") ? _buildPathFilter(value.shapeIndex, value.map || MorphSVGPlugin.defaultMap, value.precompile) : _buildPointsFilter(value.shapeIndex));
					if (pt) {
						this._overwriteProps.push("morphSVG");
						pt.end = shape;
						pt.endProp = p;
					}
				}
				return true;
			},

			set: function(ratio) {
				var pt;
				this._super.setRatio.call(this, ratio);
				if (ratio === 1) {
					pt = this._firstPT;
					while (pt) {
						if (pt.end) {
							this._target.setAttribute(pt.endProp, pt.end); //make sure the end value is exactly as specified (in case we had to add fabricated points during the tween)
						}
						pt = pt._next;
					}
				}
			}

		});

	MorphSVGPlugin.pathFilter = _pathFilter;
	MorphSVGPlugin.pointsFilter = _pointsFilter;
	MorphSVGPlugin.subdivideRawBezier = _subdivideBezier;
	MorphSVGPlugin.defaultMap = "size";
	MorphSVGPlugin.pathDataToRawBezier = function(data) {
		return _pathDataToBezier(_parseShape(data, true));
	};
	MorphSVGPlugin.equalizeSegmentQuantity = _equalizeSegmentQuantity;

	MorphSVGPlugin.convertToPath = function(targets, swap) {
		if (typeof(targets) === "string") {
			targets = TweenLite.selector(targets);
		}
		var a = (!targets || targets.length === 0) ? [] : (targets.length && targets[0] && targets[0].nodeType) ? Array.prototype.slice.call(targets, 0) : [targets],
			i = a.length;
		while (--i > -1) {
			a[i] = _convertToPath(a[i], (swap !== false));
		}
		return a;
	};

	MorphSVGPlugin.pathDataToBezier = function(data, vars) { //converts SVG path data into an array of {x, y} objects that can be plugged directly into a bezier tween. You can optionally pass in a 2D matrix like [a, b, c, d, tx, ty] containing numbers that should transform each point.
		var bezier = _pathDataToBezier(_parseShape(data, true))[0] || [],
			prefix = 0,
			a, i, l, matrix, offsetX, offsetY, bbox, e;
		vars = vars || {};
		e = vars.align || vars.relative;
		matrix = vars.matrix || [1,0,0,1,0,0];
		offsetX = vars.offsetX || 0;
		offsetY = vars.offsetY || 0;
		if (e === "relative" || e === true) {
			offsetX -= bezier[0] * matrix[0] + bezier[1] * matrix[2];
			offsetY -= bezier[0] * matrix[1] + bezier[1] * matrix[3];
			prefix = "+=";
		} else {
			offsetX += matrix[4];
			offsetY += matrix[5];
			if (e) {
				e = (typeof(e) === "string") ? TweenLite.selector(e) : (e && e[0]) ? e : [e]; //allow array-like objects like jQuery objects.
				if (e && e[0]) {
					bbox = e[0].getBBox() || {x:0, y:0};
					offsetX -= bbox.x;
					offsetY -= bbox.y;
				}
			}
		}
		a = [];
		l = bezier.length;
		if (matrix && matrix.join(",") !== "1,0,0,1,0,0") {
			for (i = 0; i < l; i+=2) {
				a.push({x:prefix + (bezier[i] * matrix[0] + bezier[i+1] * matrix[2] + offsetX), y:prefix + (bezier[i] * matrix[1] + bezier[i+1] * matrix[3] + offsetY)});
			}
		} else {
			for (i = 0; i < l; i+=2) {
				a.push({x:prefix + (bezier[i] + offsetX), y:prefix + (bezier[i+1] + offsetY)});
			}
		}
		return a;
	};



export { MorphSVGPlugin, MorphSVGPlugin as default };