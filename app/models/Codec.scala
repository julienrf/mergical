package models

/**
 * Encodes and decodes ids (so URLs can look more cryptic)
 * {{{
 *   encode(decode("foo")) == "foo"
 *   decode(encode(42)) == 42
 * }}}
 */
object Codec {

  def decode(value: String): Int = Integer.rotateRight(fromBase36(value), Shift)

  def encode(n: Int): String = toBase36(Integer.rotateLeft(n, Shift))

  def toBase36(n: Int): String = {
    val m = n / 36
    val d = digits(n % 36).toString
    if (m == 0) d
    else toBase36(m) + d
  }

  def fromBase36(v: String): Int =
    v.foldLeft(0) { (value, digit) => value * 36 + digits.indexOf(digit) }

  val Shift = 10

  val digits = ('a' to 'z') ++ ('0' to '9')
}
