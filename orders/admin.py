from django.contrib import admin
from .models import Order, OrderItem, PurchaseOrder, Shipment

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'market_order_no', 'order_status', 'buyer_name', 'total_amount', 'ordered_at')
    list_filter = ('order_status', 'platform_account_id')
    search_fields = ('market_order_no', 'buyer_name')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order_id', 'product_name', 'quantity', 'unit_sale_price')
    search_fields = ('product_name',)

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier_order_no', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('supplier_order_no',)

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'purchase_order_id', 'courier_code', 'tracking_no', 'status', 'sent_to_market')
    list_filter = ('status', 'sent_to_market')
    search_fields = ('tracking_no',)
