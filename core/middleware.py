from django.utils.deprecation import MiddlewareMixin

class AllowIframeForMedia(MiddlewareMixin):
    """Override X-Frame-Options header for media/documents paths so that
    PDFs and other documents can be embedded in an <iframe> from the same origin.
    For all other paths we leave any existing X-Frame-Options untouched so the
    default Django clickjacking protections remain in place.
    """

    DOCUMENT_PREFIX = "/media/documents/"

    def process_response(self, request, response):
        if request.path.startswith(self.DOCUMENT_PREFIX):
            # Override to SAMEORIGIN (or remove) to allow embedding by the same site
            # Dev convenience: remove header entirely so front-end on different port can iframe.
            response.headers.pop("X-Frame-Options", None)
        return response
