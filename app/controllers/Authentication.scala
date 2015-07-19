package controllers

import org.apache.commons.codec.binary.Base64
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.ws.WS
import play.api.mvc._

import scala.concurrent.Future
import scala.util.Try

object Authentication extends Controller {

  val authorizationEndpoint: String = "https://accounts.google.com/o/oauth2/v2/auth"
  val tokenEndpoint: String = "https://www.googleapis.com/oauth2/v4/token"
  val clientId = play.api.Play.current.configuration.getString("oauth.clientId").getOrElse(sys.error("Missing 'oauth.clientId' configuration key"))
  val clientSecret = play.api.Play.current.configuration.getString("oauth.clientSecret").getOrElse(sys.error("Missing 'oauth.clientSecret' configuration key"))

  val UserId = "user_id"
  val UserName = "user_name"

  def authInfo(headers: RequestHeader) =
    for {
      id <- headers.session.get(UserId)
      name <- headers.session.get(UserName)
    } yield (id, name)

  def Authenticated[A](parser: BodyParser[A])(action: AuthenticatedRequest[A] => Result): EssentialAction =
    Security.Authenticated(authInfo, onUnauthorized) {
      case (id, name) => Action(parser)(request => action(new AuthenticatedRequest(request, id, name)))
    }

  def Authenticated(action: AuthenticatedRequest[AnyContent] => Result): EssentialAction =
    Authenticated(BodyParsers.parse.anyContent)(action)

  val signinCallback = Action { implicit request =>
    Async {
      request.getQueryString("code") match {
        case Some(code) =>
          val returnTo = request.getQueryString("state") getOrElse controllers.routes.Mergical.dashboard().url
          for {
            response <- WS.url(tokenEndpoint).post(Map(
              "code" -> Seq(code),
              "client_id" -> Seq(clientId),
              "client_secret" -> Seq(clientSecret),
              "redirect_uri" -> Seq(controllers.routes.Authentication.signinCallback().absoluteURL()),
              "grant_type" -> Seq("authorization_code")
            ))
            result <- (__ \ "id_token").read[String].reads(response.json).fold(
              _ => Future.failed(new Exception("Missing access token.")),
              idToken => {
                Try {
                  val (userId, username) =
                    Json.parse(new String(Base64.decodeBase64(idToken.split("\\.")(1)))).validate(
                      (
                        (__ \ "sub").read[String] ~
                        (__ \ "email").read[String]
                      ).tupled
                    ).get
                  Future.successful(signIn(userId, username)(Redirect(returnTo)))
                }.getOrElse(Future.failed(new Exception("Unable to decode JWT")))
              }
            )
          } yield result
        case None =>
          Future.failed(new Exception("Missing 'code' parameter."))
      }
    }
  }

  class AuthenticatedRequest[A](request: Request[A], val userId: String, val username: String) extends WrappedRequest[A](request)

    /**
     * Sign a user in the session.
     * Example:
     * {{{
     *   Action { implicit request =>
     *     … // get access token and user id
     *     signIn(accessToken, userId)(Ok)
     *   }
     * }}}
     */
    def signIn(userId: String, username: String)(result: Result)(implicit request: RequestHeader) =
      result.withSession(request.session + (UserId -> userId) + (UserName -> username))

    /**
     * Sign a user out of the session.
     * Example:
     * {{{
     *   Action { implicit request =>
     *     signOut(Ok("You’ve been signed out"))
     *   }
     * }}}
     * @param result HTTP result holding the session
     * @param request HTTP request holding the session
     */
    def signOut(result: Result)(implicit request: RequestHeader) =
      result.withSession(request.session - UserId - UserName)

    /**
     * @return HTTP result to return if an unauthenticated user tries to access a protected resource
     */
    def onUnauthorized(request: RequestHeader): Result = Redirect(authorizeUrl(request.uri)(request))

    /**
     * @return HTTP result to return if the authentication process failed
     */
    def onFailure(implicit request: RequestHeader): Result = InternalServerError

    def authorizeUrl(returnTo: String)(implicit headers: RequestHeader): String = {
      import java.net.URLEncoder.encode
      authorizationEndpoint ++
      Seq(
        "response_type" -> "code",
        "client_id" -> clientId,
        "redirect_uri" -> controllers.routes.Authentication.signinCallback().absoluteURL(),
        "scope" -> "openid email profile",
        "state" -> returnTo
      ).map { case (n, v) => s"""${encode(n, "utf-8")}=${encode(v, "utf-8")}""" }.mkString("?", "&", "")
    }

}
