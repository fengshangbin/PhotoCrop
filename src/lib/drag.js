import { isMobile } from './utils';

var _cropMouseDown, _cropMouseMove, _cropMouseUp;
if (isMobile()) {
  _cropMouseDown = 'touchstart';
  _cropMouseMove = 'touchmove';
  _cropMouseUp = 'touchend';
} else {
  _cropMouseDown = 'mousedown';
  _cropMouseMove = 'mousemove';
  _cropMouseUp = 'mouseup';
}

var cropDrag = {
  obj: null,
  transZRegexX: /\.*translateX\((.*)px\)/i,
  transZRegexY: /\.*translateY\((.*)px\)/i,
  init: function(options) {
    if (options.handler.length > 0) {
      for (var i = 0; i < options.handler.length; i++) {
        var handlerobj = options.handler[i];
        cropDrag.initUnit(handlerobj, options);
      }
    } else {
    }
  },
  initUnit: function(handlerobj, options) {
    handlerobj.addEventListener(_cropMouseDown, this.start, false);
    //options.handler.onmousedown = this.start;
    handlerobj.root = options.root || handlerobj;
    var root = handlerobj.root;
    root.isLock = options.isLock;
    root.onDragStart = options.dragStart || new Function();
    root.onDrag = options.onDrag || new Function();
    root.onDragEnd = options.onDragEnd || new Function();
  },
  start: function(e) {
    //console.log(e);
    //if (e.changedTouches) console.log(e.changedTouches.length);
    if (e.touches && e.touches.length > 1) return;
    var obj = (cropDrag.obj = this);
    e = cropDrag.fixEvent(e);
    var ex = e.pageX;
    var ey = e.pageY;
    obj.lastMouseX = ex;
    obj.lastMouseY = ey;
    document.addEventListener(_cropMouseUp, cropDrag.end, false);
    document.addEventListener(_cropMouseMove, cropDrag.drag, false);
    if (obj.root.isLock) {
      obj.root.onDragStart();
    } else {
      var x = parseFloat(cropDrag.transZRegexX.exec(obj.root.style.transform)[1] || 0);
      var y = parseFloat(cropDrag.transZRegexY.exec(obj.root.style.transform)[1] || 0);
      obj.root.onDragStart(x, y);
    }
  },
  drag: function(e) {
    //e.preventDefault();
    e = cropDrag.fixEvent(e);
    var ex = e.pageX;
    var ey = e.pageY;
    var root = cropDrag.obj.root;
    var nx = ex - cropDrag.obj.lastMouseX;
    var ny = ey - cropDrag.obj.lastMouseY;
    if (!cropDrag.obj.root.isLock) {
      var x = parseFloat(cropDrag.transZRegexX.exec(root.style.transform)[1] || 0);
      var y = parseFloat(cropDrag.transZRegexY.exec(root.style.transform)[1] || 0);
      nx += x;
      ny += y;
      root.style.transform = root.style.transform.replace('translateX(' + x + 'px)', 'translateX(' + nx + 'px)').replace('translateY(' + y + 'px)', 'translateY(' + ny + 'px)');
    }
    cropDrag.obj.root.onDrag(nx, ny);
    cropDrag.obj.lastMouseX = ex;
    cropDrag.obj.lastMouseY = ey;
  },
  end: function(e) {
    if (cropDrag.obj.root.isLock) {
      cropDrag.obj.root.onDragEnd();
    } else {
      var x = parseFloat(cropDrag.transZRegexX.exec(cropDrag.obj.root.style.transform)[1] || 0);
      var y = parseFloat(cropDrag.transZRegexY.exec(cropDrag.obj.root.style.transform)[1] || 0);
      cropDrag.obj.root.onDragEnd(x, y);
    }
    document.removeEventListener(_cropMouseUp, cropDrag.end, false);
    document.removeEventListener(_cropMouseMove, cropDrag.drag, false);
    cropDrag.obj = null;
  },
  fixEvent: function(e) {
    if (e == null) {
      e = window.event;
      e.pageX = e.clientX + document.documentElement.scrollLeft;
      e.pageY = e.clientY + document.documentElement.scrollTop;
    }
    if (e.pageX == null || e.pageY == null) {
      e = e.changedTouches[0];
    }
    return e;
  }
};

export default cropDrag;
