define(['./ctl'], function (ctl) {

  /**
   * Build a Feed from data
   * @param data
   * @param {String} data.name
   * @param {String} data.url
   * @param {Function} generator
   */
  var entry = function (data, generator) {
    return new ctl.GeneratorEntry({
      name: data.name,
      url: data.url,
      isSelected: true,
      isPrivate: false
    }, generator);
  };

  /**
   * Build a list of feeds from a list of feed data
   * @param {Object[]} data List of feed data
   * @param {Function} g Function returning the Generator
   * @return {ctl.Feeds} List of feeds
   */
  var generator = function (data, fs) {
    var self = new ctl.Generator({
      entries: data.map(function (data) {
        return entry(data, function () { return self })
      })
    }, fs);
    return self
  };

  /**
   * @param data
   * @param {String} data.name
   * @param {String} data.url
   * @return {ctl.Feed}
   */
  var feed = function (data, fs) {
    return new ctl.Feed({
      name: data.name,
      url: data.url
    }, fs)
  };

  /**
   * @param {Object[]} data
   * @return {ctl.Feeds}
   */
  var feeds = function (data) {
    var self = new ctl.Feeds({
      feeds: data.map(function (data) {
        return feed(data, function () { return self })
      })
    });
    return self
  };

  /**
   * Build a dashboard from a list of objects describing feeds
   * @param {Object[]} data List of feed data
   * @param {Element} el Root element of the Dashboard
   * @return {ctl.Dashboard} Dashboard
   */
  var dashboard = function (data, el) {
    var fs = feeds(data.generatedFeeds);
    return new ctl.Dashboard({ generator: generator(data.feeds, function () { return fs }), feeds: fs }, el);
  };

  return {
    dashboard: dashboard
  }

});