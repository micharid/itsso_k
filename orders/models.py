from django.db import models

class Order(models.Model):
    platform_account_id = models.BigIntegerField()
    market_order_no = models.CharField(max_length=100)
    order_status = models.CharField(max_length=30)
    buyer_name = models.CharField(max_length=100, null=True, blank=True)
    receiver_name = models.CharField(max_length=100, null=True, blank=True)
    receiver_phone = models.CharField(max_length=30, null=True, blank=True)
    receiver_address = models.TextField(null=True, blank=True)
    total_amount = models.IntegerField()
    raw_payload = models.JSONField()
    ordered_at = models.DateTimeField()
    synced_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'orders'
        unique_together = (('platform_account_id', 'market_order_no'),)

class OrderItem(models.Model):
    order_id = models.BigIntegerField()
    listing_id = models.BigIntegerField(null=True, blank=True)
    source_product_id = models.BigIntegerField(null=True, blank=True)
    product_name = models.CharField(max_length=500)
    option_name = models.CharField(max_length=200, null=True, blank=True)
    quantity = models.IntegerField()
    unit_sale_price = models.IntegerField()
    unit_cost_price = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'order_items'

class PurchaseOrder(models.Model):
    order_item_id = models.BigIntegerField()
    supplier_platform_id = models.IntegerField()
    supplier_order_no = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=30, default='pending')
    ordered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'purchase_orders'

class Shipment(models.Model):
    purchase_order_id = models.BigIntegerField()
    courier_code = models.CharField(max_length=30, null=True, blank=True)
    tracking_no = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=30, default='ready')
    shipped_at = models.DateTimeField(null=True, blank=True)
    sent_to_market = models.BooleanField(default=False)

    class Meta:
        db_table = 'shipments'
