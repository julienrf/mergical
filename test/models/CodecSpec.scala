package models

import org.specs2.mutable.Specification

class CodecSpec extends Specification {

  "Codec" should {
    "preserve identity law" << {
      ((Codec.encode _) compose Codec.decode)("foo") must equalTo ("foo")
      ((Codec.decode _) compose Codec.encode)(42) must equalTo (42)
    }
    "convert numbers from radix 10 to radix 36" << {
      Codec.toBase36(0) must equalTo ("a")
      Codec.toBase36(36) must equalTo ("ba")
      Codec.toBase36(35) must equalTo ("9")
    }
    "convert numbers from radix 36 to radix 10" << {
      Codec.fromBase36("a") must equalTo (0)
      Codec.fromBase36("9") must equalTo (35)
      Codec.fromBase36("ba") must equalTo (36)
    }
  }
}
