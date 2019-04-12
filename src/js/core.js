import cropscale from '../lib/scale';
import { isHiResModel, freeRatioModel } from './models';
import cropUI from './cropView';

var ow = 0,
  oh = 0; //图片原始宽高
var aw = 0,
  ah = 0; //裁剪区域宽高
var ax = 0,
  ay = 0; //裁剪区域坐标
var cw = 0,
  ch = 0; //裁剪容器宽高
var tw = 0,
  th = 0; //图片当前显示的宽高
var tx = 0,
  ty = 0; //图片当前显示的坐标
var rotate = 0; //图片旋转角度
var ratio = 0; //裁剪区域宽高比
var oscale = 0; //原始图片宽高比

var gap = 0; //裁剪容器边距
var mimimum = 20; //图片最大边的最小值
var fullshow = false; //是否强制填满裁剪区域
var photoExt = 'jpg'; //输出图片格式
var outWidthOption, outHeightOption, thumbWidthOption, thumbHeightOption; //输出宽高参数

var outWidth, outHeight, thumbWidth, thumbHeight; //最终输出宽高
var lockRatio = false;

function init(option) {
  gap = option.gap;
  mimimum = option.mimimum;
  fullshow = option.fullshow;
  photoExt = option.photoExt;

  outWidthOption = option.outWidthOption;
  outHeightOption = option.outHeightOption;
  thumbWidthOption = option.thumbWidthOption;
  thumbHeightOption = option.thumbHeightOption;

  if (outWidthOption > 0 && outHeightOption > 0) {
    setPhotoRatio(outWidthOption / outHeightOption);
  } else {
    setPhotoRatio(-1);
  }
}

function restorePhoto(_rotate) {
  rotate = _rotate ? _rotate : 0;

  if (ow == 0 || oh == 0) return;

  if (lockRatio == false) {
    if (rotate == 90 || rotate == 270) {
      ratio = oh / ow;
    } else {
      ratio = ow / oh;
    }
  }
  //console.log(ratio);

  setArea();
  setPhoto();

  cropUI.renderPhoto(tw, th, tx, ty, ax, ay, rotate);
  cropUI.renderCropArea(aw, ah, ax, ay);
}

function setArea() {
  if (cw / ch < ratio) {
    aw = cw;
    ah = aw / ratio;
  } else {
    ah = ch;
    aw = ah * ratio;
  }
  ax = gap + (cw - aw) / 2;
  ay = gap + (ch - ah) / 2;
  resetOutSize();
}

function setPhoto() {
  if (rotate == 90 || rotate == 270) {
    tw = Math.max(Math.ceil((ow * aw) / oh), ah);
    th = Math.max(Math.ceil((oh * ah) / ow), aw);
  } else {
    tw = Math.max(Math.ceil((ow * ah) / oh), aw);
    th = Math.max(Math.ceil((oh * aw) / ow), ah);
  }
  tx = (aw - tw) / 2;
  ty = (ah - th) / 2;
}

function resetOutSize() {
  if (isHiResModel.getStatus()) {
    outWidth = ow;
    outHeight = oh;
  } else {
    if (outWidthOption > 0 || outHeightOption > 0) {
      if (outWidthOption == 0) {
        outWidth = (aw * outHeightOption) / ah;
        outHeight = outHeightOption;
      } else if (outHeightOption == 0) {
        outHeight = (ah * outWidthOption) / aw;
        outWidth = outWidthOption;
      } else {
        outWidth = outWidthOption;
        outHeight = outHeightOption;
      }
    } else {
      alert('error out size');
    }
  }
  if (thumbWidthOption > 0 || thumbHeightOption > 0) {
    if (thumbWidthOption == 0) {
      thumbWidth = (aw * thumbHeightOption) / ah;
      thumbHeight = thumbHeightOption;
    } else if (thumbHeightOption == 0) {
      thumbHeight = (ah * thumbWidthOption) / aw;
      thumbWidth = thumbWidthOption;
    } else {
      thumbWidth = thumbWidthOption;
      thumbHeight = thumbHeightOption;
    }
  } else {
    thumbWidth = thumbWidthOption;
    thumbHeight = thumbHeightOption;
  }
}

