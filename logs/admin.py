from django.contrib import admin
from .models import SyncLog, DashboardDailyStat

@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'job_type', 'status', 'affected_count', 'started_at', 'finished_at')
    list_filter = ('job_type', 'status')

@admin.register(DashboardDailyStat)
class DashboardDailyStatAdmin(admin.ModelAdmin):
    list_display = ('stat_date', 'platform_id', 'order_count', 'gross_sales', 'total_cost', 'est_margin')
    list_filter = ('platform_id', 'stat_date')
