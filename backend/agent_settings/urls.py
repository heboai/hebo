from django.urls import path
from . import views

urlpatterns = [
    path("", views.AgentSettingUpdateView.as_view(), name="agent_setting_update"),
    path("llm-adapters/", views.LLMAdapterListView.as_view(), name="llm_adapter_list"),
    path(
        "llm-adapters/create/",
        views.LLMAdapterCreateView.as_view(),
        name="llm_adapter_create",
    ),
    path(
        "llm-adapters/<int:pk>/delete/",
        views.LLMAdapterDeleteView.as_view(),
        name="llm_adapter_delete",
    ),
]
