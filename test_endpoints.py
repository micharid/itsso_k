from django.test import TestCase

# A dummy test to just verify the script runs without loading DB.
class DummyTest(TestCase):
    def test_dummy(self):
        self.assertTrue(True)
