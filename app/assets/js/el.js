define(function () {

  /**
   * el('div', { 'class': 'article' }) (
   *   'Hello, ',
   *   el('strong') ('World'),
   *   '!'
   * )
   *
   * el('ul') (
   *   ['foo', 'bar', 'baz'].map(function (txt) { return el('li')(txt) })
   * )
   */
  return function (name, attrs) {
    attrs = attrs || {};
    var el = document.createElement(name);
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        el.setAttribute(attr, attrs[attr])
      }
    }

    var appendChildren = function () {
      for (var i = 0 ; i < arguments.length ; i++) {
        var child = arguments[i];
        if (Array.isArray(child)) {
          appendChildren(child);
        } else if (typeof child === "string") {
          el.appendChild(document.createTextNode(child));
        } else {
          el.appendChild(child);
        }
      }
      return el
    };

    return appendChildren
  };
});