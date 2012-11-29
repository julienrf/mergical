package controllers

import play.api._
import play.api.data.Form
import play.api.data.Forms._
import play.api.mvc._
import play.api.libs.json.{__, Writes, Json}
import play.api.Play.current
import models.{GeneratedFeed, VCalendar, State}
import play.api.libs.concurrent.Execution.Implicits._
import formats.Implicits._
import scala.concurrent.future

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
    Async {
      for (user <- State.userById(request.userId)) yield {
        implicit def generatedFeedWrite: Writes[GeneratedFeed] = new Writes[GeneratedFeed] {
          def writes(gf: GeneratedFeed) = generatedFeedToJson(gf.name)
        }
        Ok(views.html.dashboard(request.username, Json.toJson(user)))
      }
    }
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
   * @return 200 if the operation was successful, otherwise 500
   */
  def addFeed(name: String, url: String) = Authenticated { implicit request =>
    Async {
      State.addFeed(request.userId, name, url) map toHttpStatus
    }
  }

  /**
   * Remove a feed to a user
   * @param url URL of the feed to remove
   * @return 200 if the operation was successful, otherwise 500
   */
  def removeFeed(url: String) = Authenticated { implicit request =>
    Async {
      State.removeFeed(request.userId, url) map toHttpStatus
    }
  }

  /**
   * @param userId User id
   * @param feedId Feed id
   * @return The generated feed
   */
  def generator(userId: String, feedId: String) = Action { implicit request =>
    Async {
      State.generator(userId, feedId).flatMap(_ match {
        case Some(feed) => VCalendar(feed).map(Ok(_).as("text/calendar;charset="+implicitly[Codec].charset))
        case None => future(NotFound)
      })
    }
  }

  val generatorForm = Form[(String, Seq[(String, Boolean)])](tuple(
    "name" -> nonEmptyText,
    "entries" -> seq(tuple(
      "url" -> nonEmptyText,
      "private" -> boolean
    ))
  ))
  val addGenerator = Authenticated { implicit request =>
    Async {
      generatorForm.bindFromRequest.fold(
        { _ => future(BadRequest) },
        { case (name, entries) =>
          for (added <- State.addGenerator(request.userId, name, entries)) yield {
            if (added) Ok(generatedFeedToJson(name))
            else InternalServerError
          }
        }
      )
    }
  }

  def removeGenerator(id: String) = Authenticated { implicit request =>
    Async {
      State.removeGenerator(request.userId, id) map toHttpStatus
    }
  }

  /**
   * @param b condition
   * @return `Ok` if `b` is true, otherwise `InternalServerError`
   */
  def toHttpStatus(b: Boolean): Status = if (b) Ok else InternalServerError

  val jsRoutes = Action { implicit request =>
    Ok(Routes.javascriptRouter("Routes")(
      routes.javascript.Mergical.addFeed,
      routes.javascript.Mergical.removeFeed,
      routes.javascript.Mergical.addGenerator,
      routes.javascript.Mergical.removeGenerator
    )).as(JAVASCRIPT)
  }

  def generatedFeedToJson[A](name: String)(implicit request: AuthenticatedRequest[A]) =
    Json.obj("name" -> name, "url" -> routes.Mergical.generator(request.userId, name).absoluteURL())

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