from rest_framework import viewsets
from .models import SourceProduct, SourceProductOption, Listing, ListingOption
from .serializers import (
    SourceProductSerializer, SourceProductOptionSerializer,
    ListingSerializer, ListingOptionSerializer
)

class SourceProductViewSet(viewsets.ModelViewSet):
    queryset = SourceProduct.objects.all()
    serializer_class = SourceProductSerializer

class SourceProductOptionViewSet(viewsets.ModelViewSet):
    queryset = SourceProductOption.objects.all()
    serializer_class = SourceProductOptionSerializer

class ListingViewSet(viewsets.ModelViewSet):
    queryset = Listing.objects.all()
    serializer_class = ListingSerializer

class ListingOptionViewSet(viewsets.ModelViewSet):
    queryset = ListingOption.objects.all()
    serializer_class = ListingOptionSerializer
