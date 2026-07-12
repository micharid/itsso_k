from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SyncLogViewSet, DashboardDailyStatViewSet

router = DefaultRouter()
router.register(r'sync-logs', SyncLogViewSet)
router.register(r'dashboard-stats', DashboardDailyStatViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
