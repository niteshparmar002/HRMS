"""
Unit tests for the Attendance API.

Run with:
    python manage.py test attendance
"""
import datetime
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from employees.models import Employee
from .models import Attendance


def make_employee(employee_id='EMP001', full_name='Alice Smith',
                  email='alice@example.com', department='Engineering'):
    return Employee.objects.create(
        employee_id=employee_id,
        full_name=full_name,
        email=email,
        department=department,
    )


def make_attendance(employee, date=None, att_status='Present'):
    if date is None:
        date = timezone.now().date()
    return Attendance.objects.create(employee=employee, date=date, status=att_status)


class AttendanceCreateTest(TestCase):
    """POST /api/attendance/ — mark attendance."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('attendance-list-create')
        self.employee = make_employee()
        self.today = str(timezone.now().date())

    def test_mark_present_success(self):
        payload = {'employee': self.employee.id, 'date': self.today, 'status': 'Present'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['data']['status'], 'Present')

    def test_mark_absent_success(self):
        payload = {'employee': self.employee.id, 'date': self.today, 'status': 'Absent'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['status'], 'Absent')

    def test_mark_attendance_persisted(self):
        payload = {'employee': self.employee.id, 'date': self.today, 'status': 'Present'}
        self.client.post(self.url, payload, format='json')
        self.assertTrue(
            Attendance.objects.filter(employee=self.employee, date=self.today).exists()
        )

    def test_missing_fields_returns_400(self):
        res = self.client.post(self.url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['success'])

    def test_invalid_status_returns_400(self):
        payload = {'employee': self.employee.id, 'date': self.today, 'status': 'OnLeave'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_future_date_returns_400(self):
        future = str(timezone.now().date() + datetime.timedelta(days=1))
        payload = {'employee': self.employee.id, 'date': future, 'status': 'Present'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nonexistent_employee_returns_400(self):
        payload = {'employee': 99999, 'date': self.today, 'status': 'Present'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AttendanceDuplicateTest(TestCase):
    """Duplicate attendance (same employee + date) must be rejected."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('attendance-list-create')
        self.employee = make_employee()
        self.today = str(timezone.now().date())
        make_attendance(self.employee, timezone.now().date(), 'Present')

    def test_duplicate_attendance_rejected(self):
        payload = {'employee': self.employee.id, 'date': self.today, 'status': 'Absent'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['success'])

    def test_different_date_allowed(self):
        yesterday = str(timezone.now().date() - datetime.timedelta(days=1))
        payload = {'employee': self.employee.id, 'date': yesterday, 'status': 'Present'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


class AttendanceListFilterTest(TestCase):
    """GET /api/attendance/ — list with filters."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('attendance-list-create')
        self.emp1 = make_employee('EMP001', 'Alice', 'alice@ex.com', 'Engineering')
        self.emp2 = make_employee('EMP002', 'Bob', 'bob@ex.com', 'HR')
        self.today = timezone.now().date()
        self.yesterday = self.today - datetime.timedelta(days=1)
        make_attendance(self.emp1, self.today, 'Present')
        make_attendance(self.emp1, self.yesterday, 'Absent')
        make_attendance(self.emp2, self.today, 'Absent')

    def test_list_all_returns_200(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total'], 3)

    def test_filter_by_employee(self):
        res = self.client.get(self.url, {'employee_id': self.emp1.id})
        self.assertEqual(res.data['total'], 2)

    def test_filter_by_status_present(self):
        res = self.client.get(self.url, {'status': 'Present'})
        self.assertEqual(res.data['total'], 1)

    def test_filter_by_status_absent(self):
        res = self.client.get(self.url, {'status': 'Absent'})
        self.assertEqual(res.data['total'], 2)

    def test_filter_by_exact_date(self):
        res = self.client.get(self.url, {'date': str(self.today)})
        self.assertEqual(res.data['total'], 2)

    def test_pagination_fields_present(self):
        res = self.client.get(self.url)
        for field in ('total', 'total_pages', 'current_page', 'has_next', 'data'):
            self.assertIn(field, res.data)


class AttendanceDeleteTest(TestCase):
    """DELETE /api/attendance/{id}/"""

    def setUp(self):
        self.client = APIClient()
        self.employee = make_employee()
        self.record = make_attendance(self.employee)
        self.url = reverse('attendance-detail', args=[self.record.id])

    def test_delete_success(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

    def test_delete_removes_from_db(self):
        self.client.delete(self.url)
        self.assertFalse(Attendance.objects.filter(id=self.record.id).exists())

    def test_delete_nonexistent_returns_404(self):
        url = reverse('attendance-detail', args=[99999])
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class EmployeeAttendanceSummaryTest(TestCase):
    """GET /api/employees/{id}/attendance/ — summary endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.employee = make_employee()
        today = timezone.now().date()
        make_attendance(self.employee, today, 'Present')
        make_attendance(self.employee, today - datetime.timedelta(days=1), 'Present')
        make_attendance(self.employee, today - datetime.timedelta(days=2), 'Absent')
        self.url = reverse('employee-attendance-summary', args=[self.employee.id])

    def test_summary_returns_200(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_summary_correct_counts(self):
        res = self.client.get(self.url)
        summary = res.data['summary']
        self.assertEqual(summary['total_days'], 3)
        self.assertEqual(summary['present_days'], 2)
        self.assertEqual(summary['absent_days'], 1)

    def test_summary_attendance_percentage(self):
        res = self.client.get(self.url)
        self.assertAlmostEqual(res.data['summary']['attendance_percentage'], 66.7)

    def test_summary_nonexistent_employee_returns_404(self):
        url = reverse('employee-attendance-summary', args=[99999])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
