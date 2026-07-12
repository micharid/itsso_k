from django.db import models

class SourceProduct(models.Model):
    supplier_platform_id = models.IntegerField()
    supplier_product_code = models.CharField(max_length=100)
    name = models.CharField(max_length=500)
    category = models.CharField(max_length=100, null=True, blank=True)
    cost_price = models.IntegerField()
    stock_qty = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='active')
    raw_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'source_products'
        unique_together = (('supplier_platform_id', 'supplier_product_code'),)

class SourceProductOption(models.Model):
    source_product_id = models.BigIntegerField()
    option_name = models.CharField(max_length=200)
    cost_price = models.IntegerField(null=True, blank=True)
    stock_qty = models.IntegerField(default=0)
    supplier_option_code = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        db_table = 'source_product_options'

class Listing(models.Model):
    source_product_id = models.BigIntegerField()
    platform_account_id = models.BigIntegerField()
    market_product_id = models.CharField(max_length=100, null=True, blank=True)
    sale_price = models.IntegerField()
    status = models.CharField(max_length=20, default='draft')
    margin_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    listed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'listings'
        unique_together = (('platform_account_id', 'market_product_id'),)

class ListingOption(models.Model):
    listing_id = models.BigIntegerField()
    source_option_id = models.BigIntegerField(null=True, blank=True)
    market_option_id = models.CharField(max_length=100, null=True, blank=True)
    sale_price = models.IntegerField()

    class Meta:
        db_table = 'listing_options'
