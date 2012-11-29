package models

import concurrent.Future
import concurrent.future
import play.api.libs.json.{JsArray, Json, JsValue}
import reactivemongo.api.QueryBuilder
import reactivemongo.bson.handlers.DefaultBSONHandlers._
import play.modules.reactivemongo.ReactiveMongoPlugin
import play.modules.reactivemongo.PlayBsonImplicits._
import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._
import formats.Implicits._

object State {

  private lazy val db = ReactiveMongoPlugin.db
  private lazy val users = db("users")
  private lazy val generators = db("generators")

  def userById(id: String): Future[User] =
    for (maybeJson <- users.find[JsValue](QueryBuilder().query(Json.obj("id" -> id))).headOption) yield {
      val existingUser = for {
        json <- maybeJson
        user <- json.asOpt[User]
      } yield user
      existingUser getOrElse User(id, Seq.empty, Seq.empty)
    }

  def addFeed(userId: String, name: String, url: String): Future[Boolean] =
    for (result <- users.update(Json.obj("id" -> userId), Json.obj("$push" -> Json.obj("feeds" -> Json.obj("name" -> name, "url" -> url))), upsert = true))
    yield result.ok

  // TODO Use a feed identifier instead of its URL
  def removeFeed(userId: String, url: String): Future[Boolean] =
    for (result <- users.update(Json.obj("id" -> userId), Json.obj("$pull" -> Json.obj("feeds" -> Json.obj("url" -> url)))))
    yield result.ok

  // TODO Really use a feed id
  def generator(userId: String, feedId: String): Future[Option[GeneratedFeed]] =
    for (maybeJson <- users.find[JsValue](QueryBuilder().query(Json.obj("id" -> userId))).headOption) yield {
      for {
        json <- maybeJson
        user <- json.asOpt[User]
        generator <- user.generatedFeeds.find(_.name == feedId)
      } yield generator
    }

  def addGenerator(userId: String, name: String, entries: Seq[(String, Boolean)]): Future[Boolean] =
    for {
      result <- users.update(
        Json.obj("id" -> userId),
        Json.obj("$push" -> Json.obj("generatedFeeds" -> Json.obj("name" -> name, "feeds" -> JsArray(for ((url, locked) <- entries) yield Json.obj("url" -> url, "isPrivate" -> locked)))))
      )
    } yield result.ok

  // TODO Really use a feed id
  def removeGenerator(userId: String, generatorId: String): Future[Boolean] =
    for {
      result <- users.update(
        Json.obj("id" -> userId),
        Json.obj("$pull" -> Json.obj("generatedFeeds" -> Json.obj("name" -> generatorId)))
      )
    } yield result.ok

}
