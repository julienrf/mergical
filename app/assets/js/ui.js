define(['./el.js'], function (el) {

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

  var GeneratorForm = function (ctl) {
    this.ctl = ctl;
    this.name = el('input', { type: 'text', required: 'required', placeholder: 'Name' })();
    this.button = el('button', { 'class': 'btn' })(
        el('i', { 'class': 'icon-plus' })()
    );
    this.dom = el('form', { 'class': 'form-horizontal control-group' })(
        this.name,
        this.button
    );

    var self = this;
    this.dom.addEventListener('submit', function (e) {
      e.preventDefault();
      ctl.addClicked({ name: self.name.value });
    });
  };

  var GeneratorEntry = function (ctl, isSelected, name, isPrivate) {
    this.ctl = ctl;
    this.isSelected = el('input', { type: 'checkbox' })();
    this.isSelected.checked = isSelected;
    this.isPrivate = el('input', { type: 'checkbox' })();
    this.isPrivate.checked = isPrivate;
    this.dom = el('tr')(
        el('td')(this.isSelected),
        el('td')(name),
        el('td')(this.isPrivate)
    );

    this.isSelected.addEventListener('change', function (e) {
      ctl.selectChanged(e.target.checked);
    });
    this.isPrivate.addEventListener('change', function (e) {
      ctl.privateChanged(e.target.checked);
    });
  };
  GeneratorEntry.fn = GeneratorEntry.prototype;
  GeneratorEntry.fn.showSelected = function (isSelected) {
    this.isSelected.checked = isSelected;
  };
  GeneratorEntry.fn.showPrivate = function (isPrivate) {
    this.isPrivate.checked = isPrivate;
  };

  var GeneratorBuilder = function (ctl, name, sources, generators) {
    this.ctl = ctl;
    this.select = new Checkbox(' Select');
    this.lock = new Checkbox(' Lock');

    this.table = el('tbody')();
    var table = el('table', { 'class': 'table table-striped table-hover' })(
        el('thead')(
            el('tr')(
                el('th')(this.select.dom),
                el('th')('Feed'),
                el('th')(this.lock.dom)
            )
        ),
        this.table
    );
    var self = this;
    sources.forEach(function (s) {
      self.table.appendChild(s.dom);
    });
    this.table.appendChild(el('tr')(el('hr')()));
    generators.forEach(function (g) {
      self.table.appendChild(g.dom);
    });

    this.button = el('button', { 'class': 'btn' })('Ok');

    this.dom = el('div')(
        table,
        this.button
    );

    this.select.el().addEventListener('change', function (e) {
      ctl.selectChanged(e.target.checked);
    });
    this.lock.el().addEventListener('change', function (e) {
      ctl.lockChanged(e.target.checked);
    });
    this.button.addEventListener('click', function () {
      ctl.formSubmitted({ name: name });
    });

  };
  GeneratorBuilder.fn = GeneratorBuilder.prototype;
  GeneratorBuilder.fn.disable = function () {
    this.button.disabled = true;
  };
  GeneratorBuilder.fn.enable = function () {
    this.button.disabled = false;
  };
  GeneratorBuilder.fn.showSelected = function (state) {
    this.select.showState(state);
  };
  GeneratorBuilder.fn.showLocked = function (state) {
    this.lock.showState(state);
  };


  var Source = function (ctl, name, url) {
    var remove = el('button', { 'class': 'btn btn-inverse btn-mini' })(
        el('i', { 'class': 'icon-trash icon-white' })()
    );
    this.dom = el('div', { 'class': 'row' })(
        el('span', { 'class': 'span3' })(name),
        el('span', { 'class': 'span6' })(url),
        remove
    );

    remove.addEventListener('click', function () {
      ctl.removeClicked();
    });
  };

  var Sources = function (ctl, sources, feedForm) {
    this.ctl = ctl;
    this.dom = el('div')();
    this.feedForm = feedForm.dom;
    this.dom.appendChild(this.feedForm);
    var self = this;
    sources.forEach(function (source) { self.append(source) });
  };
  Sources.fn = Sources.prototype;
  Sources.fn.append = function (source) {
    this.dom.insertBefore(source.dom, this.feedForm);
  };
  Sources.fn.remove = function (source) {
    this.dom.removeChild(source.dom);
  };

  var Generator = function (ctl, name, url) {
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

  var Generators = function (ctl, generators, form) {
    this.ctl = ctl;
    this.form = form.dom;
    this.dom = el('div')(this.form);
    var self = this;
    generators.forEach(function (feed) {
      self.append(feed);
    })
  };
  Generators.fn = Generators.prototype;
  Generators.fn.append = function (generator) {
    var spinner = this.dom.querySelector('.spinner');
    if (spinner !== null) {
      this.dom.removeChild(spinner);
    }
    this.dom.insertBefore(generator.dom, this.form);
  };
  Generators.fn.remove = function (generator) {
    this.dom.removeChild(generator.dom);
  };
  Generators.fn.showSpinner = function () {
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
   * @param {GeneratorBuilder} generator
   * @param {Generators} feeds
   * @param {Element} rootEl
   * @constructor
   */
  var Dashboard = function (ctl, sources, generators) {
    this.ctl = ctl;
    this.dom = el('div')(
        el('h1')('\u27A5 Register your iCal sources'),
        sources.dom,
        el('hr')(),
        el('h1')('\u27A5 Generate feeds and share them'),
        generators.dom
    )
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
    GeneratorForm: GeneratorForm,
    GeneratorEntry: GeneratorEntry,
    GeneratorBuilder: GeneratorBuilder,
    Generator: Generator,
    Generators: Generators,
    Source: Source,
    Sources: Sources,
    Dashboard: Dashboard,
    Checkbox: Checkbox
  }

});