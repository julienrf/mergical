import sbt._
import Keys._
import PlayKeys._

object ApplicationBuild extends Build {

    val appName         = "mergical"
    val appVersion      = "1.0-SNAPSHOT"

    val appDependencies = Seq(
      jdbc,
      "com.typesafe" %% "slick" % "1.0.0-RC1",
      "postgresql" % "postgresql" % "9.1-901.jdbc4",
      "org.scalaz" %% "scalaz-core" % "7.0.0-M7",
      "commons-codec" % "commons-codec" % "1.10"
    )

    val main = play.Project(appName, appVersion, appDependencies).settings(
      scalacOptions += "-feature",
      requireJs += "factory.js"
    )

}
