package controllers

import play.api.mvc._
import play.api.mvc.Results._
import play.api.libs.ws.WS
import play.api.libs.concurrent.Promise
import play.api.libs.concurrent.Execution.Implicits._
import scala.concurrent.Future

// FIXME Use OpenId?
trait GoogleOAuth2 {

  /**
   * Helper to write secured actions.
   * The wrapped action `action` will be called only if the current user is authenticated. Otherwise a redirect to the
   * authentication action will be returned.
   *
   * Example of use:
   * {{{
   *   def securedAction = Authenticated { request =>
   *     Ok(...)
   *   }
   * }}}
   */
  def Authenticated[A](parser: BodyParser[A])(action: AuthenticatedRequest[A] => Result) = Action(parser) { request =>
    (request.session.get(authentication.AccessToken), request.session.get(authentication.UserId), request.session.get(authentication.UserName)) match {
      case (Some(accessToken), Some(userId), Some(name)) => action(new AuthenticatedRequest(request, accessToken, userId, name))
      case _ => authentication.onUnauthorized(request)
    }
  }

  /**
   * Convenient overload using `BodyParsers.parse.anyContent` body parser
   * @param action Action content
   * @return An authenticated Action
   */
  def Authenticated(action: AuthenticatedRequest[AnyContent] => Result): Action[AnyContent] =
    Authenticated(BodyParsers.parse.anyContent)(action)

  /**
   * Handle authentication response from Google
   */
  val authenticate = Action { implicit request =>
  // Exchange an authorization code for an access token
    def accessTokenRequest(code: String) = WS.url("https://accounts.google.com/o/oauth2/token")
      .post(Map("code" -> Seq(code),
      "client_id" -> Seq(authentication.ClientId),
      "client_secret" -> Seq(authentication.ClientSecret),
      "redirect_uri" -> Seq(authentication.RedirectUri),
      "grant_type" -> Seq("authorization_code")))

    // Fetch user info
    def userInfoRequest(accessToken: String) = WS.url("https://www.googleapis.com/oauth2/v1/userinfo")
      .withQueryString("access_token" -> accessToken)
      .get()

    def flatSequence[A](f: Option[Future[Option[A]]]): Future[Option[A]] = Promise.sequence(f).map(_.flatten)

    val maybeSignedInF = flatSequence(for (code <- request.queryString.get("code").flatMap(_.headOption)) yield {
      accessTokenRequest(code).flatMap { accessTokenResponse =>
        flatSequence(for (accessToken <- (accessTokenResponse.json \ "access_token").asOpt[String]) yield {
          for (userInfoResp <- userInfoRequest(accessToken)) yield {
            val json = userInfoResp.json
            for {
              userId <- (json \ "id").asOpt[String]
              name <- (json \ "name").asOpt[String]
            } yield {
              authentication.signIn(accessToken, userId, name)(authentication.onSuccess)
            }
          }
        })
      }
    })

    Async {
      for (maybeSignedIn <- maybeSignedInF) yield maybeSignedIn.getOrElse(authentication.onFailure)
    }
  }


  class AuthenticatedRequest[A](request: Request[A], val accessToken: String, val userId: String, val username: String) extends WrappedRequest[A](request)


  def authentication: Authentication

  trait Authentication {
    /**
     * @return The URL to redirect the user to login
     */
    def loginUrl(implicit request: RequestHeader, codec: Codec): String = {
      def makeUrl(base: String, params: (String, String)*)(implicit codec: Codec): String = {
        import java.net.URLEncoder.encode
        base + "?" + (for ((key, value) <- params) yield encode(key, codec.charset) + "=" + encode(value, codec.charset)).mkString("&")
      }
      makeUrl("https://accounts.google.com/o/oauth2/auth",
        "response_type" -> "code",
        "client_id" -> ClientId,
        "redirect_uri" -> RedirectUri,
        "scope" -> "https://www.googleapis.com/auth/userinfo.profile")
    }

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
    def signIn(accessToken: String, userId: String, username: String)(result: PlainResult)(implicit request: RequestHeader) =
      result.withSession(request.session + (AccessToken -> accessToken) + (UserId -> userId) + (UserName -> username))

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
    def signOut(result: PlainResult)(implicit request: RequestHeader) =
      result.withSession(request.session - AccessToken - UserId - UserName)

    /**
     * @return HTTP result to return if an unauthenticated user tries to access a protected resource
     */
    def onUnauthorized(implicit request: RequestHeader): Result = Forbidden

    /**
     * @return HTTP result to return if the authentication process failed
     */
    def onFailure(implicit request: RequestHeader): Result = InternalServerError

    /**
     * @return HTTP result to return if the authentication process succeed
     */
    def onSuccess(implicit request: RequestHeader): PlainResult

    /** Application client_id */
    def ClientId: String
    /** Application client_secret */
    def ClientSecret: String
    /**
     * redirect_uri sent to Google. '''Must''' match the route to the `authenticate` action.
     * The usual implementation is the following:
     * {{{
     *   def RedirectUri(implicit request: RequestHeader) = routes.Application.authenticate.absoluteURL()
     * }}}
     */
    def RedirectUri(implicit request: RequestHeader): String

    val AccessToken = "access_token"
    val UserId = "user_id"
    val UserName = "user_name"
  }
}
