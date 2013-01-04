import sbt._
import Keys._

object ApplicationBuild extends Build {

    val appName         = "mergical"
    val appVersion      = "1.0-SNAPSHOT"

    val appDependencies = Seq(
      "play" % "play-jdbc_2.10" % "2.1-RC1",
      "com.typesafe" % "slick_2.10.0-RC1" % "0.11.2",
      "postgresql" % "postgresql" % "9.1-901.jdbc4",
      "org.scalaz" % "scalaz-core_2.10.0-RC2" % "7.0.0-M4"
    )

    val main = play.Project(appName, appVersion, appDependencies).settings(
      scalacOptions += "-feature"
    )

}
