from rest_framework import serializers
from .models import SyncLog, DashboardDailyStat

class SyncLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncLog
        fields = '__all__'

class DashboardDailyStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardDailyStat
        fields = '__all__'
