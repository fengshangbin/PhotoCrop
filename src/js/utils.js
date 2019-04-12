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
