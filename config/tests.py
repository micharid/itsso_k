from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from products.models import SourceProduct

class AdminAndAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_admin_page_resolves(self):
        # We just check if the admin URL exists and returns a redirect to login or 200
        response = self.client.get('/admin/')
        self.assertIn(response.status_code, [200, 302])

    def test_api_endpoint_resolves(self):
        # Test creating and listing a source product via API
        url = '/api/products/source-products/'
        payload = {
            'supplier_platform_id': 1,
            'supplier_product_code': 'TEST100',
            'name': 'Test Product',
            'cost_price': 10000,
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class APIRoutingTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_roles_endpoint(self):
        response = self.client.get('/api/accounts/roles/')
        # Should return 401 Unauthorized or 403 Forbidden because IsAuthenticated is required globally
        self.assertIn(response.status_code, [401, 403])

    def test_products_endpoint(self):
        response = self.client.get('/api/products/source-products/')
        self.assertIn(response.status_code, [401, 403])
