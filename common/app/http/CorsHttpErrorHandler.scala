package http

import com.google.inject.{Provider, Inject}
import model.Cors
import play.api.{Configuration => PlayConfiguration, OptionalSourceMapper, Mode, Environment}
import play.api.http.Status._
import play.api.http.DefaultHttpErrorHandler
import play.api.mvc.{Result, RequestHeader, Results}
import play.api.routing.Router

import scala.concurrent.{Future, ExecutionContext}

class CorsHttpErrorHandler @Inject() (
  environment: Environment,
  configuration: PlayConfiguration,
  sourceMapper: OptionalSourceMapper,
  router: Provider[Router]
)(implicit ec: ExecutionContext) extends DefaultHttpErrorHandler(
  environment = environment,
  configuration = configuration,
  sourceMapper = sourceMapper,
  router = router
) with Results {

  private val varyFields = List("Origin", "Accept")
  private val defaultVaryFields = varyFields.mkString(",")

  override def onServerError(request: RequestHeader, ex: Throwable) = {
    // Overriding onError in Dev can hide helpful Exception messages.
    if (environment.mode == Mode.Dev) {
      super.onServerError(request, ex)
    } else {
      val headers = request.headers
      val vary = headers.get("Vary").fold(defaultVaryFields)(v => (v :: varyFields).mkString(","))

      Future.successful {
        Cors(InternalServerError.withHeaders("Vary" -> vary))(request)
      }
    }
  }

  override def onClientError(request : RequestHeader, statusCode: Int, message: String) : Future[Result] = statusCode match {
    case NOT_FOUND | BAD_REQUEST => super.onClientError(request, statusCode, message).map(Cors(_)(request))
    case _ => super.onClientError(request, statusCode, message)
  }
}