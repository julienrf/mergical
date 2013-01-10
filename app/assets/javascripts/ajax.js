define(function () {
  var ajax = {};

  ajax.call = function (spec) {

    var xhr = new XMLHttpRequest();
    var contentTypes = {
      'xml':'text/xml',
      'html':'text/html',
      'json':'application/json',
      'text':'text/plain'
    };
    var textParser = function (xhr) {
      return xhr.responseText
    };
    var dataParsers = {
      'xml':function (xhr) {
        return xhr.responseXML;
      },
      'html':textParser,
      'json':function (xhr) {
        return JSON.parse(xhr.responseText);
      },
      'text':textParser
    };
    var makeData = function (o) {
      if (o !== undefined) {
        var data = new FormData
        for (var p in o) {
          if (o.hasOwnProperty(p)) data.append(p, o[p]);
        }
        return data
      } else return null
    };

    spec = spec || {};
    spec.configure && spec.configure(xhr);

    xhr.open(spec.method || (spec.action && spec.action.method) || 'GET', spec.url || (spec.action && spec.action.url));

    xhr.onreadystatechange = function (e) {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        spec.complete && spec.complete();
        switch (Math.floor(xhr.status / 100)) {
          case 2:
          case 3:
            if (spec.success) {
              var data = (dataParsers[spec.type] || textParser)(xhr);
              spec.success(data, xhr);
            }
            break;
          default:
            spec.error && spec.error(xhr.responseText, xhr);
            break;
        }
      }
    };

    spec.progress && (xhr.onprogress = spec.progress);

    var data = makeData(spec.data);

    contentTypes[spec.type] && xhr.setRequestHeader('Accept', contentTypes[spec.type]);

    xhr.send(data);
  };

  return ajax;
});