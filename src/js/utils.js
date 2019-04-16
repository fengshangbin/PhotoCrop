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

function getStringFromCharCode(dataView, start, length) {
  var str = '';
  var i;
  for (i = start, length += start; i < length; i++) {
    str += String.fromCharCode(dataView.getUint8(i));
  }
  return str;
}

export function getOrientation(arrayBuffer) {
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
  if (ifdStart) {
    length = dataView.getUint16(ifdStart, littleEndian);

    for (i = 0; i < length; i++) {
      offset = ifdStart + i * 12 + 2;
      if (dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */) {
        // 8 is the offset of the current tag's value
        offset += 8;

        // Get the original orientation value
        orientation = dataView.getUint16(offset, littleEndian);

        // Override the orientation with its default value for Safari (#120)
        /* if (IS_SAFARI_OR_UIWEBVIEW) {
          dataView.setUint16(offset, 1, littleEndian);
        } */
        break;
      }
    }
  }
  return orientation;
}
