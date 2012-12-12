package controllers

import play.api.mvc._
import play.api.mvc.Results._
import play.api.libs.openid.OpenID
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.iteratee.{Input, Done}

trait Authentication {

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
  def Authenticated[A](parser: BodyParser[A])(result: AuthenticatedRequest[A] => Result) = EssentialAction { headers =>
    (headers.session.get(authentication.UserId), headers.session.get(authentication.UserName)) match {
      case (Some(userId), Some(name)) =>
        parser(headers).mapDone(_ match {
          case Right(body) => result(new AuthenticatedRequest(Request(headers, body), userId, name))
          case Left(r) => r
        })
      case _ =>
        Done(authentication.onUnauthorized(headers), Input.Empty)
    }
  }

  /**
   * Convenient overload using `BodyParsers.parse.anyContent` body parser
   * @param action Action content
   * @return An authenticated Action
   */
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
    def signIn(userId: String, username: String)(result: PlainResult)(implicit request: RequestHeader) =
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
    def signOut(result: PlainResult)(implicit request: RequestHeader) =
      result.withSession(request.session - UserId - UserName)

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
