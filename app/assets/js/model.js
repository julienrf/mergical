define(function () {

  /**
   * @param data Attributes
   * @param {String} data.name
   * @param {String} data.url
   * @param {Boolean} data.isSelected
   * @param {Boolean} data.isPrivate
   * @constructor
   */
  var GeneratorEntry = function (data) {
    this._name = data.name;
    this._url = data.url;
    this._isSelected = data.isSelected;
    this._isPrivate = data.isPrivate;
  };
  GeneratorEntry.fn = GeneratorEntry.prototype;
  GeneratorEntry.fn.name = function () {
    return this._name
  };
  GeneratorEntry.fn.url = function () {
    return this._url
  };
  GeneratorEntry.fn.isSelected = function (isSelected) {
    if (isSelected !== undefined) {
      this._isSelected = isSelected;
    } else {
      return this._isSelected
    }
  };
  GeneratorEntry.fn.isPrivate = function (isPrivate) {
    if (isPrivate !== undefined) {
      this._isPrivate = isPrivate;
    } else {
      return this._isPrivate
    }
  };

  /**
   * @param data Attributes
   * @param {String} data.name Generator name
   * @param {GeneratorEntry[]} data.entries
   * @constructor
   */
  var Generator = function (data) {
    this._name = data.name;
    this._entries = data.entries;
  };
  Generator.fn = Generator.prototype;
  Generator.fn.name = function () {
    return this._name
  };
  Generator.fn.entries = function () {
    return this._entries
  };
  Generator.fn.append = function (entry) {
    this._entries.push(entry);
  };
  Generator.fn.remove = function (entry) {
    this._entries = this._entries.filter(function (e) { return e !== entry });
  };

  /**
   * @param data
   * @param {String} data.name
   * @param {String} data.url
   * @constructor
   */
  var Feed = function (data) {
    this._name = data.name;
    this._url = data.url;
  };
  Feed.fn = Feed.prototype;
  Feed.fn.name = function () {
    return this._name
  };
  Feed.fn.url = function () {
    return this._url
  };

  /**
   * @param data
   * @param {Feed[]} data.feeds
   * @constructor
   */
  var Feeds = function (data) {
    this._feeds = data.feeds;
  };
  Feeds.fn = Feeds.prototype;
  Feeds.fn.feeds = function () {
    return this._feeds
  };
  Feeds.fn.append = function (feed) {
    this._feeds.push(feed);
  };
  Feeds.fn.remove = function (feed) {
    this._feeds = this._feeds.filter(function (f) { return f !== feed });
  };

  /**
   * @param data Attributes
   * @param {Generator} data.generator
   * @param {Feeds} data.feeds
   * @constructor
   */
  var Dashboard = function (data) {
    this._generator = data.generator;
    this._feeds = data.feeds;
  };
  Dashboard.fn = Dashboard.prototype;
  Dashboard.fn.generator = function () {
    return this._generator
  };
  Dashboard.fn.feeds = function () {
    return this._feeds
  };

  return {
    GeneratorEntry: GeneratorEntry,
    Generator: Generator,
    Feed: Feed,
    Feeds: Feeds,
    Dashboard: Dashboard
  }

});