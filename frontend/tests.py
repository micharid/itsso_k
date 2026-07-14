from django.test import TestCase

class FrontendViewsTest(TestCase):
    def test_index_page(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_login_page(self):
        response = self.client.get('/login/')
        self.assertEqual(response.status_code, 200)

    def test_dashboard_page(self):
        response = self.client.get('/dashboard/')
        self.assertEqual(response.status_code, 200)

    def test_orders_page(self):
        response = self.client.get('/orders/')
        self.assertEqual(response.status_code, 200)
