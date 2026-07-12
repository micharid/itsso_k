from django.db import models

class SyncLog(models.Model):
    job_type = models.CharField(max_length=30)
    platform_account_id = models.BigIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20)
    affected_count = models.IntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sync_logs'

class DashboardDailyStat(models.Model):
    stat_date = models.DateField()
    platform_id = models.IntegerField()
    order_count = models.IntegerField(default=0)
    gross_sales = models.BigIntegerField(default=0)
    total_cost = models.BigIntegerField(default=0)
    est_margin = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'dashboard_daily_stats'
        unique_together = (('stat_date', 'platform_id'),)
