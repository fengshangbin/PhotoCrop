import { extend } from './utils';

export default function SVGLoading(options) {
  options = extend(
    {
      ct: null,
      r: 30,
      border: 5,
      fontSize: '14px',
      loadedColor: '#CF5F5F',
      unloadColor: '#735F57',
      textColor: '#735F57',
      textDefault: '0%',
      hasMask: true
    },
    options
  );
  var ct = options.ct,
    r = options.r,
    border = options.border,
    fontSize = options.fontSize,
    loadedColor = options.loadedColor,
    unloadColor = options.unloadColor,
    textColor = options.textColor,
    textDefault = options.textDefault;

  var startAngle = 0;
  var angleRang = 180;
  var angleRangDefault = 180;
  var endAngle;
  var step = 5;
  var fps = 25;
  var unloadsvgarc, loadedsvgarc, loadedText, loadingContainer, mask;
  var timer;

  function init() {
    mask = document.createElement('div');
    mask.style.position = 'fixed';
    mask.style.zIndex = 999998;
    mask.style.left = 0;
    mask.style.top = 0;
    mask.style.right = 0;
    mask.style.bottom = 0;
    mask.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    loadingContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    loadingContainer.setAttributeNS(null, 'width', 2 * (r + border) + 'px');
    loadingContainer.setAttributeNS(null, 'height', 2 * (r + border) + 'px');
    loadingContainer.style.position = 'fixed';
    loadingContainer.style.zIndex = 999999;
    loadingContainer.style.left = '50%';
    loadingContainer.style.top = '50%';
    loadingContainer.style.marginLeft = '-' + (r + border) + 'px';
    loadingContainer.style.marginTop = '-' + (r + border) + 'px';
    var svgstr = '<path class="unloadsvgarc" d="' + getArcPath(false) + '" stroke="' + unloadColor + '" fill="none" stroke-width="' + border + '"/></path>';
    svgstr += '<path class="loadedsvgarc" d="' + getArcPath(true) + '" stroke="' + loadedColor + '" fill="none" stroke-width="' + border + '"></path>';
    svgstr += '<text x="' + (r + border) + '" y="' + (r + border + fontSize.replace('px', '').replace('pt', '') / 3) + '" fill="' + textColor + '" style="text-anchor:middle;font-size:' + fontSize + '">' + textDefault + '</text>';
    loadingContainer.innerHTML = svgstr;
    unloadsvgarc = loadingContainer.querySelector('.unloadsvgarc');
    loadedsvgarc = loadingContainer.querySelector('.loadedsvgarc');
    loadedText = loadingContainer.querySelector('text');
  }

  function getPoint(angle) {
    var x = r + border - r * Math.cos((angle * Math.PI) / 180);
    var y = r + border - r * Math.sin((angle * Math.PI) / 180);
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
    return 'M ' + start.x + ' ' + start.y + ' A ' + r + ' ' + r + ' 0 ' + (islargeArc ? 1 : 0) + ' ' + (loaded ? 1 : 0) + ' ' + end.x + ' ' + end.y;
  }

  function drawframe() {
    startAngle += step;
    unloadsvgarc.setAttributeNS(null, 'd', getArcPath(false));
    loadedsvgarc.setAttributeNS(null, 'd', getArcPath(true));
  }
  this.play = function() {
    if (loadingContainer == null) init();
    if (ct == null) ct = document.body;
    if (options.hasMask && mask.parentNode == null) ct.appendChild(mask);
    if (loadingContainer.parentNode == null) ct.appendChild(loadingContainer);

    window.clearInterval(timer);
    timer = setInterval(function() {
      drawframe();
    }, 1000 / fps);
  };
  this.stop = function() {
    window.clearInterval(timer);
    loadingContainer.remove();
    mask.remove();
  };
  this.pause = function() {
    window.clearInterval(timer);
  };
  this.updateLoaded = function(per) {
    angleRang = angleRangDefault + (per * (360 - angleRangDefault)) / 100;
    loadedText[0].textContent = per + '%';
    if (per >= 100) this.stop();
  };
  //init();
  return this;
}

/* if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = SVGLoading;
} else {
  window.SVGLoading = SVGLoading;
} */
