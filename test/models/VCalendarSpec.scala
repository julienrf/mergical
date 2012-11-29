package models

import org.specs2.mutable.Specification
import play.api.libs.iteratee.{Iteratee, Enumerator}
import play.api.libs.concurrent.Execution.Implicits._
import concurrent.Await
import scala.concurrent.duration.Duration
import language.reflectiveCalls

class VCalendarSpec extends Specification {

  "VCalendar" should {
    "unfold input according to RFC 5545" in {
      val calendar = VCalendar.unfold("foo\r\nbarbaz\r\n bahfoo\nbar\n baz")
      calendar must equalTo ("foo\r\nbarbazbahfoo\nbarbaz")
    }

    "group events" in {
      val calendar = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\nEND:VCALENDAR"
      val events = VCalendar.groupByEvents(calendar)
      events must equalTo (Seq("BEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\n","BEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\n"))
    }

    "merge calendars" in {
      val calendars = Seq(
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n",
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:19970711T170000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:19970710T170000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
      )
      VCalendar.merge(calendars map VCalendar.groupByEvents) must equalTo (
        "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:MergiCal\r\nBEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:19970714T170000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:19970711T170000Z\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART:19970710T170000Z\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
      )
    }

    "discard private events" in {
      val events = Seq("BEGIN:VEVENT\r\nDTSTART:20121225T170000Z\r\nDESCRIPTION:Foo\r\nEND:VEVENT\n\n", "BEGIN:VEVENT\r\nDTSTART:20121111T170000Z\r\nDESCRIPTION:Bar\r\nTRANSP:TRANSPARENT\r\nEND:VEVENT\r\n")
      VCalendar.discardPrivateEvents(events) must equalTo (Seq("BEGIN:VEVENT\r\nDTSTART:20121225T170000Z\r\nEND:VEVENT\r\n"))
    }
  }
}
