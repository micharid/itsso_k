from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def login(request):
    return render(request, 'login.html')

def dashboard(request):
    return render(request, 'pages/dashboard.html')

def audit_logs(request): return render(request, 'pages/audit_logs.html')
def automation(request): return render(request, 'pages/automation.html')
def discontinued(request): return render(request, 'pages/discontinued.html')
def editor(request): return render(request, 'pages/editor.html')
def editor_v2(request): return render(request, 'pages/editor_v2.html')
def keyword_sourcing(request): return render(request, 'pages/keyword_sourcing.html')
def keywords(request): return render(request, 'pages/keywords.html')
def market(request): return render(request, 'pages/market.html')
def my_product_edit(request): return render(request, 'pages/my_product_edit.html')
def my_products(request): return render(request, 'pages/my_products.html')
def orders(request): return render(request, 'pages/orders.html')
def products(request): return render(request, 'pages/products.html')
def settings(request): return render(request, 'pages/settings.html')
def statistics(request): return render(request, 'pages/statistics.html')
def subscriptions(request): return render(request, 'pages/subscriptions.html')
def system_monitoring(request): return render(request, 'pages/system_monitoring.html')
def users(request): return render(request, 'pages/users.html')
