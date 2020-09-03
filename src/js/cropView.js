import { prevent, css, isMobile } from '../lib/utils';
import cropDrag from '../lib/drag';
import AlloyFinger from 'alloyfinger';
import { show, removeExifRotateInfo, getOrientation, base64ToArrayBuffer } from './utils';
import { loaedPhotoModel, freeRatioModel, isHiResModel } from './models';
import core from './core';

var view, loadingUI;
var img, file;

function init(_view, _loadingUI) {
  view = _view;
  loadingUI = _loadingUI;

  var dropbox = view.querySelector('#crop_input_photo_tip');
  dropbox.addEventListener('dragenter', prevent, false);
  dropbox.addEventListener('dragover', prevent, false);
  dropbox.addEventListener('drop', dropHandle, false);
  function dropHandle(e) {
    prevent(e);
    if (e.dataTransfer.files.length > 0) {
      readFile(e.dataTransfer.files[0]);
    } else {
      var dataTransfer = e.dataTransfer || e.originalEvent.dataTransfer;
      var object = document.createElement('div');
      object.innerHTML = dataTransfer.getData('text/html');
      var img = object.querySelector('img');
      if (img) {
        var insert_pic = img.src;
        if (insert_pic) {
          loadPhoto(insert_pic);
          return;
        }
      }
      var imageUrl = dataTransfer.getData('text');
      if (imageUrl) {
        loadPhoto(imageUrl);
      }
    }
  }
  view.querySelector('#crop_input_photo_tip').addEventListener('paste', function (e) {
    prevent(e);
    var cbd = e.clipboardData;
    var ua = window.navigator.userAgent;
    if (!(e.clipboardData && e.clipboardData.items)) {
      return;
    }
    if (cbd.items && cbd.items.length === 2 && cbd.items[0].kind === 'string' && cbd.items[1].kind === 'file' && cbd.types && cbd.types.length === 2 && cbd.types[0] === 'text/plain' && cbd.types[1] === 'Files' && ua.match(/Macintosh/i) && Number(ua.match(/Chrome\/(\d{2})/i)[1]) < 49) {
      return;
    }
    for (var i = 0; i < cbd.items.length; i++) {
      var item = cbd.items[i];
      if (item.kind == 'file') {
        var blob = item.getAsFile();
        if (blob.size > 0) {
          readFile(blob);
          return;
        }
      }
    }
  });
  if (!isMobile()) {
    cropDrag.init({
      handler: view.querySelectorAll('#crop_drag, .crop_area_box'),
      root: view.querySelector('#crop_photo_bg'),
      onDrag: function (x, y) {
        core.setPhotoBgPosition(x, y);
      },
      onDragEnd: function (x, y) {
        core.checkLimitPosition();
      }
    });
  } else {
    var touchstart = false;
    var lastzZoom = 1;
    var cx, cy;
    var fingerOption = {
      touchStart: function (evt) {
        if (touchstart) evt.preventDefault();
        touchstart = true;
      },
      multipointStart: function (evt) {
        var centerX = (evt.touches[0].pageX + evt.touches[1].pageX) / 2;
        var centerY = (evt.touches[0].pageY + evt.touches[1].pageY) / 2;
        lastzZoom = 1;
        var areaRect = view.querySelector('#crop_area').getBoundingClientRect();
        cx = centerX - areaRect.x;
        cy = centerY - areaRect.y;
      },
      pinch: function (evt) {
        var deltaZoom = evt.zoom / lastzZoom;
        lastzZoom = evt.zoom;
        core.zoomPerPhoto(deltaZoom, cx, cy);
      },
      pressMove: function (evt) {
        var root = view.querySelector('#crop_photo_bg');
        var x = parseFloat(cropDrag.transZRegexX.exec(root.style.transform)[1] || 0);
        var y = parseFloat(cropDrag.transZRegexY.exec(root.style.transform)[1] || 0);
        var nx = evt.deltaX + x;
        var ny = evt.deltaY + y;
        root.style.transform = root.style.transform.replace('translateX(' + x + 'px)', 'translateX(' + nx + 'px)').replace('translateY(' + y + 'px)', 'translateY(' + ny + 'px)');
        core.setPhotoBgPosition(nx, ny);
        evt.preventDefault();
      },
      touchEnd: function (evt) {
        core.checkLimitPosition();
        touchstart = false;
      }
    };
    new AlloyFinger(view.querySelectorAll('#crop_drag'), fingerOption);
    new AlloyFinger(view.querySelectorAll('.crop_area_box'), fingerOption);
  }

  cropDrag.init({
    handler: view.querySelectorAll('.crop_line_t, .crop_line_r, .crop_line_b, .crop_line_l, .crop_coner_lt, .crop_coner_rt, .crop_coner_lb, .crop_coner_rb'),
    isLock: true,
    onDrag: function (x, y) {
      var target = this;
      var isTop = false;
      var isBootom = false;
      var isLeft = false;
      var isRight = false;
      if (target.classList.contains('crop_line_t') || target.classList.contains('crop_coner_lt') || target.classList.contains('crop_coner_rt')) {
        isTop = true;
      }
      if (target.classList.contains('crop_line_b') || target.classList.contains('crop_coner_lb') || target.classList.contains('crop_coner_rb')) {
        isBootom = true;
      }
      if (target.classList.contains('crop_line_l') || target.classList.contains('crop_coner_lt') || target.classList.contains('crop_coner_lb')) {
        isLeft = true;
      }
      if (target.classList.contains('crop_line_r') || target.classList.contains('crop_coner_rt') || target.classList.contains('crop_coner_rb')) {
        isRight = true;
      }
      core.changeBorder(x, y, isTop, isBootom, isLeft, isRight);
    },
    onDragEnd: function () {
      core.releaseCropArea();
    }
  });
  var mouseWheelNumber;
  view.querySelectorAll('#crop_drag, #crop_area').addEventListener('mousewheel', function (e) {
    if (isHiResModel.getStatus()) return;
    prevent(e);
    var delta = e.wheelDelta || (e.originalEvent.wheelDelta && (e.originalEvent.wheelDelta > 0 ? 1 : -1)) || (e.originalEvent.detail && (e.originalEvent.detail > 0 ? -1 : 1));

    var areaRect = view.querySelector('#crop_area').getBoundingClientRect();
    core.zoomPerPhoto(delta > 0 ? 1.1 : 0.9, e.pageX - areaRect.x, e.pageY - areaRect.y);
    window.clearTimeout(mouseWheelNumber);
    window.setTimeout(core.checkLimitPosition, 100);
  });

  loaedPhotoModel.addEventListener('change', function (e) {
    var hasPhoto = e.data.status;
    show(view.querySelectorAll('#crop_area, #crop_photo_bg'), hasPhoto);
    show(view.querySelector('#crop_input_photo_tip'), !hasPhoto);
  });
  freeRatioModel.addEventListener('change', function (e) {
    show(view.querySelectorAll('.crop_line_t, .crop_line_r, .crop_line_b, .crop_line_l, .crop_coner_lt, .crop_coner_rt, .crop_coner_lb, .crop_coner_rb'), e.data.status);
  });
  window.onresize = function () {
    if (view.parentNode) {
      onCropAreaShow();
    }
  };
}

