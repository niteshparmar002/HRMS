from django.urls import path
from .views import EmployeeListCreateView, EmployeeDetailView, DepartmentListView, DashboardStatsView

urlpatterns = [
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
