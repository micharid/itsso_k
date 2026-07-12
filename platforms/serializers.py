from rest_framework import serializers
from .models import Platform, PlatformAccount, PlatformCredential, PlatformFee

class PlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = Platform
        fields = '__all__'

class PlatformAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAccount
        fields = '__all__'

class PlatformCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformCredential
        exclude = ['value_encrypted']

class PlatformFeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformFee
        fields = '__all__'
