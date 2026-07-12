from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SourceProductViewSet, SourceProductOptionViewSet,
    ListingViewSet, ListingOptionViewSet
)

router = DefaultRouter()
router.register(r'source-products', SourceProductViewSet)
router.register(r'source-product-options', SourceProductOptionViewSet)
router.register(r'listings', ListingViewSet)
router.register(r'listing-options', ListingOptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
