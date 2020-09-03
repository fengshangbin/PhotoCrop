export function disable(elements, state) {
  if (elements.length) {
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList[state ? 'remove' : 'add']('photocropdisable');
    }
  } else {
    elements.classList[state ? 'remove' : 'add']('photocropdisable');
  }
}

export function show(elements, state) {
  if (elements.length) {
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList[state ? 'remove' : 'add']('photocrop-hide');
    }
  } else {
    elements.classList[state ? 'remove' : 'add']('photocrop-hide');
  }
}

export function removeExifRotateInfo(file, callback) {
  var blobURL = URL.createObjectURL(file);
  var fileReader = new FileReader();
  fileReader.onload = function (e) {
    var orientationAndPixelDimension = getOrientationAndPixelDimension(e.target.result);
    var rotate = orientationAndPixelDimension.orientation;
    var pixelXDimension = orientationAndPixelDimension.pixelXDimension;
    var pixelYDimension = orientationAndPixelDimension.pixelYDimension;
    if (rotate > 0) {
      if (rotate == 3) rotate = 180;
      else if (rotate == 6) rotate = 90;
      else if (rotate == 8) rotate = -90;
      else rotate = 0;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        //core.setPhotoSize(img.width, img.height, orientation);
        var w = img.width;
        var h = img.height;
        var x = 0;
        var y = 0;
        //alert(w + ", " + pixelXDimension + " | " + h + ", " + pixelYDimension + " | " + rotate);
        if (w == pixelXDimension && h == pixelYDimension && rotate != 0) {
          /* w=h;
          h=img.width; */
          var canvas = document.createElement('canvas');
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
            ctx.drawImage(img, x, y, w, h, (w - h) / 2, (w - h) / 2, w, h);
          } else if (rotate == 270) {
            ctx.drawImage(img, x, y, w, h, (h - w) / 2, (h - w) / 2, w, h);
          } else {
            ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          }
          /* canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h); */
          callback(canvas.toDataURL());
        } else {
          callback(blobURL);
        }
      };
      img.src = blobURL;
    } else {
      callback(blobURL);
    }
    fileReader = null;
  };
  fileReader.readAsArrayBuffer(file);
}

export function base64ToArrayBuffer(base64) {
  base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
  var binary = atob(base64);
  var len = binary.length;
  var buffer = new ArrayBuffer(len);
  var view = new Uint8Array(buffer);
  for (var i = 0; i < len; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function getStringFromCharCode(dataView, start, length) {
  var str = '';
  var i;
  for (i = start, length += start; i < length; i++) {
    str += String.fromCharCode(dataView.getUint8(i));
  }
  return str;
}

export function getOrientationAndPixelDimension(arrayBuffer) {
  var dataView = new DataView(arrayBuffer);
  var length = dataView.byteLength;
  var orientation;
  var exifIDCode;
  var tiffOffset;
  var firstIFDOffset;
  var littleEndian;
  var endianness;
  var app1Start;
  var ifdStart;
  var offset;
  var i;
  // Only handle JPEG image (start by 0xFFD8)
  if (dataView.getUint8(0) === 0xff && dataView.getUint8(1) === 0xd8) {
    offset = 2;
    while (offset < length) {
      if (dataView.getUint8(offset) === 0xff && dataView.getUint8(offset + 1) === 0xe1) {
        app1Start = offset;
        break;
      }
      offset++;
    }
  }
  if (app1Start) {
    exifIDCode = app1Start + 4;
    tiffOffset = app1Start + 10;
    if (getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
      endianness = dataView.getUint16(tiffOffset);
      littleEndian = endianness === 0x4949;

      if (littleEndian || endianness === 0x4d4d /* bigEndian */) {
        if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002a) {
          firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);

          if (firstIFDOffset >= 0x00000008) {
            ifdStart = tiffOffset + firstIFDOffset;
          }
        }
      }
    }
  }
  var exifIFDPointer, pixelXDimension, pixelYDimension;
  if (ifdStart) {
    length = dataView.getUint16(ifdStart, littleEndian);

    for (i = 0; i < length; i++) {
      offset = ifdStart + i * 12 + 2;
      /* Orientation */
      if (dataView.getUint16(offset, littleEndian) === 0x0112) {
        // 8 is the offset of the current tag's value
        offset += 8;
        // Get the original orientation value
        orientation = dataView.getUint16(offset, littleEndian);
        //console.log(orientation);
        // Override the orientation with its default value for Safari (#120)
        /* if (IS_SAFARI_OR_UIWEBVIEW) {
          dataView.setUint16(offset, 1, littleEndian);
        } */
        //break;
      }
      /* ExifIFDPointer */
      if (dataView.getUint16(offset, littleEndian) === 0x8769) {
        offset += 8;
        exifIFDPointer = dataView.getUint32(offset, littleEndian);
      }

    }
  }
  if (exifIFDPointer) {
    var tagStart = tiffOffset + exifIFDPointer;
    length = dataView.getUint16(tagStart, littleEndian);
    for (i = 0; i < length; i++) {
      offset = tagStart + i * 12 + 2;
      /* PixelXDimension */
      if (dataView.getUint16(offset, littleEndian) === 0xA002) {
        offset += 8;
        pixelXDimension = dataView.getUint32(offset, littleEndian);
      }
      /* PixelYDimension */
      if (dataView.getUint16(offset, littleEndian) === 0xA003) {
        offset += 8;
        pixelYDimension = dataView.getUint32(offset, littleEndian);
      }
    }
  }
  return { orientation: orientation, pixelXDimension: pixelXDimension, pixelYDimension: pixelYDimension };
}
