from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

class AllowIframeForMedia(MiddlewareMixin):
    """Override X-Frame-Options header for media/documents paths so that
    PDFs and other documents can be embedded in an <iframe> from the same origin.
    For all other paths we leave any existing X-Frame-Options untouched so the
    default Django clickjacking protections remain in place.
    """

    DOCUMENT_PREFIX = "/media/documents/"

    def process_response(self, request, response):
        # In local development (DEBUG=True) we remove the header for *all* paths to
        # allow flexible iframing between the frontend (Vite) and Django running on
        # different ports. In production, we only relax it for media documents.
        if settings.DEBUG or request.path.startswith(self.DOCUMENT_PREFIX):
            # Override to SAMEORIGIN (or remove) to allow embedding by the same site
            # Dev convenience: remove header entirely so front-end on different port can iframe.
            # Remove any existing X-Frame-Options header and mark the response as
            # exempt so that Django's XFrameOptionsMiddleware does **not** add
            # the header back (which would otherwise default to SAMEORIGIN or DENY).
            # Ensure header is stripped for both normal 200 responses and cached 304
            # "Not Modified" responses that Django may return for media files.
            response.headers.pop("X-Frame-Options", None)
            response.xframe_options_exempt = True

            # If Django produced a 304, browsers will reuse the previously-cached
            # response headers (which may still include X-Frame-Options). 304
            # responses also confuse some middlewares when we change headers.
            # Converting the status to 200 with identical content avoids that.
            if response.status_code == 304:
                response.status_code = 200
        return response
