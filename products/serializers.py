from rest_framework import serializers
from .models import SourceProduct, SourceProductOption, Listing, ListingOption

class SourceProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourceProduct
        fields = '__all__'

class SourceProductOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourceProductOption
        fields = '__all__'

class ListingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = '__all__'

class ListingOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingOption
        fields = '__all__'
