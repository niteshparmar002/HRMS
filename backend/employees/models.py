from django.db import models


DEPARTMENT_CHOICES = [
    ('Engineering', 'Engineering'),
    ('Product', 'Product'),
    ('Design', 'Design'),
    ('Marketing', 'Marketing'),
    ('Sales', 'Sales'),
    ('HR', 'HR'),
    ('Finance', 'Finance'),
    ('Operations', 'Operations'),
    ('Legal', 'Legal'),
    ('Customer Support', 'Customer Support'),
]


class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        db_table = 'employees'

    def __str__(self):
        return f"{self.employee_id} - {self.full_name}"
