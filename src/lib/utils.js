export function extend(defaultOption, options) {
  var temp = {};
  for (var i in defaultOption) {
    temp[i] = defaultOption[i];
  }
  for (var j in options) {
    temp[j] = options[j];
  }
  return temp;
}
export function C3Event(type, data) {
  this.type = type;
  this.data = data;
  this.target = null;
}
export function C3EventDispatcher() {
  var event = {};
  this.addEventListener = function(eventType, callback) {
    if (event[eventType] == null) event[eventType] = [];
    if (event[eventType].indexOf(callback) == -1) event[eventType].push(callback);
  };
  this.removeEventListener = function(eventType, callback) {
    if (event[eventType] == null) event[eventType] = [];
    if (callback == null) {
      if (event[eventType].length > 0) event[eventType] = [];
    } else {
      var index = event[eventType].indexOf(callback);
      if (index > -1) {
        event[eventType].splice(index, 1);
      }
    }
  };
  this.dispatchEvent = function(e) {
    e.target = this;
    if (event[e.type] != null) {
      for (var i = 0; i < event[e.type].length; i++) {
        event[e.type][i](e);
      }
    }
  };
  this.hasEventListener = function(eventType) {
    if (event[eventType] == null) event[eventType] = [];
    return event[eventType].length > 0;
  };
}
export function isMobile() {
  return /(iphone|ios|android|iPad)/i.test(navigator.userAgent);
}

export function prevent(e) {
  e.stopPropagation();
  e.preventDefault();
}

export function css(element, cssObject) {
  var cssText = element.style.cssText;
  //console.log(1, cssText);
  for (var key in cssObject) {
    var reg = new RegExp(key + ' *: *([^;]*)', 'i');
    cssText = cssText.replace(reg, function() {
      var target = cssObject[key];
      delete cssObject[key];
      return key + ':' + target;
    });
  }
  var appentCss = '';
  for (var key in cssObject) {
    appentCss = appentCss + key + ':' + cssObject[key] + ';';
  }
  if (appentCss.length > 0) {
    if (cssText.substring(cssText.length - 1) != ';' && cssText.length > 0) cssText = cssText + ';';
    cssText = cssText + appentCss;
  }
  //console.log(2, cssText);
  element.style.cssText = cssText;
}

NodeList.prototype.addEventListener = function(event, listener, useCapture) {
  for (var i = 0; i < this.length; i++) {
    this[i].addEventListener(event, listener, useCapture || false);
  }
};

NodeList.prototype.removeEventListener = function(event, listener, useCapture) {
  for (var i = 0; i < this.length; i++) {
    this[i].removeEventListener(event, listener, useCapture || false);
  }
};

NodeList.prototype.addClass = function(className) {
  for (var i = 0; i < this.length; i++) {
    this[i].classList.add(className);
  }
};

NodeList.prototype.removeClass = function(className) {
  for (var i = 0; i < this.length; i++) {
    this[i].classList.remove(className);
  }
};

NodeList.prototype.remove = function() {
  for (var i = 0; i < this.length; i++) {
    this[i].remove();
  }
};
