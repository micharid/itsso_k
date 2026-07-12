from django.db import models

class User(models.Model):
    email = models.EmailField(unique=True, max_length=255)
    password_hash = models.CharField(max_length=255)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

class Role(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'roles'

class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'permissions'

class UserRole(models.Model):
    user_id = models.BigIntegerField()
    role_id = models.IntegerField()

    class Meta:
        db_table = 'user_roles'
        unique_together = (('user_id', 'role_id'),)

class RolePermission(models.Model):
    role_id = models.IntegerField()
    permission_id = models.IntegerField()

    class Meta:
        db_table = 'role_permissions'
        unique_together = (('role_id', 'permission_id'),)

class AccessLog(models.Model):
    user_id = models.BigIntegerField(null=True, blank=True)
    action = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'access_logs'
