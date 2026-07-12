from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path


urlpatterns = [
    path("api/", include("api.urls")),
]

# Serve media files in both development and production (for ephemeral /tmp/media support on Vercel)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

