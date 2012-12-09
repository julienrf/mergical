package controllers

import play.api._
import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import libs.json.{JsString, JsObject, Json}
import play.api.Play.current
import models._
import play.api.libs.concurrent.Execution.Implicits._
import scala.concurrent.future
import Serializers._

object Mergical extends Controller with GoogleOAuth2 {

  /**
   * Landing page
   */
  val index = Action {
    Ok(views.html.index())
  }

  /**
   * User dashboard: show iCal feeds and feed generator
   */
  val dashboard = Authenticated { implicit request =>
    Ok(views.html.dashboard(request.username, Json.toJson(User.byId(request.userId))))
  }

  /**
   * Sign user out
   */
  val signOut = Action { implicit request =>
    authentication.signOut(Redirect(routes.Mergical.index()))
  }

  /**
   * Add a feed to a user
   * @param name Name for the feed
   * @param url Feed URL to add
   * @return The source id if the operation was successful, otherwise 500
   */
  def addFeed(name: String, url: String) = Authenticated { implicit request =>
      Source.add(request.userId, name, url) match {
        case Some(id) => Ok(Json.toJson(id))
        case None => InternalServerError
      }
  }

  /**
   * Remove a feed to a user
   * @param id Id of the feed to remove
   * @return 200 if the operation was successful, otherwise 500
   */
  def removeFeed(id: Int) = Authenticated { implicit request =>
    if (Source.remove(request.userId, id)) Ok else InternalServerError
  }

  /**
   * @param id Feed id
   * @return The generated feed
   */
  def generator(id: Int) = Action { implicit request =>
    Async {
      Generator.getSources(id) match {
        case Some(feed) => VCalendar(feed).map(Ok(_).as("text/calendar;charset="+implicitly[Codec].charset))
        case None => future(NotFound)
      }
    }
  }

  val generatorForm = Form[(String, Seq[(Int, Boolean)])](tuple(
    "name" -> nonEmptyText,
    "entries" -> seq(tuple(
      "feed" -> number,
      "private" -> boolean
    ))
  ))

  def addGeneratorForm(name: String) = Authenticated { implicit request =>
    Ok(views.html.addGeneratorForm(request.username, Json.toJson(User.byId(request.userId)).as[JsObject] + ("name" -> JsString(name))))
  }

  /**
   * Add a generator for the current user
   * @return The generator id if the operation was successful, otherwise 500
   */
  val addGenerator = Authenticated { implicit request =>
    generatorForm.bindFromRequest.fold(
      { _ => BadRequest },
      { case (name, entries) =>
        Generator.add(request.userId, name, entries) match {
          case Some(id) => Ok(Json.toJson(id))
          case None => InternalServerError
        }
      }
    )
  }

  /**
   * Remove a generator of the current user (if he owns it)
   * @param id Generator id
   * @return 200 if successful, otherwise 500
   */
  def removeGenerator(id: Int) = Authenticated { implicit request =>
    if (Generator.remove(request.userId, id)) Ok else InternalServerError
  }

  val jsRoutes = Action { implicit request =>
    Ok(Routes.javascriptRouter("Routes")(
      routes.javascript.Mergical.addFeed,
      routes.javascript.Mergical.removeFeed,
      routes.javascript.Mergical.addGenerator,
      routes.javascript.Mergical.removeGenerator,
      routes.javascript.Mergical.generator,
      routes.javascript.Mergical.addGeneratorForm,
      routes.javascript.Mergical.dashboard
    )).as(JAVASCRIPT)
  }

  /**
   * Authentication configuration
   */
  val authentication = new Authentication {

    def RedirectUri(implicit request: RequestHeader) = routes.Mergical.authenticate().absoluteURL()

    def onSuccess(implicit request: RequestHeader) = Redirect(routes.Mergical.dashboard())

    override def onUnauthorized(implicit request: RequestHeader) = Redirect(loginUrl)

    val ClientId = Play.configuration.getString("OAUTH_CLIENTID").getOrElse(sys.error("Configuration key 'OAUTH_CLIENTID' is not set!"))
    val ClientSecret = Play.configuration.getString("OAUTH_CLIENTSECRET").getOrElse(sys.error("Configuration key 'OAUTH_CLIENTSECRET' is not set!"))
  }
}