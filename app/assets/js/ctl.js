define(['./model', './ui', './ajax'], function (model, ui, ajax) {

  /**
   * @param {Function} generator
   * @constructor
   */
  var FeedForm = function (generator) {
    this.ui = new ui.FeedForm(this);
    this.generator = generator;
  };
  FeedForm.fn = FeedForm.prototype;
  FeedForm.fn.formSubmitted = function (data) {
    this.generator().append(new GeneratorEntry({
      name: data.name,
      url: data.url,
      isSelected: true,
      isPrivate: false
    }, this.generator));
    this.ui.clear();
  };

  /**
   * @constructor
   */
  var GeneratorEntry = function (data, generator) {
    model.GeneratorEntry.call(this, data);
    this.generator = generator;
    this.ui = new ui.GeneratorEntry(this, this.isSelected(), this.name(), this.isPrivate());
  };
  GeneratorEntry.prototype = Object.create(model.GeneratorEntry.prototype);
  GeneratorEntry.fn = GeneratorEntry.prototype;
  GeneratorEntry.fn.selectChanged = function (checked) {
    this.isSelected(checked);
    this.generator().entrySelected(this);
  };
  GeneratorEntry.fn.privateChanged = function (checked) {
    this.isPrivate(checked);
    this.generator().entryLocked(this);
  };
  GeneratorEntry.fn.removeClicked = function () {
    this.generator().remove(this);
  };
  GeneratorEntry.fn.isSelected = function (isSelected) {
    var result = model.GeneratorEntry.fn.isSelected.call(this, isSelected);
    if (isSelected !== undefined) {
      this.ui.showSelected(this.isSelected());
    }
    return result
  };
  GeneratorEntry.fn.isPrivate = function (isPrivate) {
    var result = model.GeneratorEntry.fn.isPrivate.call(this, isPrivate);
    if (isPrivate !== undefined) {
      this.ui.showPrivate(this.isPrivate());
    }
    return result
  };

  /**
   * @param {Object} data
   * @param {Function} feeds
   * @constructor
   */
  var Generator = function (data, feeds) {
    model.Generator.call(this, data);
    this.feeds = feeds;
    this.ui = new ui.Generator(this, this.entries().map(function (entry) { return entry.ui }));
    this.updateUi();
  };
  Generator.prototype = Object.create(model.Generator.prototype);
  Generator.fn = Generator.prototype;
  Generator.fn.updateEnabledState = function () {
    if (this.entries().filter(function (entry) { return entry.isSelected() }).length > 0) {
      this.ui.enable();
    } else {
      this.ui.disable();
    }
  };
  Generator.fn.updateCheckboxState = function (p, updateUi) {
    if (this.entries().every(p)) {
      updateUi(ui.Checkbox.Checked);
    } else if (this.entries().every(function (entry) { return !p(entry) })) {
      updateUi(ui.Checkbox.Unchecked);
    } else {
      updateUi(ui.Checkbox.Indeterminate);
    }
  };
  Generator.fn.updateSelectState = function () {
    var self = this;
    return this.updateCheckboxState(
        function (entry) { return entry.isSelected() },
        function (state) { self.ui.showSelected(state) }
    )
  };
  Generator.fn.updateLockState = function () {
    var self = this;
    return this.updateCheckboxState(
        function (entry) { return entry.isPrivate() },
        function (state) { self.ui.showLocked(state) }
    )
  };
  Generator.fn.updateUi = function () {
    this.updateEnabledState();
    this.updateSelectState();
    this.updateLockState();
  };
  Generator.fn.append = function (entry) {
    var route = Routes.controllers.Mergical.addFeed(entry.name(), entry.url());
    var self = this;
    ajax.call({
      url: route.url,
      method: route.method,
      error: function () {
        model.Generator.fn.remove.call(this, entry);
        self.ui.remove(entry.ui);
        self.updateUi();
      },
      success: function (data) {
        // TODO update the views?
        // TODO update the model data
        //feed.name(data.name);
        //feed.url(data.url);
      }
    });
    model.Generator.fn.append.call(this, entry);
    this.ui.append(entry.ui);
    this.updateUi();
  };
  Generator.fn.remove = function (entry) {
    var route = Routes.controllers.Mergical.removeFeed(entry.url());
    ajax.call({
      url: route.url,
      method: route.method,
      error: function () {
        alert('Oops');
      }
    });
    model.Generator.fn.remove.call(this, entry);

    this.ui.remove(entry.ui);
    this.updateUi();
  };
  Generator.fn.generateClicked = function (data) {
    var route = Routes.controllers.Mergical.addGenerator();
    var postData = { name: data.name };
    this.entries()
        .filter(function (entry) { return entry.isSelected() })
        .forEach(function (entry, i) {
          postData['entries['+i+'].url'] = entry.url();
          postData['entries['+i+'].private'] = entry.isPrivate();
        });
    var self = this;

    ajax.call({
      url: route.url,
      method: route.method,
      data: postData,
      type: 'json',
      error: function () {
        alert('Oops');
      },
      success: function (data) {
        self.feeds().append(new Feed({ name: data.name, url: data.url }, function () { return self.feeds() }));
      }
    });
    this.ui.clear();
    this.feeds().appendInProgress();
  };
  Generator.fn.selectChanged = function (checked) {
    this.entries().forEach(function (entry) {
      entry.isSelected(checked);
    });
    this.updateEnabledState();
  };
  Generator.fn.lockChanged = function (checked) {
    this.entries().forEach(function (entry) {
      entry.isPrivate(checked);
    });
  };
  Generator.fn.entrySelected = function () {
    this.updateEnabledState();
    this.updateSelectState();
  };
  Generator.fn.entryLocked = function () {
    this.updateLockState();
  };

  /**
   * @param data
   * @param {Function} feeds
   * @constructor
   */
  var Feed = function (data, feeds) {
    model.Feed.call(this, data);
    this.ui = new ui.Feed(this, this.name(), this.url());
    this.feeds = feeds;
  };
  Feed.prototype = Object.create(model.Feed.prototype);
  Feed.fn = Feed.prototype;
  Feed.fn.removeClicked = function () {
    this.feeds().remove(this);
  };

  var Feeds = function (data) {
    model.Feeds.call(this, data);
    this.ui = new ui.Feeds(this, this.feeds().map(function (feed) { return feed.ui }));
  };
  Feeds.prototype = Object.create(model.Feeds.prototype);
  Feeds.fn = Feeds.prototype;
  // FIXME Factor out collections common things?
  Feeds.fn.append = function (feed) {
    model.Feeds.fn.append.call(this, feed);
    this.ui.append(feed.ui);
  };
  Feeds.fn.remove = function (feed) {
    var route = Routes.controllers.Mergical.removeGenerator(feed.name());
    ajax.call({
      url: route.url,
      method: route.method,
      error: function () {
        alert('Oops');
      }
    });
    model.Feeds.fn.remove.call(this, feed);
    this.ui.remove(feed.ui);
  };
  Feeds.fn.appendInProgress = function () {
    this.ui.showSpinner();
  };


  /**
   * @param data Attributes
   * @param {Element} el
   * @constructor
   */
  var Dashboard = function (data, el) {
    model.Dashboard.call(this, data);
    var self = this;
    this.feedForm = new FeedForm(function () { return self.generator() });
    this.ui = new ui.Dashboard(this, this.feedForm.ui, this.generator().ui, this.feeds().ui, el);
  };
  Dashboard.prototype = Object.create(model.Dashboard.prototype);

  return {
    Generator: Generator,
    GeneratorEntry: GeneratorEntry,
    Feed: Feed,
    Feeds: Feeds,
    Dashboard: Dashboard
  }

});