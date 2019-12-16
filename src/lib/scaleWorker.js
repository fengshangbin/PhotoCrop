function scale(_sw, _sh, _dw, _dh, _sourceBuffer, imageData){
var HAS_ALPHA = true,
    sw,
    sh,
    dw,
    dh,
    sourceBuffer,
    dw4,
    sw4,
    sx,
    sy,
    sindex,
    dx,
    dy,
    dyindex,
    dindex,
    idx,
    idy,
    isx,
    isy,
    w,
    wx,
    nwx,
    wy,
    nwy,
    crossX,
    crossY,
    dwh4,
    tmpBuffer,
    r,
    g,
    b,
    a,
    dsy,
    dsx,
    TIMES = 255.99 / 255,
    row0,
    row1,
    row2,
    row3,
    col0,
    col1,
    col2,
    col3,
    scaleX,
    scaleY,
    scaleXY;

    sw=_sw;
    sh=_sh;
    dw = _dw;
    dh = _dh;
    sourceBuffer=_sourceBuffer;
    dw4 = dw << 2;
    sw4 = sw << 2;
    dwh4 = dw4 * dh;
    scaleX = dw / sw;
    scaleY = dh / sh;
    scaleXY = scaleX * scaleY;
    sindex = 0;
    dindex = 0;
    var byteBuffer = imageData.data;
    if (scaleX > 1 || scaleY > 1) {
        upscale(byteBuffer);
    }else{
        downscale(byteBuffer);
    }

    function bicubic(t, a, b, c, d) {
        return 0.5 * (c - a + (2 * a - 5 * b + 4 * c - d + (3 * (b - c) + d - a) * t) * t) * t + b;
    };

    function upscale(byteBuffer){
        // UPSCALE by bicubic
        for (dy = 0; dy < dh; dy++) {
        sy = dy / scaleY;
        isy = sy | 0;
        dsy = sy - isy;
        row1 = isy * sw4;
        row0 = isy < 1 ? row1 : row1 - sw4;
        if (isy < sh - 2) {
            row2 = row1 + sw4;
            row3 = (isy + 2) * sw4;
        } else {
            row2 = row3 = isy > sh - 2 ? row1 : row1 + sw4;
        }

        for (dx = 0; dx < dw; dx++, dindex += 4) {
            sx = dx / scaleX;
            isx = sx | 0;
            dsx = sx - isx;
            col1 = isx << 2;
            col0 = isx < 1 ? col1 : col1 - 4;
            if (isx < sw - 2) {
            col2 = col1 + 4;
            col3 = col1 + 8;
            } else {
            col2 = col3 = isx > sw - 2 ? col1 : col1 + 4;
            }

            // RED
            r =
            (bicubic(
                dsy,
                bicubic(dsx, sourceBuffer[row0 + col0], sourceBuffer[row0 + col1], sourceBuffer[row0 + col2], sourceBuffer[row0 + col3]),
                bicubic(dsx, sourceBuffer[row1 + col0], sourceBuffer[row1 + col1], sourceBuffer[row1 + col2], sourceBuffer[row1 + col3]),
                bicubic(dsx, sourceBuffer[row2 + col0], sourceBuffer[row2 + col1], sourceBuffer[row2 + col2], sourceBuffer[row2 + col3]),
                bicubic(dsx, sourceBuffer[row3 + col0], sourceBuffer[row3 + col1], sourceBuffer[row3 + col2], sourceBuffer[row3 + col3])
            ) *
                TIMES) |
            0;

            // GREEN
            ++col0, ++col1, ++col2, ++col3;
            g =
            (bicubic(
                dsy,
                bicubic(dsx, sourceBuffer[row0 + col0], sourceBuffer[row0 + col1], sourceBuffer[row0 + col2], sourceBuffer[row0 + col3]),
                bicubic(dsx, sourceBuffer[row1 + col0], sourceBuffer[row1 + col1], sourceBuffer[row1 + col2], sourceBuffer[row1 + col3]),
                bicubic(dsx, sourceBuffer[row2 + col0], sourceBuffer[row2 + col1], sourceBuffer[row2 + col2], sourceBuffer[row2 + col3]),
                bicubic(dsx, sourceBuffer[row3 + col0], sourceBuffer[row3 + col1], sourceBuffer[row3 + col2], sourceBuffer[row3 + col3])
            ) *
                TIMES) |
            0;

            // BLUE
            ++col0, ++col1, ++col2, ++col3;
            b =
            (bicubic(
                dsy,
                bicubic(dsx, sourceBuffer[row0 + col0], sourceBuffer[row0 + col1], sourceBuffer[row0 + col2], sourceBuffer[row0 + col3]),
                bicubic(dsx, sourceBuffer[row1 + col0], sourceBuffer[row1 + col1], sourceBuffer[row1 + col2], sourceBuffer[row1 + col3]),
                bicubic(dsx, sourceBuffer[row2 + col0], sourceBuffer[row2 + col1], sourceBuffer[row2 + col2], sourceBuffer[row2 + col3]),
                bicubic(dsx, sourceBuffer[row3 + col0], sourceBuffer[row3 + col1], sourceBuffer[row3 + col2], sourceBuffer[row3 + col3])
            ) *
                TIMES) |
            0;

            byteBuffer[dindex] = r >= 0 ? (r < 256 ? r : 255) : 0;
            byteBuffer[dindex + 1] = g >= 0 ? (g < 256 ? g : 255) : 0;
            byteBuffer[dindex + 2] = b >= 0 ? (b < 256 ? b : 255) : 0;

            if (HAS_ALPHA) {
                // ALPHA
                ++col0, ++col1, ++col2, ++col3;
                a =
                    (bicubic(
                    dsy,
                    bicubic(dsx, sourceBuffer[row0 + col0], sourceBuffer[row0 + col1], sourceBuffer[row0 + col2], sourceBuffer[row0 + col3]),
                    bicubic(dsx, sourceBuffer[row1 + col0], sourceBuffer[row1 + col1], sourceBuffer[row1 + col2], sourceBuffer[row1 + col3]),
                    bicubic(dsx, sourceBuffer[row2 + col0], sourceBuffer[row2 + col1], sourceBuffer[row2 + col2], sourceBuffer[row2 + col3]),
                    bicubic(dsx, sourceBuffer[row3 + col0], sourceBuffer[row3 + col1], sourceBuffer[row3 + col2], sourceBuffer[row3 + col3])
                    ) *
                    TIMES) |
                    0;
                byteBuffer[dindex + 3] = a >= 0 ? (a < 256 ? a : 255) : 0;
            } else {
                byteBuffer[dindex + 3] = 255;
            }
        }
        }
    }

    function downscale(byteBuffer){
        // DOWNSCALE by algorithm
        if (typeof Float32Array == 'function') {
        tmpBuffer = new Float32Array(dwh4);
        } else {
        tmpBuffer = [];
        for (dindex = 0; dindex < dwh4; ++dindex) {
            tmpBuffer[dindex] = 0;
        }
        }
        for (sy = 0; sy < sh; sy++) {
        dy = sy * scaleY;
        idy = dy | 0;
        dyindex = idy * dw4;
        crossY = !!((idy - ((dy + scaleY) | 0)) * (sh - 1 - sy)) << 1;
        if (crossY) {
            wy = idy + 1 - dy;
            nwy = dy + scaleY - idy - 1;
        }
        for (sx = 0; sx < sw; sx++, sindex += 4) {
            dx = sx * scaleX;
            idx = dx | 0;
            dindex = dyindex + (idx << 2);
            crossX = !!((idx - ((dx + scaleX) | 0)) * (sw - 1 - sx));
            if (crossX) {
            wx = idx + 1 - dx;
            nwx = dx + scaleX - idx - 1;
            }
            r = sourceBuffer[sindex];
            g = sourceBuffer[sindex + 1];
            b = sourceBuffer[sindex + 2];
            if (HAS_ALPHA) a = sourceBuffer[sindex + 3];
            switch (crossX + crossY) {
            case 0:
                tmpBuffer[dindex] += r * scaleXY;
                tmpBuffer[dindex + 1] += g * scaleXY;
                tmpBuffer[dindex + 2] += b * scaleXY;
                if (HAS_ALPHA) tmpBuffer[dindex + 3] += a * scaleXY;
                break;
            case 1:
                w = wx * scaleY;
                tmpBuffer[dindex] += r * w;
                tmpBuffer[dindex + 1] += g * w;
                tmpBuffer[dindex + 2] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 3] += a * w;
                w = nwx * scaleY;
                tmpBuffer[dindex + 4] += r * w;
                tmpBuffer[dindex + 5] += g * w;
                tmpBuffer[dindex + 6] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 7] += a * w;
                break;
            case 2:
                w = scaleX * wy;
                tmpBuffer[dindex] += r * w;
                tmpBuffer[dindex + 1] += g * w;
                tmpBuffer[dindex + 2] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 3] += a * w;
                w = scaleX * nwy;
                dindex += dw4;
                tmpBuffer[dindex] += r * w;
                tmpBuffer[dindex + 1] += g * w;
                tmpBuffer[dindex + 2] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 3] += a * w;
                break;
            default:
                w = wx * wy;
                tmpBuffer[dindex] += r * w;
                tmpBuffer[dindex + 1] += g * w;
                tmpBuffer[dindex + 2] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 3] += a * w;
                w = nwx * wy;
                tmpBuffer[dindex + 4] += r * w;
                tmpBuffer[dindex + 5] += g * w;
                tmpBuffer[dindex + 6] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 7] += a * w;
                w = wx * nwy;
                dindex += dw4;
                tmpBuffer[dindex] += r * w;
                tmpBuffer[dindex + 1] += g * w;
                tmpBuffer[dindex + 2] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 3] += a * w;
                w = nwx * nwy;
                tmpBuffer[dindex + 4] += r * w;
                tmpBuffer[dindex + 5] += g * w;
                tmpBuffer[dindex + 6] += b * w;
                if (HAS_ALPHA) tmpBuffer[dindex + 7] += a * w;
                break;
            }
        }
        }
        for (dindex = 0; dindex < dwh4; dindex += 4) {
        byteBuffer[dindex] = (tmpBuffer[dindex] * TIMES) | 0;
        byteBuffer[dindex + 1] = (tmpBuffer[dindex + 1] * TIMES) | 0;
        byteBuffer[dindex + 2] = (tmpBuffer[dindex + 2] * TIMES) | 0;
        byteBuffer[dindex + 3] = HAS_ALPHA ? (tmpBuffer[dindex + 3] * TIMES) | 0 : 255;
        }
        tmpBuffer = null;
    }

    return byteBuffer;
}



function initWorkerMessage() {
  self.onmessage = function(event) {
    //console.log('Work thread received message', Date.now());
    scale(event.data.sw, event.data.sh, event.data.dw, event.data.dh, event.data.sourceBuffer, event.data.imageData);
    self.postMessage(event.data.imageData);
    self.close();
  };
}
var workerJS = initWorkerMessage.toString() + ';'+initWorkerMessage.name+'()';

var blob = new Blob([scale.toString(), workerJS], { type: 'text/javascript' });
var url = window.URL.createObjectURL(blob);

export default url;
