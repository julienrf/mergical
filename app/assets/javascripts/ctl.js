define(['model', 'ui', 'ajax'], function (model, ui, ajax) {

  /**
   * @param {Function} generator
   * @constructor
   */
  var FeedForm = function (sources) {
    this.ui = new ui.FeedForm(this);
    this.sources = sources;
  };
  FeedForm.fn = FeedForm.prototype;
  FeedForm.fn.formSubmitted = function (data) {
    // TODO Spinner
    var route = Routes.controllers.Mergical.addFeed(data.name, data.url);
    var self = this;
    ajax.call({
      url: route.url,
      method: route.method,
      type: 'json',
      error: function () {
        alert('Oops');
      },
      success: function (id) {
        self.sources.append(new Source({
          id: id,
          name: data.name,
          url: data.url
        }, self.sources));
        self.ui.clear();
      }
    });
  };

  /**
   * @constructor
   */
  var SourceEntry = function (data, builder) {
    model.FeedEntry.call(this, data);
    this._builder = builder;
    this.ui = new ui.SourceEntry(this, this.isSelected(), this.feed().name(), this.isPrivate());
  };
  SourceEntry.prototype = Object.create(model.FeedEntry.prototype);
  SourceEntry.fn = SourceEntry.prototype;
  SourceEntry.fn.selectChanged = function (checked) {
    this.isSelected(checked);
    this._builder().entrySelected();
  };
  SourceEntry.fn.privateChanged = function (checked) {
    this.isPrivate(checked);
    this._builder().entryLocked();
  };
  SourceEntry.fn.isSelected = function (isSelected) {
    var result = model.FeedEntry.fn.isSelected.call(this, isSelected);
    if (isSelected !== undefined) {
      this.ui.showSelected(this.isSelected());
    }
    return result
  };
  SourceEntry.fn.isPrivate = function (isPrivate) {
    var result = model.FeedEntry.fn.isPrivate.call(this, isPrivate);
    if (isPrivate !== undefined) {
      this.ui.showPrivate(this.isPrivate());
    }
    return result
  };
  SourceEntry.fn.hoverEffect = function (isPrivate) {
    this.ui.hoverEffect(isPrivate);
  };
  SourceEntry.fn.clearHoverEffect = function () {
    this.ui.clearHoverEffect();
  };

  var GeneratorEntry = function (data, builder) {
    model.FeedEntry.call(this, data);
    this._builder = builder;
    this.ui = new ui.GeneratorEntry(this, this.isSelected(), this.feed().name(), this.isPrivate());
  };
  GeneratorEntry.prototype = Object.create(SourceEntry.prototype);
  GeneratorEntry.fn = GeneratorEntry.prototype;
  GeneratorEntry.fn.mouseEntered = function () {
    var self = this;
    this.feed().sources().forEach(function (data) {
      var entry = self._builder().find(data.source); // TODO Remove that
      entry.hoverEffect(data.isPrivate);
    });
    this.ui.hoverEffect(false);
  };
  GeneratorEntry.fn.mouseLeaved = function () {
    var self = this;
    this.feed().sources().forEach(function (data) {
      var entry = self._builder().find(data.source); // TODO Remove that
      entry.clearHoverEffect();
    });
    this.ui.clearHoverEffect();
  };

  /**
   * @param {Object} data
   * @constructor
   */
  var GeneratorBuilder = function (data) {
    model.GeneratorBuilder.call(this, data);
    this.ui = new ui.GeneratorBuilder(this, this.sources().map(function (entry) { return entry.ui }), this.generators().map(function (entry) { return entry.ui }));
    this.updateUi();
  };
  GeneratorBuilder.prototype = Object.create(model.GeneratorBuilder.prototype);
  GeneratorBuilder.fn = GeneratorBuilder.prototype;
  GeneratorBuilder.fn.updateEnabledState = function () {
    if (this.items().filter(function (entry) { return entry.isSelected() }).length > 0) {
      this.ui.enable();
    } else {
      this.ui.disable();
    }
  };
  GeneratorBuilder.fn.updateCheckboxState = function (p, updateUi) {
    if (this.items().every(p)) {
      updateUi(ui.Checkbox.Checked);
    } else if (this.items().every(function (entry) { return !p(entry) })) {
      updateUi(ui.Checkbox.Unchecked);
    } else {
      updateUi(ui.Checkbox.Indeterminate);
    }
  };
  GeneratorBuilder.fn.updateSelectState = function () {
    var self = this;
    return this.updateCheckboxState(
        function (entry) { return entry.isSelected() },
        function (state) { self.ui.showSelected(state) }
    )
  };
  GeneratorBuilder.fn.updateLockState = function () {
    var self = this;
    return this.updateCheckboxState(
        function (entry) { return entry.isPrivate() },
        function (state) { self.ui.showLocked(state) }
    )
  };
  GeneratorBuilder.fn.updateUi = function () {
    this.updateEnabledState();
    this.updateSelectState();
    this.updateLockState();
  };
  GeneratorBuilder.fn.formSubmitted = function (data) {
    var selectedFeeds = this.items()
        .filter(function (entry) { return entry.isSelected() });
    if (selectedFeeds.length == 0) {
      // Visual feedback?
      return
    }
    var route = Routes.controllers.Mergical.addGenerator();
    var postData = { name: data.name };
    selectedFeeds
        .forEach(function (entry, i) {
          postData['entries['+i+'].feed'] = entry.feed().id();
          postData['entries['+i+'].private'] = entry.isPrivate();
        });

    ajax.call({
      url: route.url,
      method: route.method,
      data: postData,
      type: 'json',
      error: function () {
        alert('Oops');
      },
      success: function () {
        window.location = Routes.controllers.Mergical.dashboard().url;
      }
    });
  };
  GeneratorBuilder.fn.selectChanged = function (checked) {
    this.items().forEach(function (entry) {
      entry.isSelected(checked);
    });
    this.updateEnabledState();
  };
  GeneratorBuilder.fn.lockChanged = function (checked) {
    this.items().forEach(function (entry) {
      entry.isPrivate(checked);
    });
  };
  GeneratorBuilder.fn.entrySelected = function () {
    this.updateEnabledState();
    this.updateSelectState();
  };
  GeneratorBuilder.fn.entryLocked = function () {
    this.updateLockState();
  };
  /**
   * @param {Source} source Source to find
   * @returns The corresponding entry
   */
  GeneratorBuilder.fn.find = function (source) {
    return this.sources().filter(function (entry) { return entry.feed() === source })[0];
  };


  /**
   * @param data
   * @param {Function} seq
   * @constructor
   */
  var Source = function (data, seq) {
    model.Source.call(this, data);
    this.ui = new ui.Source(this, this.name(), this.url());
    this._seq = seq;
  };
  Source.prototype = Object.create(model.Source.prototype);
  Source.fn = Source.prototype;
  Source.fn.removeClicked = function () {
    this._seq().remove(this);
  };
  Source.fn.hoverEffect = function (isPrivate) {
    this.ui.hoverEffect(isPrivate);
  };
  Source.fn.clearHoverEffect = function () {
    this.ui.clearHoverEffect();
  };

  var Sources = function (data) {
    model.Seq.call(this, data);
    this.feedForm = new FeedForm(this);
    this.ui = new ui.Sources(this, this.items().map(function (source) { return source.ui }), this.feedForm.ui);
  };
  Sources.prototype = Object.create(model.Seq.prototype);
  Sources.fn = Sources.prototype;
  Sources.fn.append = function (source) {
    model.Seq.fn.append.call(this, source);
    this.ui.append(source.ui);
  };
  Sources.fn.remove = function (source) {
    var route = Routes.controllers.Mergical.removeFeed(source.id());
    ajax.call({
      url: route.url,
      method: route.method,
      error: function () {
        alert('Oops');
      }
    });
    model.Seq.fn.remove.call(this, source);

    this.ui.remove(source.ui);
  };

  var Reference = function (data) {
    model.Reference.call(this, data);
  };
  Reference.prototype = Object.create(model.Reference.prototype);

  /**
   * @param data
   * @param {Function} seq
   * @constructor
   */
  var Generator = function (data, seq) {
    model.Generator.call(this, data);
    this.ui = new ui.Generator(this, this.name(), Routes.controllers.Mergical.generator(this.id()).absoluteURL());
    this._seq = seq;
  };
  Generator.prototype = Object.create(model.Generator.prototype);
  Generator.fn = Generator.prototype;
  Generator.fn.removeClicked = function () {
    this._seq().remove(this);
  };
  Generator.fn.mouseEntered = function () {
    this.sources().forEach(function (data) {
      data.source.hoverEffect(data.isPrivate);
    });
    this.ui.hoverEffect(false);
  };
  Generator.fn.mouseLeaved = function () {
    this.sources().forEach(function (data) {
      data.source.clearHoverEffect();
    })
    this.ui.clearHoverEffect();
  };

  var Generators = function (data) {
    model.Seq.call(this, data);
    this.ui = new ui.Generators(this, this.items().map(function (generator) { return generator.ui }));
  };
  Generators.prototype = Object.create(model.Seq.prototype);
  Generators.fn = Generators.prototype;
  Generators.fn.append = function (generator) {
    model.Seq.fn.append.call(this, generator);
    this.ui.append(generator.ui);
  };
  Generators.fn.remove = function (generator) {
    var route = Routes.controllers.Mergical.removeGenerator(generator.id());
    ajax.call({
      url: route.url,
      method: route.method,
      error: function () {
        alert('Oops');
      }
    });
    model.Seq.fn.remove.call(this, generator);
    this.ui.remove(generator.ui);
  };
  Generators.fn.appendInProgress = function () {
    this.ui.showSpinner();
  };


  /**
   * @param data Attributes
   * @param {Element} el
   * @constructor
   */
  var Dashboard = function (data, el) {
    model.Dashboard.call(this, data);
    this.ui = new ui.Dashboard(this, this.sources().ui, this.generators().ui, el);
  };
  Dashboard.prototype = Object.create(model.Dashboard.prototype);


  return {
    GeneratorBuilder: GeneratorBuilder,
    SourceEntry: SourceEntry,
    GeneratorEntry: GeneratorEntry,
    Source: Source,
    Sources: Sources,
    Reference: Reference,
    Generator: Generator,
    Generators: Generators,
    Dashboard: Dashboard
  }

});