function setCropSize(_cw, _ch) {
  cw = _cw - gap * 2;
  ch = _ch - gap * 2;
  restorePhoto();
}
function setPhotoSize(_ow, _oh) {
  ow = _ow;
  oh = _oh;
  oscale = ow / oh;
  restorePhoto();
}
function setPhotoRatio(_ratio) {
  ratio = _ratio;
  if (ratio == -2) {
    if (outWidthOption > 0 && outHeightOption > 0) {
      ratio = outWidthOption / outHeightOption;
    } else {
      ratio = -1;
    }
  }
  lockRatio = ratio > 0;
  freeRatioModel.setStatus(ratio == -1);
  restorePhoto();
}
function addPhotoRotate() {
  rotate += 90;
  if (rotate == 360) rotate = 0;
  restorePhoto(rotate);
}
function setPhotoBgPosition(x, y) {
  tx = x - ax;
  ty = y - ay;
  cropUI.renderCropPhoto(tw, th, tx, ty, rotate);
}
function changeTopBorder(y) {
  if (ah > mimimum + y && ah < ch + y && ay > gap - y) {
    ay += y;
    ah -= y;
    ty -= y;
  }
}
function changeBottomBorder(y) {
  if (ah > mimimum - y && ah < ch - y && ay + ah < ch + gap - y) {
    ah += y;
  }
}
function changeLeftBorder(x) {
  if (aw > mimimum + x && aw < cw + x && ax > gap - x) {
    ax += x;
    aw -= x;
    tx -= x;
  }
}
function changeRightBorder(x) {
  if (aw > mimimum - x && aw < cw - x && ax + aw < cw + gap - x) {
    aw += x;
  }
}
function changeBorder(x, y, top, bottom, left, right) {
  if (top) changeTopBorder(y);
  if (bottom) changeBottomBorder(y);
  if (left) changeLeftBorder(x);
  if (right) changeRightBorder(x);
  cropUI.renderCropArea(aw, ah, ax, ay);
  cropUI.renderCropPhoto(tw, th, tx, ty, rotate);
}

function zoomPerPhoto(per, cx, cy, withoutRender) {
  var step = 0;
  if (tw > th) {
    step = tw * (per - 1);
  } else {
    step = th * (per - 1);
  }
  zoomPhoto(step, cx, cy, withoutRender);
}

function zoomPhoto(step, cx, cy, withoutRender) {
  var tw_offset, th_offset, tx_offset, ty_offset;
  var centerPercentX = ((cx == null ? aw / 2 : cx) - tx) / tw;
  var centerPercentY = ((cy == null ? ah / 2 : cy) - ty) / th;

  /* var centerPercentX = cx == null ? (aw / 2 - tx) / tw : cx;
  var centerPercentY = cy == null ? (ah / 2 - ty) / th : cy; */

  centerPercentX = Math.min(1, Math.max(0, centerPercentX));
  centerPercentY = Math.min(1, Math.max(0, centerPercentY));

  if (tw > th) {
    tw_offset = step;
    th_offset = tw_offset / oscale;
  } else {
    th_offset = step;
    tw_offset = th_offset * oscale;
  }
  var finaleSizeOffset = checkLimitSize(tw_offset, th_offset);
  tw_offset = finaleSizeOffset.x;
  th_offset = finaleSizeOffset.y;
  tx_offset = tw_offset * -centerPercentX;
  ty_offset = th_offset * -centerPercentY;
  //console.log(cx, cy, centerPercentX, centerPercentY);
  tw += tw_offset;
  th += th_offset;
  tx += tx_offset;
  ty += ty_offset;
  //console.log(tw,th,tx,ty);
  //console.log(cx,cy,tx_offset,ty_offset);
  if (withoutRender == null) cropUI.renderPhoto(tw, th, tx, ty, ax, ay, rotate);
}