function loadPhoto(photoURL, orientation) {
  //if (/^blob:/i.test(photoURL) == false) file = null;
  if (orientation == null) file = null;
  loadingUI.play();
  img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    loadingUI.stop();
    core.setPhotoSize(img.width, img.height, orientation);
    view.querySelector('#crop_photo_bg').src = photoURL;
    view.querySelector('#crop_photo_inner').src = photoURL;
    loaedPhotoModel.setStatus(true);
  };
  img.onerror = function () {
    loadingUI.stop();
    //alert('Can not load this photo.');
  };
  img.src = photoURL;
}
function getImg() {
  return img;
}

function readFile(_file) {
  file = _file;
  if (URL) {
    if (file && /^image\/\w+/.test(file.type)) {
      loadingUI.play();
      //var blobURL = URL.createObjectURL(file);
      removeExifRotateInfo(file, function (base64) {
        loadPhoto(base64, 0);
        /* var fileReader = new FileReader();
        fileReader.onload = function (e) {
          var orientation = getOrientation(e.target.result);
          //alert(orientation);
          loadPhoto(base64, orientation);
          //loadPhoto(blobURL);
          fileReader = null;
        };
        fileReader.readAsArrayBuffer(file); */
      })
      /* var fileReader = new FileReader();
      fileReader.onload = function (e) {
         var base64 = e.target.result;
         var arrayBuffer = base64ToArrayBuffer(base64);
         var orientation = getOrientation(arrayBuffer);
         //alert(orientation);
         loadPhoto(base64, orientation);
        //loadPhoto(blobURL);
        fileReader = null;
      };
      fileReader.readAsDataURL(file); */
    } else {
      window.alert('Please choose an image file.');
    }
  } else {
    window.alert('The browser not support this.');
  }
}

function getFile() {
  return file;
}

function onCropAreaShow() {
  var cw = view.querySelector('.crop-body').clientWidth || 100;
  var ch = view.querySelector('.crop-body').clientHeight || 100;
  core.setCropSize(cw, ch);
}

function renderBackgroundPhoto(tw, th, tx, ty, ax, ay, rotate) {
  css(view.querySelector('#crop_photo_bg'), {
    width: tw + 'px',
    height: th + 'px',
    transform: 'translateX(' + (ax + tx) + 'px) translateY(' + (ay + ty) + 'px) rotate(' + rotate + 'deg)'
  });
}

function renderCropPhoto(tw, th, tx, ty, rotate) {
  css(view.querySelector('#crop_photo_inner'), {
    width: tw + 'px',
    height: th + 'px',
    transform: 'translateX(' + tx + 'px) translateY(' + ty + 'px) rotate(' + rotate + 'deg)'
  });
}

function renderPhoto(tw, th, tx, ty, ax, ay, rotate) {
  renderBackgroundPhoto(tw, th, tx, ty, ax, ay, rotate);
  renderCropPhoto(tw, th, tx, ty, rotate);
}

function renderCropArea(aw, ah, ax, ay) {
  css(view.querySelector('#crop_area'), {
    width: aw + 'px',
    height: ah + 'px',
    transform: 'translateX(' + ax + 'px) translateY(' + ay + 'px)'
  });
}

var transitionID;
function addTransition(hasTransition) {
  if (hasTransition == null) hasTransition = true;
  if (hasTransition) {
    view.querySelectorAll('#crop_photo_bg, #crop_photo_inner, #crop_area').addClass('crop-transition');
    window.clearTimeout(transitionID);
    transitionID = window.setTimeout(function () {
      addTransition(false);
    }, 150);
  } else {
    view.querySelectorAll('#crop_photo_bg, #crop_photo_inner, #crop_area').removeClass('crop-transition');
  }
}

export default { init, loadPhoto, readFile, getImg, getFile, onCropAreaShow, renderCropPhoto, renderPhoto, renderCropArea, addTransition };
