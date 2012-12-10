# --- !Ups

CREATE INDEX user_id_sources ON Sources(user_id);
CREATE INDEX user_id_generators ON Generators(user_id);

# --- !Downs

DROP INDEX user_id_sources;
DROP INDEX user_id_generators;