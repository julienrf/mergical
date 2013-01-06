package models

import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.ws.WS
import concurrent.Future

object VCalendar {

  // “Any sequence of CRLF followed immediately by a single linear white-space character is ignored (i.e., removed) when processing the content type.”
  def unfold(calendar: String): String = calendar.replaceAll("\\r?\\n\\s", "")

  /**
   * @param calendar A calendar
   * @return The sequence of events taken from the calendar
   */
  def groupByEvents(calendar: String): Seq[String] = {
    val begin = "BEGIN:VEVENT\\r?\\n".r
    val end = "END:VEVENT\\r?\\n".r
    def findEvents(fragment: String, found: Seq[String]): (Seq[String], String) = (for {
      m <- begin.findFirstMatchIn(fragment)
      start = fragment.substring(m.start)
      n <- end.findFirstMatchIn(start)
      (event, remaining) = start.splitAt(n.end)
    } yield findEvents(remaining, found :+ event)) getOrElse (found, "")
    findEvents(calendar, Seq.empty)._1
  }

  /**
   * @param events A sequence of events to make private
   * @return The events not marked as TRANSPARENT, without their description
   */
  def discardPrivateEvents(events: Seq[String]): Seq[String] = for {
    event <- events
    if !event.contains("TRANSP:TRANSPARENT")
  } yield {
    (for {
      line <- event.split("\\r?\\n")
      if Seq("BEGIN:VEVENT", "END:VEVENT", "DTSTAMP", "UID", "DTSTART", "DTEND", "DURATION", "FREQ").exists(line.startsWith)
    } yield line + "\r\n").mkString
  }

  /**
   * @param calendars A sequence of calendars
   * @return A single calendar containing the events taken from all calendars
   */
  def merge(calendars: Seq[Seq[String]]): String =
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:MergiCal\r\n" + calendars.flatten.mkString + "END:VCALENDAR\r\n"

  /**
   * @param sources List of tuples (source, isPrivate)
   * @return An enumerator of events in the iCalendar format. The first and last elements of the returned enumerator will contain the header and footer of the feed.
   */
  def apply(sources: List[(Source, Boolean)]): Future[String] = {

    val feeds: Seq[Future[Seq[String]]] = for ((source, isPrivate) <- sources) yield {

      // Fetch the iCal feed
      val rawFeed = WS.url(source.url).get()

      // TODO Get the charset from the response headers
      for (calendar <- rawFeed) yield {
        // Unfold lines and group by events
        val events = groupByEvents(unfold(calendar.body))
        if (isPrivate) discardPrivateEvents(events) else events
      }
    }

    // Merge all the feeds together
    Future.sequence(feeds) map merge
  }

}
