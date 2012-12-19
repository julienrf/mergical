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

  var Feed = function () {};
  Feed.fn = Feed.prototype;
  Feed.fn.hoverEffect = function (isPrivate) {
    this.dom.classList.add('referenced' + (isPrivate ? '-private' : ''));
  };
  Feed.fn.clearHoverEffect = function () {
    this.dom.classList.remove('referenced');
    this.dom.classList.remove('referenced-private');
  };

  var Source = function (ctl, name, url) {
    var remove = el('button', { 'class': 'btn btn-inverse btn-mini' })(
        el('i', { 'class': 'icon-trash icon-white' })()
    );
    this.dom = el('div', { 'class': 'row feed' })(
        el('span', { 'class': 'span3' })(name),
        el('span', { 'class': 'span6' })(url),
        remove
    );

    remove.addEventListener('click', function () {
      ctl.removeClicked();
    });
  };
  Source.prototype = Object.create(Feed.prototype);
  Source.fn = Source.prototype;

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
    this.dom = el('div', { 'class': 'row feed' })(
        el('span', { 'class': 'span3' })(name),
        el('span', { 'class': 'span6' })(
            el('a', { href: url })(url)
        ),
        remove
    );

    remove.addEventListener('click', function () {
      ctl.removeClicked();
    });
    this.dom.addEventListener('mouseover', function () {
      ctl.mouseEntered();
    });
    this.dom.addEventListener('mouseout', function () {
      ctl.mouseLeaved();
    });
  };
  Generator.prototype = Object.create(Feed.prototype);
  Generator.fn = Generator.prototype;

  var Generators = function (ctl, generators) {
    this.ctl = ctl;
    this.addLink = el('a', { href: Routes.controllers.Mergical.addGeneratorForm().url, 'class': 'btn' })('Create a feed');
    this.dom = el('div')(this.addLink);
    var self = this;
    generators.forEach(function (feed) {
      self.append(feed);
    })
  };
  Generators.fn = Generators.prototype;
  Generators.fn.append = function (generator) {
    /*var spinner = this.dom.querySelector('.spinner');
    if (spinner !== null) {
      this.dom.removeChild(spinner);
    }*/
    this.dom.insertBefore(generator.dom, this.addLink);
  };
  Generators.fn.remove = function (generator) {
    this.dom.removeChild(generator.dom);
  };
  /*Generators.fn.showSpinner = function () {
    this.dom.appendChild(
        el('div', { 'class': 'spinner row' })(
            el('div', { 'class': 'progress progress-striped active span9' })(
                el('div', { 'class': 'bar', style: 'width: 100%' })()
            )
        )
    );
  };*/

  /**
   * @param ctl
   * @param {Sources} sources
   * @param {Generators} generators
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


  var SourceEntry = function (ctl, isSelected, name, isPrivate) {
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
  SourceEntry.prototype = Object.create(Feed.prototype);
  SourceEntry.fn = SourceEntry.prototype;
  SourceEntry.fn.showSelected = function (isSelected) {
    this.isSelected.checked = isSelected;
  };
  SourceEntry.fn.showPrivate = function (isPrivate) {
    this.isPrivate.checked = isPrivate;
  };

  var GeneratorEntry = function (ctl, isSelected, name, isPrivate) {
    SourceEntry.call(this, ctl, isSelected, name, isPrivate);
    this.dom.addEventListener('mouseover', function (e) {
      ctl.mouseEntered();
    });
    this.dom.addEventListener('mouseout', function () {
      ctl.mouseLeaved();
    });
  };
  GeneratorEntry.prototype = Object.create(SourceEntry.prototype);
  GeneratorEntry.fn = GeneratorEntry.prototype;

  var GeneratorBuilder = function (ctl, sources, generators) {
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

    this.name = el('input', { type: 'text', required: 'required', placeholder: 'Name' })();
    this.button = el('button', { 'class': 'btn' })('Ok');
    this.form = el('form', { 'class': 'form-horizontal control-group' })(
        this.name,
        this.button
    );

    this.dom = el('div')(
        table,
        this.form
    );

    this.select.el().addEventListener('change', function (e) {
      ctl.selectChanged(e.target.checked);
    });
    this.lock.el().addEventListener('change', function (e) {
      ctl.lockChanged(e.target.checked);
    });
    this.form.addEventListener('submit', function (e) {
      e.preventDefault();
      ctl.formSubmitted({ name: self.name.value });
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



  return {
    FeedForm: FeedForm,
    SourceEntry: SourceEntry,
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