import html from '../view/photoCrop.html';
import { isMobile } from '../lib/utils';
import SVGLoading from '../lib/svgloading';
import i18n from '../config/i18n.json';
import { disable } from './utils';
import { loaedPhotoModel, freeRatioModel, isHiResModel } from './models';
import cropUI from './cropView';
import menuUI from './menuView';
import core from './core';

var view = document.createElement('div');
view.innerHTML = isMobile() ? html : html.replace('tipMobile', 'tip');

var loadingUI = new SVGLoading({ textColor: '#ccc', textDefault: 'waiting' });

var c3photocropinput;
var currentLanguage = 'en';
var cropCallback;

view.querySelector('#crop_close_btn').addEventListener('click', function(e) {
  close();
});
view.querySelector('#crop_done_btn').addEventListener('click', function(e) {
  loadingUI.play();
  window.setTimeout(function() {
    core.exportPhotoData(cropUI.getImg(), cropUI.getFile(), function(result) {
      if (cropCallback) cropCallback(result);
      loadingUI.stop();
      close();
    });
  }, 50);
});

loaedPhotoModel.addEventListener('change', function(e) {
  disable(view.querySelector('#crop_done_btn'), e.data.status);
});

cropUI.init(view, loadingUI);
menuUI.init(view, browserFileHandle);

export function browserFileHandle() {
  if (c3photocropinput) c3photocropinput.click();
}

function buildC3photocropinput(multiple) {
  clearInput();
  var inputID = 'c3photocropinput' + new Date().getTime();
  c3photocropinput = document.createElement('input');
  c3photocropinput.id = inputID;
  c3photocropinput.type = 'file';
  c3photocropinput.accept = 'image/*';
  if (multiple) c3photocropinput.multiple = 'multiple';
  c3photocropinput.style.display = 'none';
  //c3photocropinput.class = '_c3photocropinputimage';
  view.appendChild(c3photocropinput);
  if (multiple == false) {
    c3photocropinput.changeListener = function() {
      cropUI.readFile(this.files[0]);
    };
    c3photocropinput.addEventListener('change', c3photocropinput.changeListener);
  }
}

function changeLanguage(lan) {
  if (currentLanguage == lan) return;
  var i18nViews = view.querySelectorAll('[data-i18n]');
  for (var i = 0; i < i18nViews.length; i++) {
    var i18nView = i18nViews[i];
    setI18nView(i18nView, lan);
  }
  currentLanguage = lan;
}
function setI18nView(i18nView, lan) {
  var key = i18nView.getAttribute('data-i18n');
  var targetLan = i18n[key][lan];
  if (targetLan == null) targetLan = i18n[key]['en'];
  i18nView.innerHTML = targetLan;
}

export function open(options) {
  options.multiple = options.liteMode && options.multiple && options.defaultPhoto == null;
  buildC3photocropinput(options.multiple);

  cropCallback = options.success;
  var outwh = options.cropSize.split('x');
  if (outwh[0] == '') options.outWidthOption = 0;
  else options.outWidthOption = parseInt(outwh[0]);
  if (outwh[1] == '') options.outHeightOption = 0;
  else options.outHeightOption = parseInt(outwh[1]);

  var thumbwh = options.thumbSize.split('x');
  if (thumbwh[0] == '') options.thumbWidthOption = 0;
  else options.thumbWidthOption = parseInt(thumbwh[0]);
  if (thumbwh[1] == '') options.thumbHeightOption = 0;
  else options.thumbHeightOption = parseInt(thumbwh[1]);

  var hideHiRes, hideRatio, freeRatio;
  var hideZoom = isMobile();
  hideHiRes = !options.supportHiRes;
  if (options.outWidthOption > 0 && options.outHeightOption > 0) {
    hideRatio = true;
    freeRatio = false;
  } else {
    hideRatio = !options.supportRatio;
    freeRatio = true;
  }
  loaedPhotoModel.setStatus(false);
  freeRatioModel.setStatus(freeRatio);
  isHiResModel.setStatus(false);
  core.init(options);

  if (loaedPhotoModel.changeListener) loaedPhotoModel.removeEventListener('change', loaedPhotoModel.changeListener);
  if (options.liteMode) {
    cropUI.onCropAreaShow();
    if (options.multiple == true) {
      var files = null,
        index = 0,
        results = [];
      c3photocropinput.changeListener = function() {
        files = this.files;
        next();
      };
      c3photocropinput.addEventListener('change', c3photocropinput.changeListener);
      function autoDone(e) {
        if (e.data.status) {
          loadingUI.play();
          core.exportPhotoData(cropUI.getImg(), cropUI.getFile(), function(result) {
            results.push(result);
            loadingUI.stop();
            next();
          });
        }
      }
      loaedPhotoModel.changeListener = autoDone;
      loaedPhotoModel.addEventListener('change', loaedPhotoModel.changeListener);
      function next() {
        if (files && index < files.length) {
          cropUI.readFile(files[index]);
          index++;
        } else {
          doneAll();
        }
      }
      function doneAll() {
        if (cropCallback) cropCallback(results);
        loaedPhotoModel.removeEventListener('change', loaedPhotoModel.changeListener);
        close();
      }
    } else {
      function autoDone(e) {
        if (e.data.status) {
          view.querySelector('#crop_done_btn').click();
          loaedPhotoModel.removeEventListener('change', loaedPhotoModel.changeListener);
        }
      }
      loaedPhotoModel.changeListener = autoDone;
      loaedPhotoModel.addEventListener('change', loaedPhotoModel.changeListener);
    }
  } else {
    menuUI.reset(hideHiRes, hideZoom, hideRatio, options.ratio);
    changeLanguage(options.language);
    if (options.title) view.querySelector('.crop-heard span').innerHTML = options.title;
    else setI18nView(view.querySelector('.crop-heard span'), options.language);
    document.body.appendChild(view);
    cropUI.onCropAreaShow();
  }

  if (options.defaultPhoto != null) {
    if (options.defaultPhoto instanceof File) {
      cropUI.readFile(options.defaultPhoto);
    } else {
      cropUI.loadPhoto(options.defaultPhoto);
    }
  } else if (options.liteMode) {
    browserFileHandle();
  }
}
function clearInput() {
  if (c3photocropinput) {
    c3photocropinput.removeEventListener('change', c3photocropinput.changeListener);
    c3photocropinput.remove();
    c3photocropinput = null;
  }
}

export function close() {
  view.remove();
  clearInput();
}
