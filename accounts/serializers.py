from rest_framework import serializers
from .models import User, Role, Permission, UserRole, RolePermission, AccessLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['password']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = '__all__'

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = '__all__'

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = '__all__'

class AccessLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessLog
        fields = '__all__'
