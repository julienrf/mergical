# --- !Ups


CREATE TABLE Feeds (
  id SERIAL PRIMARY KEY
);

CREATE TABLE Sources (
  id INTEGER NOT NULL REFERENCES Feeds(id) ON DELETE CASCADE PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL
);

CREATE TABLE Generators (
  id INTEGER NOT NULL REFERENCES Feeds(id) ON DELETE CASCADE PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE GeneratorFeeds (
  generator_id INTEGER NOT NULL REFERENCES Generators(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL,
  feed_id INTEGER REFERENCES Feeds(id) ON DELETE CASCADE,
  PRIMARY KEY (generator_id, feed_id)
);


# --- !Downs

DROP TABLE GeneratorFeeds;
DROP TABLE Generators;
DROP TABLE Sources;
DROP TABLE Feeds;