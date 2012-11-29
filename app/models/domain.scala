package models

case class Feed(name: String, url: String)

case class FeedSource(url: String, isPrivate: Boolean)

case class GeneratedFeed(name: String, feeds: Seq[FeedSource])

case class User(id: String, feeds: Seq[Feed], generatedFeeds: Seq[GeneratedFeed])