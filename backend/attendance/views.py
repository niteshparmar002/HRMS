from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Attendance
from .serializers import AttendanceSerializer
from employees.models import Employee
from hrms_backend.pagination import PageNumberPagination


class AttendanceListCreateView(APIView):
    def get(self, request):
        queryset = Attendance.objects.select_related('employee').all()

        employee_id = request.query_params.get('employee_id', '').strip()
        date_from = request.query_params.get('date_from', '').strip()
        date_to = request.query_params.get('date_to', '').strip()
        date = request.query_params.get('date', '').strip()
        status_filter = request.query_params.get('status', '').strip()

        if employee_id:
            queryset = queryset.filter(employee__id=employee_id)

        if date:
            queryset = queryset.filter(date=date)
        else:
            if date_from:
                queryset = queryset.filter(date__gte=date_from)
            if date_to:
                queryset = queryset.filter(date__lte=date_to)

        if status_filter:
            queryset = queryset.filter(status__iexact=status_filter)

        paginator = PageNumberPagination()
        page_qs = paginator.paginate_queryset(queryset, request)
        serializer = AttendanceSerializer(page_qs, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = AttendanceSerializer(data=request.data)
        if serializer.is_valid():
            record = serializer.save()
            return Response(
                {
                    'success': True,
                    'message': 'Attendance marked successfully.',
                    'data': AttendanceSerializer(record).data,
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


class AttendanceDetailView(APIView):
    def get(self, request, pk):
        record = get_object_or_404(Attendance, pk=pk)
        serializer = AttendanceSerializer(record)
        return Response({'success': True, 'data': serializer.data})

    def put(self, request, pk):
        record = get_object_or_404(Attendance, pk=pk)
        serializer = AttendanceSerializer(record, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response({
                'success': True,
                'message': 'Attendance updated successfully.',
                'data': AttendanceSerializer(updated).data,
            })
        return Response(
            {
                'success': False,
                'message': 'Validation failed.',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        record = get_object_or_404(Attendance, pk=pk)
        record.delete()
        return Response(
            {'success': True, 'message': 'Attendance record deleted successfully.'},
            status=status.HTTP_200_OK
        )


class EmployeeAttendanceSummaryView(APIView):
    def get(self, request, employee_id):
        employee = get_object_or_404(Employee, pk=employee_id)
        records = Attendance.objects.filter(employee=employee).order_by('-date')

        total = records.count()
        present = records.filter(status='Present').count()
        absent = records.filter(status='Absent').count()

        serializer = AttendanceSerializer(records, many=True)
        return Response({
            'success': True,
            'employee': {
                'id': employee.id,
                'employee_id': employee.employee_id,
                'full_name': employee.full_name,
                'department': employee.department,
            },
            'summary': {
                'total_days': total,
                'present_days': present,
                'absent_days': absent,
                'attendance_percentage': round((present / total * 100), 1) if total > 0 else 0,
            },
            'data': serializer.data,
        })
