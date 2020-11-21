package pme123.camunda.dmn.tester

import java.io.File

import pme123.camunda.dmn.tester.TesterValue.{BooleanValue, NumberValue, StringValue}
import zio.{Task, ZIO}

import scala.language.implicitConversions
import scala.math.BigDecimal

case class DmnConfig(decisionId: String, data: TesterData, dmnPath: List[String])

case class TesterData(
    inputs: List[TesterInput]
) {

  lazy val inputKeys: Seq[String] = inputs.map { case TesterInput(k, _) => k }

  def normalize(): List[Map[String, Any]] = {
    val data = inputs.map(_.normalize())
    cartesianProduct(data).map(_.toMap)
  }

  /**
   * this creates all variations of the inputs you provide
   */
  def cartesianProduct(
      xss: List[(String, List[Any])]
  ): List[List[(String, Any)]] =
    xss match {
      case Nil => List(Nil)
      case (key, v) :: t =>
        for (xh <- v; xt <- cartesianProduct(t)) yield (key -> xh) :: xt
    }
}

case class TesterInput(key: String, values: List[TesterValue]) {
  def normalize(): (String, List[Any]) = {
    val allValues: List[Any] = values.flatMap(_.normalized)
    key -> allValues
  }
}

sealed trait TesterValue {
  def normalized: Set[Any]
}

object TesterValue {

  case class StringValue(value: String) extends TesterValue {
    def normalized: Set[Any] = Set(value)
  }

  case class BooleanValue(value: Boolean) extends TesterValue {
    def normalized: Set[Any] = Set(value)
  }

  case class NumberValue(value: BigDecimal) extends TesterValue {
    def normalized: Set[Any] = Set(value)
  }

  case class ValueSet(values: Set[TesterValue]) extends TesterValue {
    def normalized: Set[Any] = values.flatMap(_.normalized)
  }
}
object hocon {
  import zio.config._
  import zio.config.magnolia.DeriveConfigDescriptor._
  import zio.config.typesafe._
  import zio.config._, ConfigDescriptor._, ConfigSource._

  val stringValue: ConfigDescriptor[TesterValue] =
    (string)(StringValue.apply, StringValue.unapply).asInstanceOf[ConfigDescriptor[TesterValue]]
  val bigDecimalValue: ConfigDescriptor[TesterValue] =
    (bigDecimal)(NumberValue.apply, NumberValue.unapply).asInstanceOf[ConfigDescriptor[TesterValue]]
  val booleanValue: ConfigDescriptor[TesterValue] =
    (boolean)(BooleanValue.apply, BooleanValue.unapply).asInstanceOf[ConfigDescriptor[TesterValue]]

  val testerInput: ConfigDescriptor[TesterInput] =
    (string("key") |@| list("values")(booleanValue orElse bigDecimalValue orElse( stringValue)))(TesterInput.apply, TesterInput.unapply)

  val testerData: ConfigDescriptor[TesterData] =
    (list("inputs") (testerInput))(TesterData.apply, TesterData.unapply)

  val dmnConfig: ConfigDescriptor[DmnConfig] =
    (string("decisionId") |@| nested("data")(testerData) |@| list("dmnPath")(string))(DmnConfig.apply, DmnConfig.unapply)

  def loadConfig(configFile: File): Task[DmnConfig] = {
    ZIO(println(s"load file $configFile")) *>
    TypesafeConfigSource.fromHoconFile(configFile)
      .flatMap(s => ZIO.fromEither(read(dmnConfig from s)))
  }
}

object conversions {

  implicit def stringToTesterValue(x: String): TesterValue =
    TesterValue.StringValue(x)

  implicit def intToTesterValue(x: Int): TesterValue =
    TesterValue.NumberValue(BigDecimal(x))

  implicit def longToTesterValue(x: Long): TesterValue =
    TesterValue.NumberValue(BigDecimal(x))

  implicit def doubleToTesterValue(x: Double): TesterValue =
    TesterValue.NumberValue(BigDecimal(x))

  implicit def booleanToTesterValue(x: Boolean): TesterValue =
    TesterValue.BooleanValue(x)
}