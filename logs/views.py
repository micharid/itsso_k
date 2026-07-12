from rest_framework import viewsets
from .models import SyncLog, DashboardDailyStat
from .serializers import SyncLogSerializer, DashboardDailyStatSerializer

class SyncLogViewSet(viewsets.ModelViewSet):
    queryset = SyncLog.objects.all()
    serializer_class = SyncLogSerializer

class DashboardDailyStatViewSet(viewsets.ModelViewSet):
    queryset = DashboardDailyStat.objects.all()
    serializer_class = DashboardDailyStatSerializer
