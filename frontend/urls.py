from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),

    path('audit_logs/', views.audit_logs, name='audit_logs'),
    path('automation/', views.automation, name='automation'),
    path('discontinued/', views.discontinued, name='discontinued'),
    path('editor/', views.editor, name='editor'),
    path('editor_v2/', views.editor_v2, name='editor_v2'),
    path('keyword_sourcing/', views.keyword_sourcing, name='keyword_sourcing'),
    path('keywords/', views.keywords, name='keywords'),
    path('market/', views.market, name='market'),
    path('my_product_edit/', views.my_product_edit, name='my_product_edit'),
    path('my_products/', views.my_products, name='my_products'),
    path('orders/', views.orders, name='orders'),
    path('products/', views.products, name='products'),
    path('settings/', views.settings, name='settings'),
    path('statistics/', views.statistics, name='statistics'),
    path('subscriptions/', views.subscriptions, name='subscriptions'),
    path('system_monitoring/', views.system_monitoring, name='system_monitoring'),
    path('users/', views.users, name='users'),
]
