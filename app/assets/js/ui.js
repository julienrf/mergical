define(['./el'], function (el) {

  var FeedForm = function (ctl) {
    this.ctl = ctl;
    this.nameInput = el('input', { type: 'text', 'class': 'span3', placeholder: 'Professional meetings', required: 'required' })();
    this.urlInput = el('input', { type: 'url', 'class': 'span6', placeholder: 'http://somewhere.com/a-feed.ics', required: 'required' })();
    var button = el('button', { 'class': 'btn' })(
        el('i', { 'class': 'icon-plus' })()
    );
    this.dom = el('form', { 'class': 'form-horizontal control-group' })(
        this.nameInput,
        this.urlInput,
        button
    );

    var self = this;
    this.dom.addEventListener('submit', function (e) {
      e.preventDefault();
      self.ctl.formSubmitted({
        name: self.nameInput.value,
        url: self.urlInput.value
      });
    });
  };
  FeedForm.fn = FeedForm.prototype;
  FeedForm.fn.clear = function () {
    this.urlInput.value = '';
    this.nameInput.value = '';
  };

  var GeneratorEntry = function (ctl, isSelected, name, isPrivate) {
    this.ctl = ctl;
    this.isSelected = el('input', { type: 'checkbox' })();
    this.isSelected.checked = isSelected;
    this.isPrivate = el('input', { type: 'checkbox' })();
    this.isPrivate.checked = isPrivate;
    var remove = el('button', { 'class': 'btn btn-inverse btn-mini' })(
        el('i', { 'class': 'icon-trash icon-white' })()
    );
    this.dom = el('tr')(
        el('td')(this.isSelected),
        el('td')(name),
        el('td')(this.isPrivate),
        el('td')(remove)
    );

    this.isSelected.addEventListener('change', function (e) {
      ctl.selectChanged(e.target.checked);
    });
    this.isPrivate.addEventListener('change', function (e) {
      ctl.privateChanged(e.target.checked);
    });
    remove.addEventListener('click', function () {
      ctl.removeClicked();
    });
  };
  GeneratorEntry.fn = GeneratorEntry.prototype;
  GeneratorEntry.fn.showSelected = function (isSelected) {
    this.isSelected.checked = isSelected;
  };
  GeneratorEntry.fn.showPrivate = function (isPrivate) {
    this.isPrivate.checked = isPrivate;
  };

  var Generator = function (ctl, entries) {
    this.ctl = ctl;
    this.select = new Checkbox(' Select');
    this.lock = new Checkbox(' Lock');
    this.table = el('tbody')();
    var table = el('table', { 'class': 'table table-striped table-hover' })(
        el('thead')(
            el('tr')(
                el('th')(this.select.dom),
                el('th')('Feed'),
                el('th')(this.lock.dom),
                el('th')()
            )
        ),
        this.table
    );
    var self = this;
    entries.forEach(function (entry) {
      self.append(entry);
    });
    this.name = el('input', { type: 'text', required: 'required', placeholder: 'Name' })();
    this.button = el('button', { 'class': 'btn' })('Generate a feed');
    var form = el('form', { 'class': 'form-horizontal control-group' })(
        this.name,
        this.button
    );
    this.dom = el('div')(
        table,
        form
    );

    this.select.el().addEventListener('change', function (e) {
      ctl.selectChanged(e.target.checked);
    });
    this.lock.el().addEventListener('change', function (e) {
      ctl.lockChanged(e.target.checked);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ctl.generateClicked({ name: self.name.value });
    });
  };
  Generator.fn = Generator.prototype;
  Generator.fn.clear = function () {
    this.name.value = '';
  };
  Generator.fn.disable = function () {
    this.button.disabled = true;
    this.name.disabled = true;
  };
  Generator.fn.enable = function () {
    this.button.disabled = false;
    this.name.disabled = false;
  };
  Generator.fn.showSelected = function (state) {
    this.select.showState(state);
  };
  Generator.fn.showLocked = function (state) {
    this.lock.showState(state);
  };
  Generator.fn.append = function (entry) {
    this.table.appendChild(entry.dom);
  };
  Generator.fn.remove = function (entry) {
    this.table.removeChild(entry.dom);
  };

  var Feed = function (ctl, name, url) {
    var remove = el('button', { 'class': 'btn btn-inverse btn-mini' })(
        el('i', { 'class': 'icon-trash icon-white' })()
    );
    this.dom = el('div', { 'class': 'row' })(
        el('span', { 'class': 'span3' })(name),
        el('span', { 'class': 'span6' })(
            el('a', { href: url })(url)
        ),
        remove
    );

    remove.addEventListener('click', function () {
      ctl.removeClicked();
    });
  };

  var Feeds = function (ctl, feeds) {
    this.ctl = ctl;
    this.dom = el('div')();
    var self = this;
    feeds.forEach(function (feed) {
      self.append(feed);
    })
  };
  Feeds.fn = Feeds.prototype;
  Feeds.fn.append = function (feed) {
    var spinner = this.dom.querySelector('.spinner');
    if (spinner !== null) {
      this.dom.removeChild(spinner);
    }
    this.dom.appendChild(feed.dom);
  };
  Feeds.fn.remove = function (feed) {
    this.dom.removeChild(feed.dom);
  };
  Feeds.fn.showSpinner = function () {
    this.dom.appendChild(
        el('div', { 'class': 'spinner row' })(
            el('div', { 'class': 'progress progress-striped active span9' })(
                el('div', { 'class': 'bar', style: 'width: 100%' })()
            )
        )
    );
  };

  /**
   * @param ctl
   * @param {FeedForm} feedForm
   * @param {Generator} generator
   * @param {Feeds} feeds
   * @param {Element} rootEl
   * @constructor
   */
  var Dashboard = function (ctl, feedForm, generator, feeds, rootEl) {
    this.ctl = ctl;
    this.dom = rootEl;
    this.dom.appendChild(el('h1')('\u27A5 Register your calendars feeds'));
    this.dom.appendChild(feedForm.dom);
    this.dom.appendChild(el('hr')());
    this.dom.appendChild(el('h1')('\u27A5 Generate a custom feed'));
    this.dom.appendChild(generator.dom);
    this.dom.appendChild(el('hr')());
    this.dom.appendChild(el('h1')('\u27A5 Share your generated feeds'));
    this.dom.appendChild(feeds.dom);
  };
  Dashboard.fn = Dashboard.prototype;

  var Checkbox = function (label) {
    this.input = el('input', { type: 'checkbox' })();
    this.dom = el('label')(this.input, label);
  };
  Checkbox.Checked = 0;
  Checkbox.Unchecked = 1;
  Checkbox.Indeterminate = 2;
  Checkbox.fn = Checkbox.prototype;
  Checkbox.fn.showState = function (state) {
    switch (state) {
      case Checkbox.Checked:
        this.input.checked = true;
        this.input.indeterminate = false;
        break;
      case Checkbox.Indeterminate:
        this.input.indeterminate = true;
        break;
      case Checkbox.Unchecked:
        this.input.checked = false;
        this.input.indeterminate = false;
        break;
    }
  };
  Checkbox.fn.el = function () {
    return this.input
  };


  return {
    FeedForm: FeedForm,
    GeneratorEntry: GeneratorEntry,
    Generator: Generator,
    Feed: Feed,
    Feeds: Feeds,
    Dashboard: Dashboard,
    Checkbox: Checkbox
  }

});