var finaleSizePoint = { x: 0, y: 0 };
function checkLimitSize(tw_offset, th_offset) {
  if (oscale > 1) {
    if (tw + tw_offset < mimimum) {
      tw_offset = mimimum - tw;
      th_offset = tw_offset / oscale;
    }
  } else {
    if (th + th_offset < mimimum) {
      th_offset = mimimum - th;
      tw_offset = th_offset * oscale;
    }
  }
  finaleSizePoint.x = tw_offset;
  finaleSizePoint.y = th_offset;
  return finaleSizePoint;
}

function checkLimitPosition() {
  if (fullshow) {
    if (rotate == 90 || rotate == 270) {
      if (th < aw) {
        if (oscale > 1) zoomPhoto((aw - th) * oscale, null, null, true);
        else zoomPhoto(aw - th, null, null, true);
      }
      if (tw < ah) {
        if (oscale > 1) zoomPhoto(ah - tw, null, null, true);
        else zoomPhoto((ah - tw) / oscale, null, null, true);
      }
      var ltx = (th - tw) / 2;
      var lty = (tw - th) / 2;
      if (tx > ltx) tx = ltx;
      if (ty > lty) ty = lty;
      if (tx + th < aw + ltx) tx = aw - th + ltx;
      if (ty + tw < ah + lty) ty = ah - tw + lty;
    } else {
      if (tw < aw) {
        if (oscale > 1) zoomPhoto(aw - tw, null, null, true);
        else zoomPhoto((aw - tw) / oscale, null, null, true);
      }
      if (th < ah) {
        if (oscale > 1) zoomPhoto((ah - th) * oscale, null, null, true);
        else zoomPhoto(ah - th, null, null, true);
      }
      if (tx > 0) tx = 0;
      if (ty > 0) ty = 0;
      if (tx + tw < aw) tx = aw - tw;
      if (ty + th < ah) ty = ah - th;
    }
    cropUI.addTransition();
    cropUI.renderPhoto(tw, th, tx, ty, ax, ay, rotate);
  }
}
function releaseCropArea() {
  var old_aw = aw;
  /* old_ah = ah,
    old_ax = ax,
    old_ay = ay; */
  ratio = aw / ah;
  setArea();
  cropUI.addTransition();
  cropUI.renderCropArea(aw, ah, ax, ay);
  var needScale = aw / old_aw;
  var step;
  if (tw > th) step = tw * needScale - tw;
  else step = th * needScale - th;
  zoomPhoto(step, 0, 0, true);
  if (fullshow) {
    checkLimitPosition();
  } else {
    cropUI.renderPhoto(tw, th, tx, ty, ax, ay, rotate);
  }
}

function getCropArea() {
  var scale = tw / ow;
  var ltx, lty, cropW, cropH, cropX, cropY;
  if (rotate == 90 || rotate == 270) {
    cropW = ah / scale;
    cropH = aw / scale;
  } else {
    cropW = aw / scale;
    cropH = ah / scale;
  }

  if (rotate == 0) {
    ltx = 0;
    lty = 0;
    cropX = (tx - ltx) / scale;
    cropY = (ty - lty) / scale;
  } else if (rotate == 90) {
    ltx = aw - (tw + th) / 2;
    lty = (tw - th) / 2;
    cropY = -(tx - ltx) / scale;
    cropX = (ty - lty) / scale;
  } else if (rotate == 180) {
    ltx = aw - tw;
    lty = ah - th;
    cropX = -(tx - ltx) / scale;
    cropY = -(ty - lty) / scale;
  } else if (rotate == 270) {
    ltx = (th - tw) / 2;
    lty = ah - (th + tw) / 2;
    cropY = (tx - ltx) / scale;
    cropX = -(ty - lty) / scale;
  }
  return { x: -cropX, y: -cropY, w: cropW, h: cropH, rotate: rotate };
}

