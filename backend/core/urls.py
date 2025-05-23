"""
URL configuration for hebo project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from schema_graph.views import Schema

from core.api import router as api_router
from core.views import home, health_check, CustomSignupView

urlpatterns = [
    path("", home, name="home"),
    path("health", health_check, name="health_check"),
    path("admin/", admin.site.urls),
    path("accounts/signup/", CustomSignupView.as_view(), name="account_signup"),
    path("accounts/", include("allauth.urls")),
    path("schema/", Schema.as_view()),
    path("stripe/", include("djstripe.urls", namespace="djstripe")),
    path("organizations/", include("hebo_organizations.urls")),
    path("organizations/<str:organization_pk>/knowledge/", include("knowledge.urls")),
    path("organizations/<str:organization_pk>/versions/", include("versions.urls")),
    path(
        "organizations/<str:organization_pk>/agent_settings/",
        include("agent_settings.urls"),
    ),
    path("organizations/<str:organization_pk>/api-keys/", include("api_keys.urls")),
    # API endpoints
    path("api/", include(api_router.urls)),
]
