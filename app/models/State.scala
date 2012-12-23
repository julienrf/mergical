package models

import scala.slick.driver.PostgresDriver.simple._
import scala.slick.jdbc.StaticQuery.interpolation

// BIG TODO Separate queries from their execution (handle sessions properly)

object DB {
  lazy val db = Database.forDataSource(play.api.db.DB.getDataSource()(play.api.Play.current))
}
import DB._

case class User(sources: List[Source], generators: List[Generator])

object User {
  /**
   * @param userId User id
   * @return The user data
   */
  def byId(userId: String): User = db withSession { implicit s =>
    User(Source.forUser(userId), Generator.filtering(_.user === userId))
  }
}

sealed trait Feed {
  def id: String
}

object Feed extends Table[Int]("feeds") {
  def id = column[Int]("id")
  def create(implicit s: Session): Option[Int] = sql"""INSERT INTO Feeds DEFAULT VALUES RETURNING id""".as[Int].firstOption
  def * = id
}

case class Source(id: String, name: String, url: String) extends Feed

object Source extends Table[(Int, String, String, String)]("sources") {
  def id = column[Int]("id")
  def user = column[String]("user_id")
  def name = column[String]("name")
  def url = column[String]("url")
  def * = id ~ user ~ name ~ url

  def tupled(s: (Int, String, String)): Source = Source(Codec.encode(s._1), s._2, s._3)

  def forUser(id: String): List[Source] = db withSession { implicit s =>
    (for (s <- Source if s.user === id) yield (s.id, s.name, s.url)).list map Source.tupled
  }

  /**
   * @param user User id
   * @param name Feed name
   * @param url iCal feed URL
   * @return The id of the created source (ore `None` if the operation failed)
   */
  def add(user: String, name: String, url: String): Option[String] = db withSession { implicit s =>
    // TODO Delete the created feed if something went wrong during the creation of the source
    for {
      id <- Feed.create
      insertedRows = Source.insert(id, user, name, url)
      if insertedRows == 1
    } yield Codec.encode(id)
  }

  /**
   * @param user Id of the user owning the feed
   * @param id Id of the source to remove
   * @return true if the deletion was successful, false otherwise (for example if the feed to delete was not owned by the given user (han, I’m entangling concerns))
   */
  def remove(user: String, id: String): Boolean = db withSession { implicit s =>
    val dbId = Codec.decode(id)
    Source.where(s => s.user === user && s.id === dbId).firstOption.isDefined && Feed.where(_.id === dbId).delete == 1
  }
}

case class Generator(id: String, name: String, feeds: List[Reference]) extends Feed

object Generator extends Table[(Int, String, String)]("generators") {
  def id = column[Int]("id")
  def user = column[String]("user_id")
  def name = column[String]("name")
  def * = id ~ user ~ name

  def tupled(g: (Int, String, List[Reference])) = Generator(Codec.encode(g._1), g._2, g._3)

  def filtering(p: Generator.type => Column[Boolean]): List[Generator] = db withSession { implicit s =>
    (for {
      (g, f) <- Generator innerJoin Reference on (_.id === _.generatorId)
      if p(g)
    } yield ((g.id, g.name), (f.feedId, f.isPrivate))).list.groupBy(_._1).mapValues(_.map(r => Reference.tupled(r._2))).map { case ((id, name), feeds) => Generator(Codec.encode(id), name, feeds) }.to[List]
  }

  /**
   * @param id Id of the generator to retrieve
   * @return The generator, if found, otherwise `None`
   */
  def byId(id: String): Option[Generator] = Generator.filtering(_.id === Codec.decode(id)).headOption

  /**
   * @param id Id of the generator to retrieve
   * @return A list of tuples (source, isPrivate) containing each source the given generator refers
   */
  def getSources(id: String): Option[List[(Source, Boolean)]] = db withSession { implicit s =>
    val dbId = Codec.decode(id)
    for (userId <- Generator.where(_.id === dbId).map(_.user).firstOption) yield {
      val user = User.byId(userId)
      val feeds = user.sources ++ user.generators

      // TODO propagate correctly the isPrivate constraint
      def collectSources(references: List[Reference], visited: Set[String]): List[(Source, Boolean)] = {
        val fs = for {
          reference <- references
          if !visited.contains(reference.feedId)
          feed <- feeds.find(_.id == reference.feedId)
        } yield (feed, reference.isPrivate)
        val sources = fs collect { case (s: Source, isPrivate) => (s, isPrivate) }
        val generators = fs collect { case (g: Generator, isPrivate) => (g, isPrivate) }
        generators.foldLeft((sources, visited ++ sources.map(_._1.id))) { case ((ss, vs), p) =>
          (ss ++ collectSources(p._1.feeds, vs), vs + p._1.id)
        }._1
      }

      collectSources(Reference.forGenerator(dbId), Set(id))
    }
  }

  /**
   * @param user User id
   * @param name Generator name
   * @param entries Sequence of tuples (feed-id, is-private)
   * @return The id of the created generator (or `None` if the operation failed)
   */
  def add(user: String, name: String, entries: Seq[(String, Boolean)]): Option[String] = db withSession { implicit s =>
    // TODO Remove created rows if something is wrong before the end
    for {
      id <- Feed.create
      insertedRows = Generator.insert(id, user, name)
      if insertedRows == 1
      insertedRefs = Reference.insertAll((entries map (e => (id, Codec.decode(e._1), e._2))): _*)
      if insertedRefs == Some(entries.size)
    } yield Codec.encode(id)
  }

  /**
   * @param user Id of the user owning the generator to remove
   * @param id Id of the generator to remove
   * @return true if the operation was successful, false otherwise
   */
  def remove(user: String, id: String): Boolean = db withSession { implicit s =>
    val dbId = Codec.decode(id)
    Generator.where(s => s.user === user && s.id === dbId).firstOption.isDefined && Feed.where(_.id === dbId).delete == 1
  }

}

case class Reference(feedId: String, isPrivate: Boolean)

object Reference extends Table[(Int, Int, Boolean)]("generatorfeeds") {
  def generatorId = column[Int]("generator_id")
  def isPrivate = column[Boolean]("is_private")
  def feedId = column[Int]("feed_id")
  def * = generatorId ~ feedId ~ isPrivate

  def tupled(r: (Int, Boolean)) = Reference(Codec.encode(r._1), r._2)

  def forGenerator(id: Int): List[Reference] = db withSession { implicit s =>
    (for (r <- Reference if r.generatorId === id) yield (r.feedId, r.isPrivate)).list map Reference.tupled
  }
}
