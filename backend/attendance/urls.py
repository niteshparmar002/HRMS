from django.urls import path
from .views import AttendanceListCreateView, AttendanceDetailView, EmployeeAttendanceSummaryView

urlpatterns = [
    path('attendance/', AttendanceListCreateView.as_view(), name='attendance-list-create'),
    path('attendance/<int:pk>/', AttendanceDetailView.as_view(), name='attendance-detail'),
    path('employees/<int:employee_id>/attendance/', EmployeeAttendanceSummaryView.as_view(), name='employee-attendance-summary'),
]
