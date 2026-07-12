from django.db import models

class Platform(models.Model):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'platforms'

class PlatformAccount(models.Model):
    platform_id = models.IntegerField()
    account_name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='active')
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'platform_accounts'
        unique_together = (('platform_id', 'account_name'),)

class PlatformCredential(models.Model):
    platform_account_id = models.BigIntegerField()
    key_type = models.CharField(max_length=30)
    value_encrypted = models.BinaryField()
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'platform_credentials'

class PlatformFee(models.Model):
    platform_id = models.IntegerField()
    category = models.CharField(max_length=100, null=True, blank=True)
    fee_rate = models.DecimalField(max_digits=5, decimal_places=2)
    effective_from = models.DateField()

    class Meta:
        db_table = 'platform_fees'
