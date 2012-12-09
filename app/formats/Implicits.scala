package formats

import play.api.libs.json.{Writes, Reads, __, Format}
import play.api.libs.functional.syntax._
import models._
import play.api.mvc.RequestHeader

/*object Implicits {

  implicit val feedFormat: Format[Feed] = (
    (__ \ "name").format[String] and
    (__ \ "url").format[String]
  )(Feed.apply _, unlift(Feed.unapply _))


  implicit val feedSourceFormat: Format[FeedSource] = (
    (__ \ "_id").format[ObjectId] and
    (__ \ "url").format[String] and
    (__ \ "isPrivate").format[Boolean]
  )(FeedSource.apply _, unlift(FeedSource.unapply _))


  implicit val generatedFeedRead: Reads[GeneratedFeed] = (
    (__ \ "name").read[String] and
    (__ \ "feeds").read[Seq[FeedSource]]
  )(GeneratedFeed.apply _)


  implicit val userRead: Reads[User] = (
    (__ \ "id").read[String] and
    (__ \ "feeds").read[Seq[Feed]] and
    ((__ \ "generatedFeeds").read[Seq[GeneratedFeed]] orElse Reads.pure(Seq.empty[GeneratedFeed]))
  )(User.apply _)
  implicit def userWrite(implicit w: Writes[GeneratedFeed]): Writes[User] = (
    (__ \ "id").write[String] and
    (__ \ "feeds").write[Seq[Feed]] and
    (__ \ "generatedFeeds").write[Seq[GeneratedFeed]]
  )(unlift(User.unapply _))

}
*/