function createPhotoCanvas(source, x, y, w, h, rotate, outWidth, outHeight) {
  var canvas = document.createElement('canvas');
  var r = Math.max(w, h);
  if (rotate == 90 || rotate == 270) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }
  var ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  if (rotate == 90) {
    ctx.drawImage(source, x, y, w, h, (w - h) / 2, (w - h) / 2, w, h);
  } else if (rotate == 270) {
    ctx.drawImage(source, x, y, w, h, (h - w) / 2, (h - w) / 2, w, h);
  } else {
    ctx.drawImage(source, x, y, w, h, 0, 0, w, h);
  }
  var outCanvas = cropscale({ width: Math.floor(outWidth), height: Math.floor(outHeight) }, canvas);
  canvas = null;
  return outCanvas;
}

function createThumbCanvas(source, ow, oh, aw, ah) {
  if (ow == aw && oh == ah) return source;
  var canvas = document.createElement('canvas');
  canvas.width = aw;
  canvas.height = ah;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(source, (ow - aw) / 2, (oh - ah) / 2, aw, ah, 0, 0, aw, ah);
  return canvas;
}

function toDataJpg(canvas) {
  var backgroundColor = '#ffffff';
  var context = canvas.getContext('2d');
  //var compositeOperation = context.globalCompositeOperation;
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  var imageData = canvas.toDataURL('image/jpeg', 0.99);
  return imageData;
}

function exportPhotoData(img, file, callback) {
  var cropData = getCropArea();
  var data, thumb, thumbCanvas;
  if (isHiResModel.getStatus() == false || file == null) {
    var dataCanvas = createPhotoCanvas(img, cropData.x, cropData.y, cropData.w, cropData.h, cropData.rotate, outWidth, outHeight);
    if (photoExt == 'jpg') {
      data = toDataJpg(dataCanvas);
    } else {
      data = dataCanvas.toDataURL();
    }
    thumb = exportThumbData(dataCanvas, 0, 0, outWidth, outHeight);
    cropPhotoCallBack(data, thumb, file || img.src, callback);
  } else {
    var reader = new FileReader();
    reader.onload = function(e) {
      data = e.target.result;
      thumb = exportThumbData(img, 0, 0, outWidth, outHeight);
      cropPhotoCallBack(data, thumb, file, callback);
      reader = null;
    };
    reader.readAsDataURL(file);
  }
}

function exportThumbData(source, x, y, w, h) {
  if (thumbWidth == 0 || thumbHeight == 0) return null;
  var ttw = Math.max(Math.ceil((outWidth * thumbHeight) / outHeight), thumbWidth);
  var tth = Math.max(Math.ceil((outHeight * thumbWidth) / outWidth), thumbHeight);
  var thumbCanvas = createPhotoCanvas(source, x, y, w, h, 0, ttw, tth);
  thumbCanvas = createThumbCanvas(thumbCanvas, ttw, tth, thumbWidth, thumbHeight);
  var data;
  if (photoExt == 'jpg') {
    data = toDataJpg(thumbCanvas);
  } else {
    data = thumbCanvas.toDataURL();
  }
  thumbCanvas = null;
  return data;
}

function cropPhotoCallBack(data, thumb, file, callback) {
  var index = data.indexOf(',');
  if (thumb) thumb = thumb.substr(thumb.indexOf(',') + 1);
  var cropData = {
    data: data.substr(index + 1),
    thumb: thumb,
    isHiRes: isHiResModel.getStatus(),
    ext: /^data:image\/([^;+]*)/i.exec(data.substring(0, index))[1],
    originalFile: file
  };
  callback(cropData);
}

export default { init, setCropSize, setPhotoSize, setPhotoBgPosition, checkLimitPosition, changeBorder, releaseCropArea, zoomPhoto, zoomPerPhoto, setPhotoRatio, addPhotoRotate, restorePhoto, exportPhotoData };
