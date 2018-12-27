var SVGLoading = function (options) {
	options = $.extend({
		ct:$("body"),
		r: 30,
		border: 5,
		fontSize: "14px",
		loadedColor: "#CF5F5F",
		unloadColor: "#735F57",
		textColor: "#735F57",
		textDefault:'0%',
		hasMask:true
	}, options);
	var ct=options.ct,
		r = options.r,
		border = options.border,
		fontSize = options.fontSize,
		loadedColor = options.loadedColor,
		unloadColor = options.unloadColor,
		textColor = options.textColor,
		textDefault =options.textDefault;
	
	var startAngle = 0;
	var angleRang = 180;
	var angleRangDefault = 180;
	var endAngle;
	var step = 5;
	var fps = 25;
	var unloadsvgarc, loadedsvgarc, loadedText, loadingContainer, mask;
	var timer;

	function init() {
		mask=$('<div style="position:absolute;z-index:999998;left:0;top:0;right:0;bottom:0;background-color:rgba(0,0,0,0.5);"></div>');
		var svgstr = '<svg width="' + 2 * (r + border) + 'px" height="' + 2 * (r + border) + 'px" style="position:absolute;z-index:999999;left:50%;top:50%;margin-left:-' + (r + border) + 'px;margin-top:-' + (r + border) + 'px;">'
		svgstr += '<path class="unloadsvgarc" d="' + getArcPath(false) + '" stroke="' + unloadColor + '" fill="none" stroke-width="' + border + '"/>';
		svgstr += '<path class="loadedsvgarc" d="' + getArcPath(true) + '" stroke="' + loadedColor + '" fill="none" stroke-width="' + border + '"/>';
		svgstr += '<text x="' + (r + border) + '" y="' + (r + border + fontSize.replace("px", "").replace("pt", "") / 3) + '" fill="' + textColor + '" style="text-anchor:middle;font-size:' + fontSize + '">'+textDefault+'</text>';
		svgstr += '</svg>';
		loadingContainer = $(svgstr);
		
		unloadsvgarc = $(loadingContainer.find(".unloadsvgarc")[0]); //$(".unloadsvgarc", loadingContainer);
		loadedsvgarc = $(loadingContainer.find(".loadedsvgarc")[0]); //$(".loadedsvgarc", loadingContainer);
		loadedText = $(loadingContainer.find("text")[0]); //$("text", loadingContainer);
	}

	function getPoint(angle) {
		var x = r + border - r * Math.cos(angle * Math.PI / 180);
		var y = r + border - r * Math.sin(angle * Math.PI / 180);
		return {
			x: x,
			y: y
		};
	}

	function getArcPath(loaded) {
		endAngle = startAngle + angleRang;
		var start = getPoint(startAngle);
		var end = getPoint(endAngle);
		var islargeArc = (angleRang > 180 && loaded) || (angleRang < 180 && !loaded);
		return "M " + start.x + " " + start.y + " A " + r + " " + r + " 0 " + (islargeArc ? 1 : 0) + " " + (loaded ? 1 : 0) + " " + end.x + " " + end.y;
	}

	function drawframe() {
		startAngle += step;
		unloadsvgarc.attr("d", getArcPath(false));
		loadedsvgarc.attr("d", getArcPath(true));
	}
	this.play = function () {
		if(options.hasMask)ct.append(mask);
		ct.append(loadingContainer);
		
		timer = setInterval(function () {
			drawframe();
		}, 1000 / fps);
	}
	this.stop = function () {
		window.clearInterval(timer);
		loadingContainer.remove();
		mask.remove();
	}
	this.pause = function () {
		window.clearInterval(timer);
	}
	this.updateLoaded = function (per) {
		angleRang = angleRangDefault + per * (360 - angleRangDefault) / 100;
		loadedText[0].textContent = per + "%";
		if (per >= 100) this.stop();
	}
	init();
	return this;
}

if (typeof module !== 'undefined' && typeof exports === 'object') {
	module.exports = SVGLoading;
} else {
	window.SVGLoading = SVGLoading;
}