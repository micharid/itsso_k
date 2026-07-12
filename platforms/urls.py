from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PlatformViewSet, PlatformAccountViewSet,
    PlatformCredentialViewSet, PlatformFeeViewSet
)

router = DefaultRouter()
router.register(r'platforms', PlatformViewSet)
router.register(r'platform-accounts', PlatformAccountViewSet)
router.register(r'platform-credentials', PlatformCredentialViewSet)
router.register(r'platform-fees', PlatformFeeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
