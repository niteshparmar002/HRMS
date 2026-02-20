from rest_framework import serializers
from django.utils import timezone
from .models import Attendance
from employees.models import Employee


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_id_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_code',
            'department', 'date', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_employee(self, value):
        if not Employee.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Employee not found.")
        return value

    def validate_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Attendance date cannot be in the future.")
        return value

    def validate_status(self, value):
        if value not in ['Present', 'Absent']:
            raise serializers.ValidationError("Status must be 'Present' or 'Absent'.")
        return value

    def validate(self, data):
        employee = data.get('employee')
        date = data.get('date')
        instance = self.instance

        if employee and date:
            qs = Attendance.objects.filter(employee=employee, date=date)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f"Attendance for this employee on {date} has already been marked."
                )
        return data
