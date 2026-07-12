from rest_framework import serializers
from .models import User, Role, Permission, UserRole, RolePermission, AccessLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['password']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        exclude = ['password']

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        exclude = ['password']

class UserRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        exclude = ['password']

class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        exclude = ['password']

class AccessLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessLog
        exclude = ['password']
