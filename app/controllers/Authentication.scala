package controllers

import play.api.mvc._
import play.api.mvc.Results._
import play.api.libs.openid.OpenID
import play.api.libs.concurrent.Execution.Implicits._

trait Authentication {

  def authInfo(headers: RequestHeader) =
    for {
      id <- headers.session.get(authentication.UserId)
      name <- headers.session.get(authentication.UserName)
    } yield (id, name)

  def Authenticated[A](parser: BodyParser[A])(action: AuthenticatedRequest[A] => Result): EssentialAction =
    Security.Authenticated(authInfo, authentication.onUnauthorized) {
      case (id, name) => Action(parser)(request => action(new AuthenticatedRequest(request, id, name)))
    }

  def Authenticated(action: AuthenticatedRequest[AnyContent] => Result): EssentialAction =
    Authenticated(BodyParsers.parse.anyContent)(action)

  /**
   * Login action. Tries to redirect to Google’s login form.
   */
  val signin = Action { implicit request =>
    Async {
      OpenID.redirectURL(
        "https://www.google.com/accounts/o8/id",
        authentication.CallbackUri,
        Seq("email" -> "http://schema.openid.net/contact/email")
      ) map { url =>
        Redirect(url)
      } recover { case _ =>
        authentication.onFailure
      }
    }
  }

  val signinCallback = Action { implicit request =>
    Async {
      OpenID.verifiedId map { info =>
        authentication.signIn(info.id, info.attributes("email"))(authentication.onSuccess)
      } recover { case _ =>
        authentication.onFailure
      }
    }
  }


  class AuthenticatedRequest[A](request: Request[A], val userId: String, val username: String) extends WrappedRequest[A](request)


  def authentication: AuthSettings

  trait AuthSettings {

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
    def onUnauthorized(request: RequestHeader): Result = Forbidden

    /**
     * @return HTTP result to return if the authentication process failed
     */
    def onFailure(implicit request: RequestHeader): Result = InternalServerError

    /**
     * @return HTTP result to return if the authentication process succeed
     */
    def onSuccess(implicit request: RequestHeader): PlainResult

    /**
     * return_to paramater sent to Google. '''Must''' match the route to the `loginCallback` action.
     * The usual implementation is the following:
     * {{{
     *   def CallbackUri(implicit request: RequestHeader) = routes.Application.loginCallback.absoluteURL()
     * }}}
     */
    def CallbackUri(implicit request: RequestHeader): String

    val UserId = "user_id"
    val UserName = "user_name"
  }
}
