"""
Unit tests for the Employees API.

Run with:
    python manage.py test employees
"""
import datetime
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import Employee


def make_employee(**kwargs):
    """Helper to create an employee with sensible defaults."""
    defaults = {
        'employee_id': 'EMP001',
        'full_name': 'Alice Smith',
        'email': 'alice@example.com',
        'department': 'Engineering',
    }
    defaults.update(kwargs)
    return Employee.objects.create(**defaults)


class EmployeeListTest(TestCase):
    """GET /api/employees/ — list and search."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('employee-list-create')
        make_employee(employee_id='EMP001', full_name='Alice Smith', email='alice@example.com', department='Engineering')
        make_employee(employee_id='EMP002', full_name='Bob Jones',  email='bob@example.com',   department='HR')

    def test_list_returns_200(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

    def test_list_returns_all_employees(self):
        res = self.client.get(self.url)
        self.assertEqual(res.data['total'], 2)

    def test_search_by_name(self):
        res = self.client.get(self.url, {'search': 'Alice'})
        self.assertEqual(res.data['total'], 1)
        self.assertEqual(res.data['data'][0]['full_name'], 'Alice Smith')

    def test_search_by_employee_id(self):
        res = self.client.get(self.url, {'search': 'EMP002'})
        self.assertEqual(res.data['total'], 1)
        self.assertEqual(res.data['data'][0]['employee_id'], 'EMP002')

    def test_filter_by_department(self):
        res = self.client.get(self.url, {'department': 'HR'})
        self.assertEqual(res.data['total'], 1)
        self.assertEqual(res.data['data'][0]['full_name'], 'Bob Jones')

    def test_search_no_match_returns_empty(self):
        res = self.client.get(self.url, {'search': 'nonexistent'})
        self.assertEqual(res.data['total'], 0)
        self.assertEqual(res.data['data'], [])

    def test_pagination_fields_present(self):
        res = self.client.get(self.url)
        for field in ('total', 'total_pages', 'current_page', 'has_next', 'has_previous', 'data'):
            self.assertIn(field, res.data)

    def test_pagination_page_size(self):
        # Create 5 more employees
        for i in range(3, 8):
            make_employee(
                employee_id=f'EMP00{i}',
                full_name=f'User {i}',
                email=f'user{i}@example.com',
                department='Engineering',
            )
        res = self.client.get(self.url, {'page': 1, 'page_size': 3})
        self.assertEqual(len(res.data['data']), 3)
        self.assertTrue(res.data['has_next'])


class EmployeeCreateTest(TestCase):
    """POST /api/employees/ — create with valid and invalid data."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('employee-list-create')
        self.valid_payload = {
            'employee_id': 'EMP100',
            'full_name': 'Carol White',
            'email': 'carol@example.com',
            'department': 'Design',
        }

    def test_create_employee_success(self):
        res = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['data']['full_name'], 'Carol White')

    def test_create_employee_persisted_in_db(self):
        self.client.post(self.url, self.valid_payload, format='json')
        self.assertTrue(Employee.objects.filter(employee_id='EMP100').exists())

    def test_create_missing_required_fields(self):
        res = self.client.post(self.url, {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['success'])

    def test_create_invalid_email(self):
        payload = {**self.valid_payload, 'email': 'not-an-email'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data['errors'])

    def test_create_duplicate_employee_id(self):
        self.client.post(self.url, self.valid_payload, format='json')
        payload2 = {**self.valid_payload, 'email': 'other@example.com'}
        res = self.client.post(self.url, payload2, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('employee_id', res.data['errors'])

    def test_create_duplicate_email(self):
        self.client.post(self.url, self.valid_payload, format='json')
        payload2 = {**self.valid_payload, 'employee_id': 'EMP999'}
        res = self.client.post(self.url, payload2, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data['errors'])

    def test_create_short_full_name(self):
        payload = {**self.valid_payload, 'full_name': 'A'}
        res = self.client.post(self.url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('full_name', res.data['errors'])


class EmployeeDeleteTest(TestCase):
    """DELETE /api/employees/{id}/ — delete and 404 on missing."""

    def setUp(self):
        self.client = APIClient()
        self.employee = make_employee()
        self.url = reverse('employee-detail', args=[self.employee.id])

    def test_delete_employee_success(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

    def test_delete_removes_from_db(self):
        self.client.delete(self.url)
        self.assertFalse(Employee.objects.filter(id=self.employee.id).exists())

    def test_delete_nonexistent_returns_404(self):
        url = reverse('employee-detail', args=[99999])
        res = self.client.delete(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_employee_by_id(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['employee_id'], self.employee.employee_id)
