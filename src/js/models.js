import { C3Event, C3EventDispatcher } from '../lib/utils';

function statusModel() {
  C3EventDispatcher.call(this);

  var status;
  this.getStatus = function() {
    return status;
  };
  this.setStatus = function(_status) {
    status = _status;
    this.dispatchEvent(new C3Event('change', { status: status }));
  };
}
(function() {
  var Super = function() {};
  Super.prototype = C3EventDispatcher.prototype;
  statusModel.prototype = new Super();
})();

export var loaedPhotoModel = new statusModel();
export var freeRatioModel = new statusModel();
export var isHiResModel = new statusModel();
isHiResModel.setStatus(false);
