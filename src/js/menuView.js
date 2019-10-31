import { isMobile, prevent } from '../lib/utils';
import { disable, show } from './utils';
import { loaedPhotoModel, isHiResModel } from './models';
import core from './core';

var view;
var _cropMouseDown, _cropMouseUp;
if (isMobile()) {
  _cropMouseDown = 'touchstart';
  _cropMouseUp = 'touchend';
} else {
  _cropMouseDown = 'mousedown';
  _cropMouseUp = 'mouseup';
}

function init(_view, browserFileHandle) {
  view = _view;
  view.querySelector('#full_photo_label').addEventListener('click', function(e) {
    isHiResModel.setStatus(!isHiResModel.getStatus());
  });
  view.querySelector('#full_photo_radio').addEventListener(_cropMouseDown, function(e) {
    view.querySelector('#full_photo_label').click();
  });
  view.querySelector('#full_photo_radio').addEventListener('click', function(e) {
    prevent(e);
    return false;
  });
  view.querySelectorAll('#crop_change_btn, #crop_input_photo_tip').addEventListener(_cropMouseUp, browserFileHandle);

  view.querySelector('#crop_ratio_btn').addEventListener('click', showRatioSelect);
  function showRatioSelect() {
    view.querySelector('#crop_ratio_btn').removeEventListener('click', showRatioSelect);
    show(view.querySelector('#crop_ratio_select'), true);
    window.setTimeout(function() {
      document.addEventListener('click', hideRatioSelect);
    }, 50);
  }
  function hideRatioSelect() {
    document.removeEventListener('click', hideRatioSelect);
    show(view.querySelector('#crop_ratio_select'), false);
    view.querySelector('#crop_ratio_btn').addEventListener('click', showRatioSelect);
  }
  view.querySelectorAll('#crop_ratio_select li').addEventListener('click', ratioClickHandle);
  view.querySelector('#crop_rotate_btn').addEventListener('click', function() {
    core.addPhotoRotate();
  });
  var zoomTimer;
  view.querySelector('#crop_big_btn').addEventListener(_cropMouseDown, function() {
    window.clearInterval(zoomTimer);
    zoomTimer = window.setInterval(core.zoomPerPhoto, 50, 1.05);
  });
  view.querySelector('#crop_small_btn').addEventListener(_cropMouseDown, function() {
    window.clearInterval(zoomTimer);
    zoomTimer = window.setInterval(core.zoomPerPhoto, 50, 0.95);
  });
  view.addEventListener(_cropMouseUp, function() {
    window.clearInterval(zoomTimer);
    if (zoomTimer) core.checkLimitPosition();
    zoomTimer = null;
  });
  view.querySelector('#crop_restore_btn').addEventListener('click', function() {
    core.restorePhoto();
  });
  loaedPhotoModel.addEventListener('change', function(e) {
    var hasPhoto = e.data.status;
    disable(view.querySelectorAll('#full_photo_radio, #full_photo_label'), hasPhoto);
    disableToolbar();
  });
  isHiResModel.addEventListener('change', function(e) {
    view.querySelector('#full_photo_radio').checked = e.data.status;
    disableToolbar();
    if (e.data.status) {
      core.setPhotoRatio(0);
    } else {
      core.setPhotoRatio(-2);
    }
  });
}
function ratioClickHandle() {
  var ratio = eval(this.getAttribute('data-ratio'));
  core.setPhotoRatio(ratio);
}

function disableToolbar() {
  var hasPhoto = loaedPhotoModel.getStatus();
  var isHiRes = isHiResModel.getStatus();
  disable(view.querySelectorAll('#crop_rotate_btn, #crop_big_btn, #crop_small_btn, #crop_restore_btn, #crop_ratio_btn'), hasPhoto && !isHiRes);
}

function reset(hideHiRes, hideZoom, hideRatio, ratios) {
  show(view.querySelectorAll('#full_photo_radio, #full_photo_label'), !hideHiRes);
  show(view.querySelectorAll('#crop_big_btn, #crop_small_btn'), !hideZoom);
  show(view.querySelector('#crop_ratio_btn'), !hideRatio);
  if (hideRatio == false) {
    view.querySelectorAll('#crop_ratio_select li.user').removeEventListener('click', ratioClickHandle);
    view.querySelectorAll('#crop_ratio_select li.user').remove();
    for (var i = 0; i < ratios.length; i++) {
      var li = document.createElement('li');
      li.setAttribute('data-ratio', ratios[i].replace(':', '/'));
      li.innerText = ratios[i];
      li.classList.add('user');
      view.querySelector('#crop_ratio_select').appendChild(li);
    }
    view.querySelectorAll('#crop_ratio_select li.user').addEventListener('click', ratioClickHandle);
  }
}

export default { init, reset };
