package models

/**
 * Encodes and decodes ids (so URLs can look more cryptic)
 * {{{
 *   encode(decode("foo")) == "foo"
 *   decode(encode(42)) == 42
 * }}}
 */
object Codec {

  def decode(value: String): Int = fromBase36(value) ^ Mask

  def encode(n: Int): String = toBase36(n ^ Mask)

  def toBase36(n: Int): String = {
    val m = n / 36
    val d = digits(n % 36).toString
    if (m == 0) d
    else toBase36(m) + d
  }

  def fromBase36(v: String): Int =
    v.foldLeft(0) { (value, digit) => value * 36 + digits.indexOf(digit) }

  val Mask = 0x12345678

  val digits = ('a' to 'z') ++ ('0' to '9')
}
