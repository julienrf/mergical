define(['ctl', 'model'], function (ctl, model) {

  /**
   * @param {Function} factory
   * @param {ctl.Source|ctl.Generator} feed
   * @param {Function} b
   * @return {ctl.GeneratorEntry}
   */
  var entry = function (factory, feed, b) {
    return new factory({
      feed: feed,
      isSelected: false,
      isPrivate: false
    }, b)
  };

  /**
   * Build a generator builder from a list of entries data
   * @param {Object} data
   * @param {Object[]} data.sources
   * @param {Object[]} data.generators
   * @return {ctl.GeneratorBuilder}
   */
  var builder = function (data) {
    var f = {
      Sources: model.Seq,
      Source: model.Source,
      Generators: model.Seq,
      Generator: model.Generator,
      Reference: model.Reference,
      GeneratorBuilder: ctl.GeneratorBuilder,
      SourceEntry: ctl.SourceEntry,
      GeneratorEntry: ctl.GeneratorEntry
    };
    var ss = sources(data.sources, f);
    var self = new f.GeneratorBuilder({
      name: '',
      sources: ss.items().map(function (s) { return entry(f.SourceEntry, s, function () { return self }) }),
      generators: generators(data.generators, ss.items(), f).items().map(function (g) { return entry(f.GeneratorEntry, g, function () { return self }) })
    });
    return self
  };

  /**
   * @param {Object} data
   * @param {Int} data.feed
   * @param {Boolean} data.isPrivate
   * @param {Source[]} sources
   * @param {Generator[]} generators
   * @return {ctl.Reference}
   */
  var reference = function (data, sources, generators, f) {
    var ss = sources.filter(function (s) { return s.id() === data.feed });
    var feed = ss.length !== 0 ? ss[0] : generators.filter(function (g) { return g.id() === data.feed })[0];
    return new f.Reference({
      isPrivate: data.isPrivate,
      feed: feed
    })
  };

  /**
   * @param data
   * @param {Function} seq Owning sequence
   * @return {ctl.Generator}
   */
  var generator = function (data, seq, f) {
    return new f.Generator({
      id: data.id,
      name: data.name,
      feeds: data.feeds
    }, seq)
  };

  /**
   * @param {Object[]} data
   * @param {Source[]} sources
   * @return {ctl.Generators}
   */
  var generators = function (data, sources, f) {

    /**
     * @param {Object} g Generator data
     * @param {Source[]} sources
     * @param {Generator[]} visited
     * @return {Object[]} References of `g` that have not yet been processed
     */
    var unsortedRefs = function (g, sources, visited) {
      return g.feeds.filter(function (ref) {
        var inSources = function (r) { return sources.some(function (s) { return s.id() === r.feed }) };
        var inGenerators = function (r) { return visited.some(function (v) { return v.id() === r.feed }) };
        // Keep only references not pointing to sources nor to already visited generators
        return !inSources(ref) && !inGenerators(ref)
      })
    };

    var sort = function (g, sources, visited) {
      if (visited.some(function (v) { return v.id() === g.id })) {
        return visited
      }

      var refs = unsortedRefs(g, sources, visited);
      var gs = refs.length !== 0 ?
          // Some feeds referenced by this generator remain unsorted
          refs.map(function (ref) { return data.filter(function (g) { return g.id === ref.feed })[0] })
              .reduce(function (visited, g) { return sort(g, sources, visited) }, visited)
          : visited;

      gs.push(generator({
                      id: g.id,
                      name: g.name,
                      feeds: g.feeds.map(function (data) { return reference(data, sources, gs, f) })
                    }, function () { return self }, f));
      return gs;
    };

    var self = new f.Generators({
      items: data.reduce(function (gs, g) { return sort(g, sources, gs) }, [])
    });
    return self
  };

  /**
   * @param data
   * @param {Number} data.id
   * @param {String} data.name
   * @param {String} data.url
   * @return {ctl.Source}
   */
  var source = function (data, fs, f) {
    return new f.Source({
      id: data.id,
      name: data.name,
      url: data.url
    }, fs)
  };

  /**
   * @param {Object[]} data
   * @return {ctl.Sources}
   */
  var sources = function (data, f) {
    var self = new f.Sources({
      items: data.map(function (data) {
        return source(data, function () { return self }, f)
      })
    });
    return self
  };

  /**
   * Build a dashboard from a list of objects describing feeds
   * @param {Object} data List of user data
   * @param {Object[]} data.sources List of sources
   * @param {Object[]} data.generators List of generators
   * @return {ctl.Dashboard} Dashboard
   */
  var dashboard = function (data) {
    var f = {
      Sources: ctl.Sources,
      Source: ctl.Source,
      Generators: ctl.Generators,
      Generator: ctl.Generator,
      Reference: ctl.Reference,
      Dashboard: ctl.Dashboard
    };
    var ss = sources(data.sources, f);
    return new f.Dashboard({
      generators: generators(data.generators, ss.items(), f),
      sources: ss
    });
  };

  return {
    dashboard: dashboard,
    builder: builder
  }

});