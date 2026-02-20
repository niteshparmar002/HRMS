from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    attendance_count = serializers.SerializerMethodField(read_only=True)
    present_days = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'email',
            'department', 'created_at', 'updated_at',
            'attendance_count', 'present_days'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_attendance_count(self, obj):
        return obj.attendances.count()

    def get_present_days(self, obj):
        return obj.attendances.filter(status='Present').count()

    def validate_employee_id(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Employee ID cannot be empty.")
        instance = self.instance
        qs = Employee.objects.filter(employee_id=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        instance = self.instance
        qs = Employee.objects.filter(email=value)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An employee with this email already exists.")
        return value

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Full name must be at least 2 characters.")
        return value

    def validate_department(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Department cannot be empty.")
        return value
