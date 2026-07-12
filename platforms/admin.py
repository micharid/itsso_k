from django.contrib import admin
from .models import Platform, PlatformAccount, PlatformCredential, PlatformFee

@admin.register(Platform)
class PlatformAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'name', 'type', 'is_active')
    list_filter = ('type', 'is_active')

@admin.register(PlatformAccount)
class PlatformAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'platform_id', 'account_name', 'status')
    list_filter = ('status',)

@admin.register(PlatformCredential)
class PlatformCredentialAdmin(admin.ModelAdmin):
    list_display = ('id', 'platform_account_id', 'key_type', 'expires_at')

@admin.register(PlatformFee)
class PlatformFeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'platform_id', 'category', 'fee_rate', 'effective_from')
