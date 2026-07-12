from rest_framework import viewsets
from .models import Platform, PlatformAccount, PlatformCredential, PlatformFee
from .serializers import (
    PlatformSerializer, PlatformAccountSerializer,
    PlatformCredentialSerializer, PlatformFeeSerializer
)

class PlatformViewSet(viewsets.ModelViewSet):
    queryset = Platform.objects.all()
    serializer_class = PlatformSerializer

class PlatformAccountViewSet(viewsets.ModelViewSet):
    queryset = PlatformAccount.objects.all()
    serializer_class = PlatformAccountSerializer

class PlatformCredentialViewSet(viewsets.ModelViewSet):
    queryset = PlatformCredential.objects.all()
    serializer_class = PlatformCredentialSerializer

class PlatformFeeViewSet(viewsets.ModelViewSet):
    queryset = PlatformFee.objects.all()
    serializer_class = PlatformFeeSerializer
