import scaleWorkerURL from './scaleWorker';

export default function _cropscale(scale, input, callback) {
  var canvas, ctx;
  canvas = input;
  ctx = canvas.getContext('2d');
  if (input.src) ctx.drawImage(input, 0, 0);
  var sw = canvas.width,
    sh = canvas.height,
    sourceBuffer = ctx.getImageData(0, 0, sw, sh).data,
    dw = (scale.width + 0.5) | 0,
    dh = (scale.height + 0.5) | 0,
    newCanvas,
    newCtx,
    imageData;
    //byteBuffer;

  function setNewCanvas() {
    newCanvas = document.createElement('canvas');
    newCanvas.width = dw;
    newCanvas.height = dh;
    newCtx = newCanvas.getContext('2d');
  }
  function getImageData() {
      return newCtx.getImageData(0, 0, dw, dh);
  }

  setNewCanvas();
  imageData = getImageData();
  //byteBuffer = imageData.data;

  var worker = new Worker(scaleWorkerURL);
  worker.onmessage = function (event) {
    // e.data === 'some message'
    console.log('Main thread received message', Date.now());
    //worker.postMessage('hello worker 2');
    //imageData.data = event.data;
    newCtx.putImageData(event.data, 0, 0);
    callback(newCanvas);
  };
  worker.postMessage({sw:sw, sh:sh, dw:dw, dh:dh, sourceBuffer:sourceBuffer, imageData:imageData});
}
