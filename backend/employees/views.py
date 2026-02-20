from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Employee
from .serializers import EmployeeSerializer
from hrms_backend.pagination import PageNumberPagination


class EmployeeListCreateView(APIView):
    def get(self, request):
        search = request.query_params.get('search', '').strip()
        department = request.query_params.get('department', '').strip()

        queryset = Employee.objects.all()

        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(email__icontains=search)
            )

        if department:
            queryset = queryset.filter(department__iexact=department)

        paginator = PageNumberPagination()
        page_qs = paginator.paginate_queryset(queryset, request)
        serializer = EmployeeSerializer(page_qs, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            employee = serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Employee added successfully.',
                    'data': EmployeeSerializer(employee).data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(
            {
                'success': False,
                'message': 'Validation failed.',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class EmployeeDetailView(APIView):
    def get(self, request, pk):
        employee = get_object_or_404(Employee, pk=pk)
        serializer = EmployeeSerializer(employee)
        return Response({'success': True, 'data': serializer.data})

    def delete(self, request, pk):
        employee = get_object_or_404(Employee, pk=pk)
        name = employee.full_name
        employee.delete()
        return Response(
            {
                'success': True,
                'message': f'Employee "{name}" deleted successfully.',
            },
            status=status.HTTP_200_OK
        )


class DepartmentListView(APIView):
    def get(self, request):
        departments = Employee.objects.values_list('department', flat=True).distinct().order_by('department')
        return Response({
            'success': True,
            'data': list(departments),
        })


class DashboardStatsView(APIView):
    from django.utils import timezone

    def get(self, request):
        from django.utils import timezone
        from attendance.models import Attendance

        today = timezone.now().date()
        total_employees = Employee.objects.count()
        present_today = Attendance.objects.filter(date=today, status='Present').count()
        absent_today = Attendance.objects.filter(date=today, status='Absent').count()
        total_attendance_records = Attendance.objects.count()

        recent_employees = Employee.objects.order_by('-created_at')[:5]
        recent_attendance = Attendance.objects.select_related('employee').order_by('-date', '-id')[:10]

        from attendance.serializers import AttendanceSerializer
        return Response({
            'success': True,
            'data': {
                'total_employees': total_employees,
                'present_today': present_today,
                'absent_today': absent_today,
                'total_attendance_records': total_attendance_records,
                'recent_employees': EmployeeSerializer(recent_employees, many=True).data,
                'recent_attendance': AttendanceSerializer(recent_attendance, many=True).data,
            }
        })
