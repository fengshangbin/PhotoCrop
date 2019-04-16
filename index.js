import './src/css/photocrop.css';
import { defaultOption } from './src/config/default';
import { extend } from './src/lib/utils';
import { open } from './src/js/view';

export function crop(options) {
  options = extend(defaultOption, options);
  open(options);
}

/* module.exports = {
  crop: crop
}; */
