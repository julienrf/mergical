package controllers

import play.api.libs.json.{Json, Writes}
import models.{User, Reference, Generator, Source}

object Serializers {

  implicit val sourceWrites = new Writes[Source]{
    def writes(source: Source) = Json.obj(
      "id" -> source.id,
      "name" -> source.name,
      "url" -> source.url
    )
  }

  implicit val referenceWrites = new Writes[Reference] {
    def writes(ref: Reference) = Json.obj(
      "feed" -> ref.feedId,
      "isPrivate" -> ref.isPrivate
    )
  }

  implicit val generatorWrites = new Writes[Generator] {
    def writes(generator: Generator) = Json.obj(
      "id" -> generator.id,
      "name" -> generator.name,
      "feeds" -> generator.feeds
    )
  }

  implicit val userWrites = new Writes[User] {
    def writes(user: User) = Json.obj(
      "sources" -> user.sources,
      "generators" -> user.generators
    )
  }
}
