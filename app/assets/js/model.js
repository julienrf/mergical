define(function () {

  var Seq = function (data) {
    this._items = data.items;
  };
  Seq.fn = Seq.prototype;
  Seq.fn.items = function () {
    return this._items;
  };
  Seq.fn.append = function (item) {
    this._items.push(item);
  };
  Seq.fn.remove = function (item) {
    this._items = this._items.filter(function (i) { return i !== item });
  };

  /**
   * @param data Attributes
   * @param {Boolean} data.isSelected
   * @param {Boolean} data.isPrivate
   * @param {Feed} data.feed
   * @constructor
   */
  var GeneratorEntry = function (data) {
    this._feed = data.feed
    this._isSelected = data.isSelected;
    this._isPrivate = data.isPrivate;
  };
  GeneratorEntry.fn = GeneratorEntry.prototype;
  GeneratorEntry.fn.feed = function () {
    return this._feed
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
   * @param {String} data.name GeneratorBuilder name
   * @param {GeneratorEntry[]} data.items
   * @constructor
   */
  var GeneratorBuilder = function (data) {
    this._name = data.name;
    this._sources = data.sources;
    this._generators = data.generators;
    this._items = data.sources.concat(data.generators);
  };
  GeneratorBuilder.fn = GeneratorBuilder.prototype;
  GeneratorBuilder.fn.name = function () {
    return this._name
  };
  GeneratorBuilder.fn.items = function () {
    return this._items
  };
  GeneratorBuilder.fn.sources = function () {
    return this._sources
  };
  GeneratorBuilder.fn.generators = function () {
    return this._generators
  };

  /**
   * @param data
   * @param {String} data.name
   * @param {String} data.url
   * @param {Number} data.id
   * @constructor
   */
  var Source = function (data) {
    this._id = data.id;
    this._name = data.name;
    this._url = data.url;
  };
  Source.fn = Source.prototype;
  Source.fn.name = function () {
    return this._name
  };
  Source.fn.url = function () {
    return this._url
  };
  Source.fn.id = function () {
    return this._id
  };


  var Reference = function (data) {
    this._feed = data.feed;
    this._isPrivate = data.isPrivate;
  };
  Reference.fn = Reference.prototype;
  Reference.fn.feed = function () {
    return this._feed
  };
  Reference.fn.isPrivate = function () {
    return this._isPrivate
  }

  /**
   * @param data
   * @param {Number} data.id
   * @param {String} data.name
   * @param {Object[]} data.feeds
   * @constructor
   */
  var Generator = function (data) {
    this._id = data.id;
    this._name = data.name;
    this._feeds = data.feeds;
  };
  Generator.fn = Generator.prototype;
  Generator.fn.id = function () {
    return this._id;
  };
  Generator.fn.name = function () {
    return this._name;
  };
  Generator.fn.feeds = function () {
    return this._feeds;
  };

  /**
   * @param data Attributes
   * @param {Seq} data.sources
   * @param {Seq} data.generators
   * @constructor
   */
  var Dashboard = function (data) {
    this._generators = data.generators;
    this._sources = data.sources;
  };
  Dashboard.fn = Dashboard.prototype;
  Dashboard.fn.generators = function () {
    return this._generators
  };
  Dashboard.fn.sources = function () {
    return this._sources
  };

  return {
    GeneratorEntry: GeneratorEntry,
    GeneratorBuilder: GeneratorBuilder,
    Source: Source,
    Reference: Reference,
    Generator: Generator,
    Seq: Seq,
    Dashboard: Dashboard
  }

});