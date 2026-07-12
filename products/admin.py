from django.contrib import admin
from .models import SourceProduct, SourceProductOption, Listing, ListingOption

@admin.register(SourceProduct)
class SourceProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier_product_code', 'name', 'cost_price', 'stock_qty', 'status')
    list_filter = ('status', 'supplier_platform_id')
    search_fields = ('supplier_product_code', 'name')

@admin.register(SourceProductOption)
class SourceProductOptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'source_product_id', 'option_name', 'cost_price', 'stock_qty')
    search_fields = ('option_name',)

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('id', 'source_product_id', 'platform_account_id', 'market_product_id', 'sale_price', 'status')
    list_filter = ('status', 'platform_account_id')
    search_fields = ('market_product_id',)

@admin.register(ListingOption)
class ListingOptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing_id', 'market_option_id', 'sale_price')
